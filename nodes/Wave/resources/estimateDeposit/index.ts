import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { businessLocator, enumOptions, resourceLocator, showFor } from '../../shared/descriptions';
import { CURRENCY_FIELDS } from '../../shared/fields';
import {
	compactInput,
	getBusinessId,
	getLocatorValue,
	getRequiredString,
	getResourceId,
} from '../../shared/utils';
import { waveMutation, waveRequest, type WaveMutationOutput } from '../../transport';
import { splitList, toDate } from '../estimate/inputs';
import type { ResourceModule } from '../types';

const RESOURCE = 'estimateDeposit';

export const ESTIMATE_PAYMENT_FIELDS = `
	id
	paymentDate
	createdAt
	modifiedAt
	memo
	amount
	paymentAccountId
	paymentMethod
	paymentDetails { cardType lastFour cardExpiryMonth cardExpiryYear cardSource }
	readonlyUrl
	origin
	state
	transactionType
	paymentProvider
	currency { ${CURRENCY_FIELDS} }
	paymentMethodId
	active
	transactionId
	confirmationCode
	originPaymentId
`;

const estimateLocator = (operations: string[]) =>
	resourceLocator({
		name: 'estimateId',
		displayName: 'Estimate',
		searchMethod: 'searchEstimates',
		resourceLabel: 'estimate',
		description: 'The estimate that the deposit belongs to',
		displayOptions: showFor(RESOURCE, operations),
	});

const paymentIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Deposit ID',
	name: 'estimatePaymentId',
	type: 'string',
	required: true,
	default: '',
	description: 'The Wave API ID of the estimate deposit payment',
	displayOptions: showFor(RESOURCE, operations),
});

const paymentAccountField = (): INodeProperties =>
	resourceLocator({
		name: 'paymentAccountId',
		displayName: 'Payment Account',
		searchMethod: 'searchPaymentAccounts',
		resourceLabel: 'payment account',
		required: false,
		description: 'The account that received the money',
	});

const NEEDS_BUSINESS = ['create', 'get', 'update', 'sendReceipt'];

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an estimate deposit',
				action: 'Delete an estimate deposit',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an estimate deposit',
				action: 'Get an estimate deposit',
			},
			{
				name: 'Record Manual Deposit',
				value: 'create',
				description: 'Record a deposit that a customer paid outside of Wave',
				action: 'Record a manual deposit on an estimate',
			},
			{
				name: 'Send Receipt',
				value: 'sendReceipt',
				description: 'Send the receipt of an estimate deposit by email',
				action: 'Send the receipt of an estimate deposit',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a manual estimate deposit',
				action: 'Update an estimate deposit',
			},
		],
		default: 'create',
	},
	businessLocator(showFor(RESOURCE, NEEDS_BUSINESS)),
	estimateLocator(['create', 'update', 'sendReceipt']),
	paymentIdField(['get', 'update', 'delete', 'sendReceipt']),

	// Record Manual Deposit
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'The date that the customer paid',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { numberPrecision: 2 },
		default: 0,
		description: 'The payment amount in major currency units, for example 123.45',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{
		displayName: 'Payment Method',
		name: 'paymentMethod',
		type: 'options',
		required: true,
		options: enumOptions('EstimatePaymentMethod'),
		default: 'CASH',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: [
			{ ...paymentAccountField() },
			{
				displayName: 'Memo',
				name: 'memo',
				type: 'string',
				default: '',
				description: 'A note about the payment',
			},
		],
	},

	// Update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['update']),
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'The payment amount in major currency units',
			},
			{
				displayName: 'Memo',
				name: 'memo',
				type: 'string',
				default: '',
				description: 'A note about the payment',
			},
			{ ...paymentAccountField() },
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'options',
				options: enumOptions('EstimatePaymentMethod'),
				default: 'CASH',
			},
		],
	},

	// Send Receipt
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. name@example.com',
		description: 'Email addresses that receive the receipt. Separate several with commas.',
		displayOptions: showFor(RESOURCE, ['sendReceipt']),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['sendReceipt']),
		options: [
			{
				displayName: 'Attach PDF',
				name: 'attachPdf',
				type: 'boolean',
				default: false,
				description: 'Whether to attach a PDF to the email',
			},
			{
				displayName: 'CC Myself',
				name: 'ccMyself',
				type: 'boolean',
				default: false,
				description: 'Whether to send a copy to the sender',
			},
			{
				displayName: 'From Address',
				name: 'fromAddress',
				type: 'string',
				default: '',
				description: 'The address that the email comes from',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
			},
		],
	},
];

export const estimateDepositResource: ResourceModule = {
	option: { name: 'Estimate Deposit', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }) {
			const additional = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
			const input = compactInput({
				estimateId: getResourceId.call(this, 'estimateId', itemIndex, 'Estimate'),
				paymentDate: toDate(this.getNodeParameter('paymentDate', itemIndex)),
				amount: this.getNodeParameter('amount', itemIndex) as number,
				paymentMethod: this.getNodeParameter('paymentMethod', itemIndex) as string,
				paymentAccountId: getLocatorValue(additional.paymentAccountId),
				memo: additional.memo as string,
			});
			const output = await waveMutation<WaveMutationOutput & { estimatePayment: IDataObject }>(
				this,
				`mutation($input: EstimateDepositPaymentCreateManualInput!) {
					estimateDepositPaymentCreateManual(input: $input) {
						didSucceed
						inputErrors { code message path }
						estimatePayment { ${ESTIMATE_PAYMENT_FIELDS} }
					}
				}`,
				'estimateDepositPaymentCreateManual',
				input,
				{ itemIndex },
			);
			return output.estimatePayment;
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getRequiredString.call(this, 'estimatePaymentId', itemIndex);
			const data = await waveRequest<{
				business: { estimatePayment: IDataObject | null } | null;
			}>(
				this,
				`query($businessId: ID!, $id: ID!) {
					business(id: $businessId) { estimatePayment(id: $id) { ${ESTIMATE_PAYMENT_FIELDS} } }
				}`,
				{ businessId, id },
				{ itemIndex },
			);
			return data.business?.estimatePayment ?? {};
		},
		async update({ itemIndex }) {
			const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			const input = compactInput({
				id: getRequiredString.call(this, 'estimatePaymentId', itemIndex),
				estimateId: getResourceId.call(this, 'estimateId', itemIndex, 'Estimate'),
				paymentDate: toDate(fields.paymentDate),
				amount: fields.amount as number,
				paymentMethod: fields.paymentMethod as string,
				paymentAccountId: getLocatorValue(fields.paymentAccountId),
				memo: fields.memo as string,
			});
			const output = await waveMutation<WaveMutationOutput & { estimatePayment: IDataObject }>(
				this,
				`mutation($input: EstimateDepositPaymentUpdateManualInput!) {
					estimateDepositPaymentUpdateManual(input: $input) {
						didSucceed
						inputErrors { code message path }
						estimatePayment { ${ESTIMATE_PAYMENT_FIELDS} }
					}
				}`,
				'estimateDepositPaymentUpdateManual',
				input,
				{ itemIndex },
			);
			return output.estimatePayment;
		},
		async delete({ itemIndex }) {
			const id = getRequiredString.call(this, 'estimatePaymentId', itemIndex);
			await waveMutation(
				this,
				`mutation($input: EstimatePaymentDeleteInput!) {
					estimatePaymentDelete(input: $input) { didSucceed inputErrors { code message path } }
				}`,
				'estimatePaymentDelete',
				{ id },
				{ itemIndex },
			);
			return { success: true, id };
		},
		async sendReceipt({ itemIndex }) {
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
			const estimateId = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			const estimatePaymentId = getRequiredString.call(this, 'estimatePaymentId', itemIndex);
			await waveMutation(
				this,
				`mutation($input: EstimateDepositPaymentReceiptSendInput!) {
					estimateDepositPaymentReceiptSend(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'estimateDepositPaymentReceiptSend',
				compactInput({
					estimateId,
					estimatePaymentId,
					to: splitList(this.getNodeParameter('to', itemIndex)),
					subject: options.subject as string,
					message: options.message as string,
					attachPdf: options.attachPdf as boolean,
					ccMyself: options.ccMyself as boolean,
					fromAddress: options.fromAddress as string,
				}),
				{ itemIndex },
			);
			return { success: true, estimateId, estimatePaymentId };
		},
	},
};
