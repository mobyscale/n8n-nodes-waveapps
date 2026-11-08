import type { IDataObject, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { businessLocator, enumOptions, resourceLocator, showFor } from '../../shared/descriptions';
import { getBusinessId, toNodeError } from '../../shared/utils';
import { waveMutation, type WaveMutationOutput } from '../../transport';
import type { ResourceModule } from '../types';
import { type BatchEntry, DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE, planBatches } from './batch';
import { readTransactionDetails } from './input';

const RESOURCE = 'transaction';
const CREATE_OPERATIONS = ['create', 'createMany'];

const CREATE_MUTATION = `mutation($input: MoneyTransactionCreateInput!) {
	moneyTransactionCreate(input: $input) {
		didSucceed
		inputErrors { code message path }
		transaction { id }
	}
}`;

const CREATE_MANY_MUTATION = `mutation($input: MoneyTransactionsCreateInput!) {
	moneyTransactionsCreate(input: $input) {
		didSucceed
		inputErrors { code message path }
		transactions { id }
	}
}`;

interface TransactionCreateOutput extends WaveMutationOutput {
	transaction?: { id: string } | null;
}

interface TransactionsCreateOutput extends WaveMutationOutput {
	transactions?: Array<{ id: string } | null> | null;
}

const show = (extra: Record<string, unknown[]> = {}) => showFor(RESOURCE, CREATE_OPERATIONS, extra);

const salesTaxValues: INodeProperties[] = [
	resourceLocator({
		name: 'salesTaxId',
		displayName: 'Sales Tax',
		searchMethod: 'searchSalesTaxes',
		resourceLabel: 'sales tax',
	}),
	{
		displayName: 'Tax Amount',
		name: 'amount',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'The amount of this tax. It is part of the line amount, not added to it.',
	},
];

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a money transaction, for example an expense or an income',
				action: 'Create a transaction',
			},
			{
				name: 'Create Many',
				value: 'createMany',
				description: 'Create one transaction for each input item in batch requests',
				action: 'Create many transactions',
			},
		],
		default: 'create',
	},
	businessLocator(show()),
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		noDataExpression: true,
		displayOptions: show(),
		options: [
			{
				name: 'Simple',
				value: 'simple',
				description: 'Record an expense or an income with one category account',
			},
			{
				name: 'Advanced',
				value: 'advanced',
				description: 'Set the direction and each line item yourself',
			},
		],
		default: 'simple',
	},
	{
		displayName: 'Type',
		name: 'transactionType',
		type: 'options',
		displayOptions: show({ mode: ['simple'] }),
		options: [
			{
				name: 'Expense',
				value: 'expense',
				description: 'Money goes out of the anchor account into an expense account',
			},
			{
				name: 'Income',
				value: 'income',
				description: 'Money comes into the anchor account from an income account',
			},
		],
		default: 'expense',
	},
	resourceLocator({
		name: 'anchorAccountId',
		displayName: 'Anchor Account',
		searchMethod: 'searchAnchorAccounts',
		resourceLabel: 'account',
		description:
			'The bank, cash or credit card account that the money goes into or out of. Wave calls this side the anchor.',
		displayOptions: show(),
	}),
	{
		displayName: 'Date',
		name: 'date',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'The date of the transaction. Wave keeps only the date.',
		displayOptions: show(),
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Office chairs',
		displayOptions: show(),
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { minValue: 0 },
		default: 0,
		description:
			'The total amount of the transaction, including taxes. Use a positive number. In advanced mode, the line item amounts must add up to this amount.',
		displayOptions: show(),
	},
	{
		displayName: 'Direction',
		name: 'direction',
		type: 'options',
		options: enumOptions('TransactionDirection', {
			names: { DEPOSIT: 'Deposit (Money In)', WITHDRAWAL: 'Withdrawal (Money Out)' },
		}),
		default: 'WITHDRAWAL',
		description: 'Whether the money goes into or out of the anchor account',
		displayOptions: show({ mode: ['advanced'] }),
	},
	resourceLocator({
		name: 'expenseAccountId',
		displayName: 'Expense Account',
		searchMethod: 'searchExpenseAccounts',
		resourceLabel: 'account',
		description: 'The expense category of the transaction',
		displayOptions: show({ mode: ['simple'], transactionType: ['expense'] }),
	}),
	resourceLocator({
		name: 'incomeAccountId',
		displayName: 'Income Account',
		searchMethod: 'searchIncomeAccounts',
		resourceLabel: 'account',
		description: 'The income category of the transaction',
		displayOptions: show({ mode: ['simple'], transactionType: ['income'] }),
	}),
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Line Item',
		default: {},
		description:
			'The category side of the transaction. A line item cannot use a bank, credit card, loan or money in transit account.',
		displayOptions: show({ mode: ['advanced'] }),
		options: [
			{
				displayName: 'Line Item',
				name: 'values',
				values: [
					resourceLocator({
						name: 'accountId',
						displayName: 'Account',
						searchMethod: 'searchAccounts',
						resourceLabel: 'account',
					}),
					{
						displayName: 'Amount',
						name: 'amount',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 0,
						description: 'The amount of the line, including its taxes. Use a positive number.',
					},
					{
						displayName: 'Balance',
						name: 'balance',
						type: 'options',
						options: enumOptions('BalanceType'),
						default: 'INCREASE',
						description:
							'How the account changes. Use Increase for a normal expense or income, and Decrease for a refund.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
					},
					resourceLocator({
						name: 'customerId',
						displayName: 'Customer',
						searchMethod: 'searchCustomers',
						resourceLabel: 'customer',
						required: false,
					}),
					{
						displayName: 'Sales Taxes',
						name: 'taxes',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						placeholder: 'Add Sales Tax',
						default: {},
						options: [{ displayName: 'Sales Tax', name: 'values', values: salesTaxValues }],
					},
				],
			},
		],
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		placeholder: 'e.g. bank-feed-12345',
		description:
			'Your ID for the transaction, for example the ID in the source system. Wave rejects a second transaction with the same External ID, so a repeated run cannot create a duplicate. When empty, the node uses a random ID.',
		displayOptions: show(),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(),
		options: [
			{
				...resourceLocator({
					name: 'customerId',
					displayName: 'Customer',
					searchMethod: 'searchCustomers',
					resourceLabel: 'customer',
					required: false,
				}),
				displayOptions: { show: { '/mode': ['simple'] } },
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
			},
			{
				displayName: 'Sales Taxes',
				name: 'salesTaxes',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Sales Tax',
				default: {},
				description: 'The taxes that are part of the amount',
				displayOptions: { show: { '/mode': ['simple'] } },
				options: [{ displayName: 'Sales Tax', name: 'values', values: salesTaxValues }],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['createMany']),
		options: [
			{
				displayName: 'Batch Size',
				name: 'batchSize',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: MAX_BATCH_SIZE },
				default: DEFAULT_BATCH_SIZE,
				description:
					'The number of transactions in one request. Wave can time out on large batches.',
			},
		],
	},
];

function errorItem(message: string, itemIndex: number, json: IDataObject = {}): INodeExecutionData {
	return { json: { error: message, ...json }, pairedItem: { item: itemIndex } };
}

export const transactionResource: ResourceModule = {
	option: { name: 'Transaction', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const details = readTransactionDetails.call(this, itemIndex);
			const output = await waveMutation<TransactionCreateOutput>(
				this,
				CREATE_MUTATION,
				'moneyTransactionCreate',
				{ businessId, ...details },
				{ itemIndex },
			);
			return { ...output, externalId: details.externalId } as IDataObject;
		},
	},
	batchOperations: {
		async createMany({ items }) {
			const results: INodeExecutionData[][] = items.map(() => []);
			const entries: BatchEntry[] = [];
			const seen = new Set<string>();

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const businessId = getBusinessId.call(this, itemIndex);
					const details = readTransactionDetails.call(this, itemIndex);
					const key = `${businessId} ${details.externalId}`;
					if (seen.has(key)) {
						throw new NodeOperationError(
							this.getNode(),
							`The External ID "${details.externalId}" is used by an earlier item`,
							{ itemIndex },
						);
					}
					seen.add(key);
					entries.push({ itemIndex, businessId, details });
				} catch (error) {
					const nodeError = toNodeError(this.getNode(), error, itemIndex);
					if (!this.continueOnFail()) throw nodeError;
					results[itemIndex].push(errorItem(nodeError.message, itemIndex));
				}
			}

			const options = this.getNodeParameter('options', 0, {}) as IDataObject;
			const batchSize = (options.batchSize as number | undefined) ?? DEFAULT_BATCH_SIZE;

			for (const batch of planBatches(entries, batchSize)) {
				const firstIndex = batch.entries[0].itemIndex;
				try {
					const output = await waveMutation<TransactionsCreateOutput>(
						this,
						CREATE_MANY_MUTATION,
						'moneyTransactionsCreate',
						{
							businessId: batch.businessId,
							transactions: batch.entries.map((entry) => entry.details),
						},
						{ itemIndex: firstIndex },
					);
					const transactions = output.transactions ?? [];
					batch.entries.forEach((entry, position) => {
						results[entry.itemIndex].push({
							json: {
								didSucceed: true,
								transaction: transactions[position] ?? null,
								externalId: entry.details.externalId,
							},
							pairedItem: { item: entry.itemIndex },
						});
					});
				} catch (error) {
					const nodeError = toNodeError(this.getNode(), error, firstIndex);
					if (!this.continueOnFail()) throw nodeError;
					for (const entry of batch.entries) {
						results[entry.itemIndex].push(
							errorItem(nodeError.message, entry.itemIndex, {
								externalId: entry.details.externalId,
							}),
						);
					}
				}
			}

			return results.flat();
		},
	},
};
