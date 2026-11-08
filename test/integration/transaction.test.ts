import type { IDataObject } from 'n8n-workflow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as listSearch from '../../nodes/Wave/methods/listSearch';
import { Wave } from '../../nodes/Wave/Wave.node';
import {
	Cleanup,
	createExecuteContext,
	createLoadOptionsContext,
	getTestBusinessId,
	graphql,
	hasConfig,
	rl,
	runNode,
	uniqueName,
} from './harness';

const TODAY = new Date().toISOString().slice(0, 10);

interface AccountNode {
	id: string;
	subtype: { value: string };
}

async function findAccount(businessId: string, types: string[], subtypes: string[]) {
	const data = await graphql<{
		business: { accounts: { edges: Array<{ node: AccountNode }> } };
	}>(
		`
			query ($id: ID!, $types: [AccountTypeValue!], $subtypes: [AccountSubtypeValue!]) {
				business(id: $id) {
					accounts(page: 1, pageSize: 50, types: $types, subtypes: $subtypes, isArchived: false) {
						edges {
							node {
								id
								subtype {
									value
								}
							}
						}
					}
				}
			}
		`,
		{ id: businessId, types, subtypes },
	);
	const account = data.business.accounts.edges[0]?.node;
	if (!account)
		throw new Error(`The test business has no ${[...types, ...subtypes].join('/')} account`);
	return account.id;
}

function expectCreated(result: IDataObject) {
	expect(result.didSucceed).toBe(true);
	expect((result.transaction as IDataObject).id).toEqual(expect.any(String));
	expect(result.externalId).toEqual(expect.any(String));
}

describe.skipIf(!hasConfig)('transaction', () => {
	const cleanup = new Cleanup();
	let businessId: string;
	let bankId: string;
	let expenseId: string;
	let incomeId: string;
	let salesTaxId: string;
	let customerId: string;

	const base = () => ({
		resource: 'transaction',
		operation: 'create',
		businessId: rl(businessId),
		anchorAccountId: rl(bankId),
		date: TODAY,
		externalId: '',
	});

	beforeAll(async () => {
		businessId = await getTestBusinessId();
		bankId = await findAccount(businessId, [], ['CASH_AND_BANK']);
		expenseId = await findAccount(businessId, [], ['EXPENSE']);
		incomeId = await findAccount(businessId, [], ['INCOME']);

		const tax = await graphql<{ salesTaxCreate: { salesTax: { id: string } } }>(
			`
				mutation ($input: SalesTaxCreateInput!) {
					salesTaxCreate(input: $input) {
						didSucceed
						inputErrors {
							message
						}
						salesTax {
							id
						}
					}
				}
			`,
			{
				input: {
					businessId,
					name: uniqueName('tax'),
					abbreviation: `T${Date.now() % 100000000}`,
					rate: '0.1',
				},
			},
		);
		salesTaxId = tax.salesTaxCreate.salesTax.id;
		cleanup.add('archive sales tax', () =>
			graphql(
				'mutation($input: SalesTaxArchiveInput!) { salesTaxArchive(input: $input) { didSucceed } }',
				{ input: { id: salesTaxId } },
			),
		);

		const customer = await graphql<{ customerCreate: { customer: { id: string } } }>(
			`
				mutation ($input: CustomerCreateInput!) {
					customerCreate(input: $input) {
						didSucceed
						inputErrors {
							message
						}
						customer {
							id
						}
					}
				}
			`,
			{ input: { businessId, name: uniqueName('transaction customer') } },
		);
		customerId = customer.customerCreate.customer.id;
		cleanup.add('delete customer', () =>
			graphql(
				'mutation($input: CustomerDeleteInput!) { customerDelete(input: $input) { didSucceed } }',
				{ input: { id: customerId } },
			),
		);
	});

	afterAll(async () => {
		await cleanup.run();
	});

	it('lists anchor accounts', async () => {
		const result = await listSearch.searchAnchorAccounts.call(
			createLoadOptionsContext({ businessId: rl(businessId) }),
		);
		expect(result.results.map((item) => item.value)).toContain(bankId);
		expect(result.results.map((item) => item.value)).not.toContain(expenseId);
	});

	it('creates an expense with a sales tax', async () => {
		const [result] = await runNode({
			...base(),
			mode: 'simple',
			transactionType: 'expense',
			expenseAccountId: rl(expenseId),
			description: uniqueName('expense'),
			amount: 11,
			additionalFields: {
				notes: 'Created by the integration tests',
				salesTaxes: { values: [{ salesTaxId: rl(salesTaxId), amount: 1 }] },
			},
		});
		expectCreated(result);
	});

	it('creates an income with a customer and rejects a repeated External ID', async () => {
		const externalId = uniqueName('income');
		const parameters = {
			...base(),
			mode: 'simple',
			transactionType: 'income',
			incomeAccountId: rl(incomeId),
			description: uniqueName('income'),
			amount: 2.5,
			externalId,
			additionalFields: { customerId: rl(customerId) },
		};
		const [result] = await runNode(parameters);
		expectCreated(result);
		expect(result.externalId).toBe(externalId);

		await expect(runNode(parameters)).rejects.toThrow('same externalId already exists');
	});

	it('skips a duplicate External ID in Create when Skip Duplicates is on', async () => {
		const externalId = uniqueName('skip');
		const parameters = {
			...base(),
			mode: 'simple',
			transactionType: 'expense',
			expenseAccountId: rl(expenseId),
			description: uniqueName('skip'),
			amount: 1.5,
			externalId,
			additionalFields: {},
		};
		const [first] = await runNode(parameters);
		expectCreated(first);

		const [again] = await runNode({ ...parameters, options: { skipDuplicates: true } });
		expect(again).toEqual({ skipped: true, reason: 'duplicate externalId', externalId });
	});

	it('creates many and skips the entry that exists when Skip Duplicates is on', async () => {
		const prefix = uniqueName('many');
		const existingId = `${prefix}-1`;
		const common = {
			...base(),
			mode: 'simple',
			transactionType: 'expense',
			expenseAccountId: rl(expenseId),
			description: uniqueName('many'),
			amount: 1.75,
			additionalFields: {},
		};
		const [seed] = await runNode({ ...common, externalId: existingId });
		expectCreated(seed);

		const items = [0, 1, 2].map((index) => ({ json: { index } }));
		const context = createExecuteContext(
			{
				...common,
				operation: 'createMany',
				externalId: '={{ $json.index }}',
				options: { skipDuplicates: true },
			},
			items,
		);
		const original = context.getNodeParameter;
		context.getNodeParameter = ((name: string, itemIndex: number, ...rest: unknown[]) =>
			name === 'externalId'
				? `${prefix}-${itemIndex}`
				: (original as (...args: unknown[]) => unknown).call(
						context,
						name,
						itemIndex,
						...rest,
					)) as typeof context.getNodeParameter;
		const [output] = await new Wave().execute.call(context);

		expect(output.map((item) => item.pairedItem)).toEqual([{ item: 0 }, { item: 1 }, { item: 2 }]);
		expect(output.filter((item) => item.json.skipped === true)).toHaveLength(1);
		expect(output[1].json).toEqual({
			skipped: true,
			reason: 'duplicate externalId',
			externalId: existingId,
		});
		expectCreated(output[0].json);
		expectCreated(output[2].json);
	});

	it('skips all rows when the same import runs again with generated External IDs', async () => {
		const description = uniqueName('reimport');
		const rows = [1.11, 2.22].map((amount, index) => ({ json: { amount, index } }));
		const runImport = async () => {
			const context = createExecuteContext(
				{
					...base(),
					operation: 'createMany',
					mode: 'simple',
					transactionType: 'expense',
					expenseAccountId: rl(expenseId),
					description,
					externalId: '',
					additionalFields: {},
					options: { skipDuplicates: true, externalIdWhenEmpty: 'generate' },
				},
				rows,
			);
			const original = context.getNodeParameter;
			context.getNodeParameter = ((name: string, itemIndex: number, ...rest: unknown[]) =>
				name === 'amount'
					? rows[itemIndex].json.amount
					: (original as (...args: unknown[]) => unknown).call(
							context,
							name,
							itemIndex,
							...rest,
						)) as typeof context.getNodeParameter;
			const [output] = await new Wave().execute.call(context);
			return output.map((item) => item.json);
		};

		const first = await runImport();
		first.forEach(expectCreated);
		const second = await runImport();
		expect(second.map((row) => row.skipped)).toEqual([true, true]);
		expect(second.map((row) => row.externalId)).toEqual(first.map((row) => row.externalId));
	});

	it('creates an advanced entry with two line items', async () => {
		const [result] = await runNode({
			...base(),
			mode: 'advanced',
			direction: 'WITHDRAWAL',
			description: uniqueName('advanced'),
			amount: 10,
			lineItems: {
				values: [
					{
						accountId: rl(expenseId),
						amount: 6,
						balance: 'INCREASE',
						description: 'n8n-test line 1',
						taxes: { values: [{ salesTaxId: rl(salesTaxId), amount: 0.5 }] },
					},
					{ accountId: rl(incomeId), amount: 4, balance: 'DECREASE', customerId: rl(customerId) },
				],
			},
			additionalFields: {},
		});
		expectCreated(result);
	});

	it('creates many transactions in batches', async () => {
		const items = Array.from({ length: 3 }, (_, index) => ({ json: { index } }));
		const context = createExecuteContext(
			{
				...base(),
				operation: 'createMany',
				mode: 'simple',
				transactionType: 'expense',
				expenseAccountId: rl(expenseId),
				description: uniqueName('batch'),
				amount: 1.25,
				additionalFields: {},
				options: { batchSize: 2 },
			},
			items,
		);
		const [output] = await new Wave().execute.call(context);

		expect(output.map((item) => item.pairedItem)).toEqual([{ item: 0 }, { item: 1 }, { item: 2 }]);
		for (const item of output) expectCreated(item.json);
		const ids = output.map((item) => (item.json.transaction as IDataObject).id);
		expect(new Set(ids).size).toBe(3);
	});
});
