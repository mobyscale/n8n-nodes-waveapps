import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { businessLocator, enumOptions, resourceLocator, showFor } from '../../shared/descriptions';
import {
	compactInput,
	getBusinessId,
	getLocatorValue,
	getRequiredString,
	getResourceId,
} from '../../shared/utils';
import { waveMutation, waveRequest } from '../../transport';
import { INVOICE_PAYMENT_FIELDS } from '../invoice/fields';
import { splitEmails, toDate } from '../invoice/builders';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'invoicePayment';
const PAYMENT_OPERATIONS = ['get', 'update', 'delete', 'sendReceipt'];

const paymentAccountLocator = (
	overrides: Partial<INodeProperties> = {},
	required = true,
): INodeProperties => ({
	...resourceLocator({
		name: 'paymentAccountId',
		displayName: 'Payment Account',
		searchMethod: 'searchPaymentAccounts',
		resourceLabel: 'payment account',
		required,
	}),
	...overrides,
});

const amountField = (required: boolean): INodeProperties => ({
	displayName: 'Amount',
	name: 'amount',
	type: 'number',
	typeOptions: { numberPrecision: 2 },
	required,
	default: 0,
	description: 'Payment amount in the currency of the invoice',
});

const paymentMethodField = (): INodeProperties => ({
	displayName: 'Payment Method',
	name: 'paymentMethod',
	type: 'options',
	options: enumOptions('InvoicePaymentMethod'),
	default: 'OTHER',
});

const exchangeRateField = (): INodeProperties => ({
	displayName: 'Exchange Rate',
	name: 'exchangeRate',
	type: 'string',
	default: '1',
	description:
		'Rate to the currency of the payment account from the currency of the invoice. Wave uses it only when the two currencies differ.',
});

const memoField = (): INodeProperties => ({
	displayName: 'Memo',
	name: 'memo',
	type: 'string',
	typeOptions: { rows: 3 },
	default: '',
});

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
				description: 'Delete a manual payment of an invoice',
				action: 'Delete an invoice payment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a payment of an invoice',
				action: 'Get an invoice payment',
			},
			{
				name: 'Record Manual Payment',
				value: 'create',
				description: 'Record a payment that a customer made outside of Wave',
				action: 'Record a manual payment for an invoice',
			},
			{
				name: 'Send Receipt',
				value: 'sendReceipt',
				description: 'Send the receipt of a payment by email',
				action: 'Send the receipt of an invoice payment',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a manual payment of an invoice',
				action: 'Update an invoice payment',
			},
		],
		default: 'create',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'invoiceId',
		displayName: 'Invoice',
		searchMethod: 'searchInvoices',
		resourceLabel: 'invoice',
		displayOptions: showFor(RESOURCE, ['create', 'sendReceipt']),
	}),
	resourceLocator({
		name: 'listInvoiceId',
		displayName: 'Invoice',
		searchMethod: 'searchInvoices',
		resourceLabel: 'invoice',
		required: false,
		description: 'Select an invoice to see its payments in the Payment list. Optional.',
		displayOptions: showFor(RESOURCE, ['get', 'update', 'delete']),
	}),
	{
		displayName: 'Payment',
		name: 'paymentId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The payment to work with',
		displayOptions: showFor(RESOURCE, PAYMENT_OPERATIONS),
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a payment...',
				typeOptions: { searchListMethod: 'searchInvoicePayments', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. QnVzaW5lc3M6...',
				hint: 'The Wave API ID of the invoice payment',
			},
		],
	},

	// Create
	{
		...paymentAccountLocator(),
		description: 'The account that receives the payment',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{ ...amountField(true), displayOptions: showFor(RESOURCE, ['create']) },
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{ ...paymentMethodField(), displayOptions: showFor(RESOURCE, ['create']) },
	{ ...exchangeRateField(), displayOptions: showFor(RESOURCE, ['create']) },
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: [memoField()],
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
			amountField(false),
			exchangeRateField(),
			memoField(),
			paymentAccountLocator({}, false),
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
			},
			paymentMethodField(),
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
		description: 'Email addresses that receive the receipt. Separate many addresses with commas.',
		displayOptions: showFor(RESOURCE, ['sendReceipt']),
	},
	{
		displayName: 'Additional Fields',
		name: 'sendFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['sendReceipt']),
		options: [
			{
				displayName: 'Attach PDF',
				name: 'attachPdf',
				type: 'boolean',
				default: false,
				description: 'Whether to attach a PDF of the invoice',
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
				description: 'The email address that sends the receipt',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
			},
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '' },
		],
	},
];

type PaymentOutput = { invoicePayment: IDataObject | null; didSucceed: boolean };

export const invoicePaymentResource: ResourceModule = {
	option: { name: 'Invoice Payment', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }: OperationContext) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const paymentAccountId = getRequiredString.call(this, 'paymentAccountId', itemIndex);
			const fields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
			const output = await waveMutation<PaymentOutput>(
				this,
				`mutation($input: InvoicePaymentCreateManualInput!) {
					invoicePaymentCreateManual(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoicePayment { ${INVOICE_PAYMENT_FIELDS} }
					}
				}`,
				'invoicePaymentCreateManual',
				compactInput({
					invoiceId,
					paymentAccountId,
					amount: String(this.getNodeParameter('amount', itemIndex)),
					paymentDate: toDate(this.getNodeParameter('paymentDate', itemIndex)),
					paymentMethod: this.getNodeParameter('paymentMethod', itemIndex) as string,
					exchangeRate: String(this.getNodeParameter('exchangeRate', itemIndex, '1') || '1'),
					...fields,
				}),
				{ itemIndex },
			);
			return output.invoicePayment ?? {};
		},
		async delete({ itemIndex }) {
			const id = getResourceId.call(this, 'paymentId', itemIndex);
			await waveMutation(
				this,
				`mutation($input: InvoicePaymentDeleteInput!) {
					invoicePaymentDelete(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'invoicePaymentDelete',
				{ id },
				{ itemIndex },
			);
			return { success: true, id };
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getResourceId.call(this, 'paymentId', itemIndex);
			const data = await waveRequest<{ business: { invoicePayment: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $id: ID!) {
					business(id: $businessId) {
						invoicePayment(id: $id) { ${INVOICE_PAYMENT_FIELDS} }
					}
				}`,
				{ businessId, id },
				{ itemIndex },
			);
			return data.business?.invoicePayment ?? {};
		},
		async sendReceipt({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const invoicePaymentId = getResourceId.call(this, 'paymentId', itemIndex);
			const to = splitEmails(this.getNodeParameter('to', itemIndex) as string);
			const fields = this.getNodeParameter('sendFields', itemIndex, {}) as IDataObject;
			await waveMutation(
				this,
				`mutation($input: InvoicePaymentReceiptSendInput!) {
					invoicePaymentReceiptSend(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'invoicePaymentReceiptSend',
				compactInput({ invoiceId, invoicePaymentId, to, ...fields }),
				{ itemIndex },
			);
			return { success: true, invoiceId, invoicePaymentId, to };
		},
		async update({ itemIndex }) {
			const id = getResourceId.call(this, 'paymentId', itemIndex);
			const { paymentAccountId, paymentDate, amount, ...rest } = this.getNodeParameter(
				'updateFields',
				itemIndex,
				{},
			) as IDataObject;
			const output = await waveMutation<PaymentOutput>(
				this,
				`mutation($input: InvoicePaymentPatchInput!) {
					invoicePaymentPatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoicePayment { ${INVOICE_PAYMENT_FIELDS} }
					}
				}`,
				'invoicePaymentPatch',
				compactInput({
					id,
					paymentAccountId: getLocatorValue(paymentAccountId),
					paymentDate: toDate(paymentDate),
					amount: amount === undefined ? undefined : String(amount),
					...rest,
				}),
				{ itemIndex },
			);
			return output.invoicePayment ?? {};
		},
	},
};
