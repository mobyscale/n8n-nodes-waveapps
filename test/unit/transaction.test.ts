import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameterResourceLocator,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { Wave } from '../../nodes/Wave/Wave.node';
import { planBatches, type BatchEntry } from '../../nodes/Wave/resources/transaction/batch';
import {
	buildLineItems,
	buildSimpleTransaction,
	readTransactionDetails,
	toWaveDate,
} from '../../nodes/Wave/resources/transaction/input';

const node = {
	id: '1',
	name: 'Wave',
	type: 'n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

const rl = (value: string): INodeParameterResourceLocator => ({ __rl: true, mode: 'id', value });

const BUSINESS_A = 'QnVzaW5lc3M6YQ==';
const BUSINESS_B = 'QnVzaW5lc3M6Yg==';

/** One parameter set for each item, like expressions that give different values per item. */
function createContext(
	itemParameters: IDataObject[],
	responses: unknown[] = [],
	options: { continueOnFail?: boolean } = {},
) {
	const request = vi.fn();
	for (const response of responses) request.mockResolvedValueOnce(response);
	const context = {
		getInputData: () => itemParameters.map(() => ({ json: {} })),
		getNode: () => node,
		continueOnFail: () => options.continueOnFail ?? false,
		getNodeParameter: (
			name: string,
			itemIndex: number,
			fallback?: unknown,
			parameterOptions?: { extractValue?: boolean },
		) => {
			const parameters: IDataObject = {
				authentication: 'accessToken',
				...itemParameters[itemIndex],
			};
			const value = name in parameters ? parameters[name] : fallback;
			if (parameterOptions?.extractValue && value && typeof value === 'object' && '__rl' in value) {
				return (value as INodeParameterResourceLocator).value;
			}
			return value;
		},
		helpers: { httpRequestWithAuthentication: request },
	} as unknown as IExecuteFunctions;
	return { context, request };
}

function expenseItem(overrides: IDataObject = {}): IDataObject {
	return {
		resource: 'transaction',
		operation: 'createMany',
		businessId: rl(BUSINESS_A),
		mode: 'simple',
		transactionType: 'expense',
		anchorAccountId: rl('bank'),
		expenseAccountId: rl('office'),
		date: '2026-11-01T00:00:00',
		description: 'n8n-test chairs',
		amount: 10,
		externalId: '',
		additionalFields: {},
		...overrides,
	};
}

async function run(context: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const [output] = await new Wave().execute.call(context);
	return output;
}

function batchResponse(ids: string[]) {
	return {
		data: {
			moneyTransactionsCreate: {
				didSucceed: true,
				inputErrors: [],
				transactions: ids.map((id) => ({ id })),
			},
		},
	};
}

describe('simple mode', () => {
	it('maps an expense to a withdrawal that increases the expense account', () => {
		expect(
			buildSimpleTransaction({
				type: 'expense',
				anchorAccountId: 'bank',
				categoryAccountId: 'office',
				amount: '11',
				taxes: [{ salesTaxId: 'tax', amount: '1' }],
			}),
		).toEqual({
			anchor: { accountId: 'bank', amount: '11', direction: 'WITHDRAWAL' },
			lineItems: [
				{
					accountId: 'office',
					amount: '11',
					balance: 'INCREASE',
					taxes: [{ salesTaxId: 'tax', amount: '1' }],
				},
			],
		});
	});

	it('maps an income to a deposit that increases the income account', () => {
		expect(
			buildSimpleTransaction({
				type: 'income',
				anchorAccountId: 'bank',
				categoryAccountId: 'sales',
				amount: '20',
				customerId: 'customer',
			}),
		).toEqual({
			anchor: { accountId: 'bank', amount: '20', direction: 'DEPOSIT' },
			lineItems: [
				{ accountId: 'sales', amount: '20', balance: 'INCREASE', customerId: 'customer' },
			],
		});
	});

	it('reads the node parameters into the Wave input', () => {
		const { context } = createContext([
			expenseItem({
				transactionType: 'income',
				incomeAccountId: rl('sales'),
				amount: 11.5,
				externalId: ' ext-1 ',
				additionalFields: {
					notes: ' a note ',
					customerId: rl('customer'),
					salesTaxes: { values: [{ salesTaxId: rl('tax'), amount: 1.5 }] },
				},
			}),
		]);
		expect(readTransactionDetails.call(context, 0)).toEqual({
			externalId: 'ext-1',
			date: '2026-11-01',
			description: 'n8n-test chairs',
			notes: 'a note',
			anchor: { accountId: 'bank', amount: '11.5', direction: 'DEPOSIT' },
			lineItems: [
				{
					accountId: 'sales',
					amount: '11.5',
					balance: 'INCREASE',
					customerId: 'customer',
					taxes: [{ salesTaxId: 'tax', amount: '1.5' }],
				},
			],
		});
	});

	it('generates an External ID when it is empty', () => {
		const { context } = createContext([expenseItem()]);
		const details = readTransactionDetails.call(context, 0);
		expect(details.externalId).toMatch(/^[0-9a-f-]{36}$/);
		expect(details.notes).toBeUndefined();
	});

	it('fails without a description', () => {
		const { context } = createContext([expenseItem({ description: ' ' })]);
		expect(() => readTransactionDetails.call(context, 0)).toThrow('description');
	});
});

describe('advanced mode', () => {
	it('maps line items with the default balance and nested taxes', () => {
		expect(
			buildLineItems({
				values: [
					{
						accountId: rl('office'),
						amount: 6,
						balance: 'DEBIT',
						description: 'line 1',
						customerId: rl(''),
						taxes: { values: [{ salesTaxId: rl('tax'), amount: 0.5 }] },
					},
					{ accountId: rl('rent'), amount: 4 },
				],
			}),
		).toEqual([
			{
				accountId: 'office',
				amount: '6',
				balance: 'DEBIT',
				description: 'line 1',
				taxes: [{ salesTaxId: 'tax', amount: '0.5' }],
			},
			{ accountId: 'rent', amount: '4', balance: 'INCREASE' },
		]);
	});

	it('reads the anchor direction and fails on a line item without an account', () => {
		const advanced = {
			mode: 'advanced',
			direction: 'DEPOSIT',
			lineItems: { values: [{ accountId: rl('sales'), amount: 10, balance: 'CREDIT' }] },
		};
		const { context } = createContext([
			expenseItem(advanced),
			expenseItem({ ...advanced, lineItems: { values: [{ accountId: rl(''), amount: 1 }] } }),
		]);
		const details = readTransactionDetails.call(context, 0);
		expect(details.anchor).toEqual({ accountId: 'bank', amount: '10', direction: 'DEPOSIT' });
		expect(details.lineItems).toEqual([{ accountId: 'sales', amount: '10', balance: 'CREDIT' }]);
		expect(() => readTransactionDetails.call(context, 1)).toThrow('account for each line item');
	});
});

describe('toWaveDate', () => {
	it('keeps only the date', () => {
		expect(toWaveDate('2026-11-01T23:30:00')).toBe('2026-11-01');
		expect(toWaveDate('2026-11-01')).toBe('2026-11-01');
		expect(toWaveDate(new Date('2026-11-01T10:00:00Z'))).toBe('2026-11-01');
		expect(toWaveDate('')).toBeUndefined();
		expect(toWaveDate('yesterday')).toBeUndefined();
	});
});

describe('planBatches', () => {
	const entry = (itemIndex: number, businessId: string): BatchEntry => ({
		itemIndex,
		businessId,
		details: { externalId: String(itemIndex) } as BatchEntry['details'],
	});

	it('groups by business, keeps the order and splits into batches', () => {
		const batches = planBatches(
			[entry(0, 'a'), entry(1, 'b'), entry(2, 'a'), entry(3, 'a'), entry(4, 'b')],
			2,
		);
		expect(
			batches.map((batch) => [batch.businessId, batch.entries.map((e) => e.itemIndex)]),
		).toEqual([
			['a', [0, 2]],
			['a', [3]],
			['b', [1, 4]],
		]);
	});

	it('limits the batch size', () => {
		const entries = Array.from({ length: 120 }, (_, index) => entry(index, 'a'));
		expect(planBatches(entries, 500).map((batch) => batch.entries.length)).toEqual([50, 50, 20]);
		expect(planBatches(entries.slice(0, 3), 0).map((batch) => batch.entries.length)).toEqual([3]);
	});
});

describe('create many', () => {
	it('sends one request per batch and pairs each result with its item', async () => {
		const items = [
			expenseItem({ externalId: 'e0', options: { batchSize: 2 } }),
			expenseItem({ externalId: 'e1', businessId: rl(BUSINESS_B) }),
			expenseItem({ externalId: 'e2' }),
			expenseItem({ externalId: 'e3' }),
		];
		const { context, request } = createContext(items, [
			batchResponse(['t0', 't2']),
			batchResponse(['t3']),
			batchResponse(['t1']),
		]);

		const output = await run(context);

		expect(request).toHaveBeenCalledTimes(3);
		const inputs = request.mock.calls.map(
			([, options]) =>
				(options as { body: { variables: { input: IDataObject } } }).body.variables.input,
		);
		expect(inputs.map((input) => input.businessId)).toEqual([BUSINESS_A, BUSINESS_A, BUSINESS_B]);
		expect(
			inputs.map((input) =>
				(input.transactions as Array<{ externalId: string }>).map((t) => t.externalId),
			),
		).toEqual([['e0', 'e2'], ['e3'], ['e1']]);

		expect(
			output.map((item) => [item.pairedItem, item.json.transaction, item.json.externalId]),
		).toEqual([
			[{ item: 0 }, { id: 't0' }, 'e0'],
			[{ item: 1 }, { id: 't1' }, 'e1'],
			[{ item: 2 }, { id: 't2' }, 'e2'],
			[{ item: 3 }, { id: 't3' }, 'e3'],
		]);
	});

	it('returns error items for a failed batch and an invalid item with continue on fail', async () => {
		const items = [
			expenseItem({ externalId: 'e0', options: { batchSize: 2 } }),
			expenseItem({ externalId: 'e1', description: '' }),
			expenseItem({ externalId: 'e2' }),
			expenseItem({ externalId: 'e3' }),
			expenseItem({ externalId: 'e0' }),
		];
		const failed = {
			data: {
				moneyTransactionsCreate: {
					didSucceed: false,
					inputErrors: [
						{
							code: 'INVALID',
							message: 'A transaction with the same externalId already exists.',
							path: ['input', 'externalId'],
						},
					],
					transactions: null,
				},
			},
		};
		const { context, request } = createContext(items, [failed, batchResponse(['t3'])], {
			continueOnFail: true,
		});

		const output = await run(context);

		expect(request).toHaveBeenCalledTimes(2);
		expect(
			output.map((item) => [item.pairedItem, item.json.error ?? item.json.transaction]),
		).toEqual([
			[{ item: 0 }, expect.stringContaining('same externalId')],
			[{ item: 1 }, expect.stringContaining('description')],
			[{ item: 2 }, expect.stringContaining('same externalId')],
			[{ item: 3 }, { id: 't3' }],
			[{ item: 4 }, expect.stringContaining('used by an earlier item')],
		]);
	});

	it('throws a node error for a failed batch without continue on fail', async () => {
		const { context } = createContext(
			[expenseItem({ externalId: 'e0' })],
			[{ data: { moneyTransactionsCreate: { didSucceed: false, inputErrors: [] } } }],
		);
		await expect(run(context)).rejects.toBeInstanceOf(NodeApiError);
	});
});
