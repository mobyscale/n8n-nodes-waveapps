import type { IDataObject, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	businessLocator,
	currencyField,
	enumOptions,
	paginationFields,
	resourceLocator,
	showFor,
} from '../../shared/descriptions';
import { afterCreateFields, runAfterCreate } from '../../shared/afterCreate';
import { PAGE_INFO_FIELDS } from '../../shared/fields';
import { downloadPdf } from '../../shared/pdf';
import { buildLineItems, discountsField, itemsField } from '../../shared/lineItems';
import { getProductMatchConfig, resolveItemProducts } from '../../shared/productMatching';
import {
	compactInput,
	getBusinessId,
	getLocatorValue,
	getRequiredString,
	getResourceId,
	splitList,
	toDate,
} from '../../shared/utils';
import { waveGetAll, waveMutation, type WaveConnection } from '../../transport';
import type { OperationContext, ResourceModule } from '../types';
import {
	approveInvoice,
	findInvoiceIdByNumber,
	getInvoice,
	markInvoiceSent,
	sendInvoice,
} from './actions';
import { buildInvoiceFields } from './builders';
import { INVOICE_FIELDS, INVOICE_LIST_FIELDS } from './fields';

const RESOURCE = 'invoice';
const INVOICE_OPERATIONS = [
	'approve',
	'clone',
	'delete',
	'downloadPdf',
	'get',
	'markSent',
	'send',
	'update',
];

const customerLocator = (overrides: Partial<INodeProperties> = {}): INodeProperties => ({
	...resourceLocator({
		name: 'customer',
		displayName: 'Customer',
		searchMethod: 'searchCustomers',
		resourceLabel: 'customer',
		required: false,
	}),
	...overrides,
});

const text = (displayName: string, name: string, description?: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description,
});

const flag = (displayName: string, name: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
});

/** Optional fields that invoiceCreate and invoicePatch share, in alphabetical order by name. */
const sharedOptionalFields: INodeProperties[] = [
	text('Amount Column Title', 'amountTitle', 'Label of the amount column'),
	currencyField({ description: 'Currency of the invoice. Defaults to the business currency.' }),
	flag(
		'Disable American Express Payments',
		'disableAmexPayments',
		'Whether to block payment by American Express',
	),
	flag('Disable Bank Payments', 'disableBankPayments', 'Whether to block payment by bank transfer'),
	flag(
		'Disable Credit Card Payments',
		'disableCreditCardPayments',
		'Whether to block payment by card',
	),
	discountsField({
		typeEnum: 'InvoiceDiscountType',
		description: 'Wave allows one discount for each invoice',
	}),
	{
		displayName: 'Due Date',
		name: 'dueDate',
		type: 'dateTime',
		default: '',
		description: 'Defaults to the payment terms of the business',
	},
	{
		displayName: 'Exchange Rate',
		name: 'exchangeRate',
		type: 'number',
		typeOptions: { numberPrecision: 8 },
		default: 1,
		description: 'Rate to the business currency from the invoice currency',
	},
	text('Footer', 'footer'),
	flag('Hide Amount', 'hideAmount', 'Whether to hide the amount of each item'),
	flag('Hide Description', 'hideDescription', 'Whether to hide the description of each item'),
	flag('Hide Name', 'hideName', 'Whether to hide the product name of each item'),
	flag('Hide Price', 'hidePrice', 'Whether to hide the price of each item'),
	flag('Hide Unit', 'hideUnit', 'Whether to hide the unit of each item'),
	{
		displayName: 'Invoice Date',
		name: 'invoiceDate',
		type: 'dateTime',
		default: '',
		description: 'Defaults to today',
	},
	text('Invoice Number', 'invoiceNumber', 'Defaults to the highest number plus one'),
	text('Item Column Title', 'itemTitle', 'Label of the item column'),
	{ displayName: 'Memo', name: 'memo', type: 'string', typeOptions: { rows: 3 }, default: '' },
	text('PO Number', 'poNumber', 'Purchase order or sales order number'),
	text('Price Column Title', 'priceTitle', 'Label of the price column'),
	flag(
		'Require Terms of Service Agreement',
		'requireTermsOfServiceAgreement',
		'Whether the customer must accept the terms of service',
	),
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: enumOptions('InvoiceCreateStatus'),
		default: 'DRAFT',
	},
	text('Subhead', 'subhead'),
	text('Title', 'title', 'Title at the top of the invoice'),
	text('Unit Column Title', 'unitTitle', 'Label of the unit column'),
];

/** Optional fields of the Send operation. "After Create" with Approve and Send uses them too. */
const sendOptionFields: INodeProperties[] = [
	{
		displayName: 'Attach PDF',
		name: 'attachPDF',
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
	text('From Address', 'fromAddress', 'The email address that sends the invoice'),
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
	},
	text('Subject', 'subject'),
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
				name: 'Approve',
				value: 'approve',
				description: 'Approve a draft invoice',
				action: 'Approve an invoice',
			},
			{
				name: 'Clone',
				value: 'clone',
				description: 'Create a copy of an invoice',
				action: 'Clone an invoice',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an invoice',
				action: 'Create an invoice',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an invoice',
				action: 'Delete an invoice',
			},
			{
				name: 'Download PDF',
				value: 'downloadPdf',
				description: 'Download the PDF of an invoice as binary data',
				action: 'Download an invoice PDF',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an invoice with its items and payments',
				action: 'Get an invoice',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many invoices of a business',
				action: 'Get many invoices',
			},
			{
				name: 'Mark Sent',
				value: 'markSent',
				description: 'Mark an invoice as sent without sending an email',
				action: 'Mark an invoice as sent',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send an invoice by email. The invoice must be approved first.',
				action: 'Send an invoice',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an invoice',
				action: 'Update an invoice',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'invoiceId',
		displayName: 'Invoice',
		searchMethod: 'searchInvoices',
		resourceLabel: 'invoice',
		displayOptions: showFor(RESOURCE, INVOICE_OPERATIONS),
	}),

	// Create
	customerLocator({
		required: true,
		description: 'The customer to invoice',
		displayOptions: showFor(RESOURCE, ['create']),
	}),
	{
		displayName: 'Match Products By Name',
		name: 'matchProductsByName',
		type: 'boolean',
		default: false,
		description:
			'Whether to give each item a product name instead of a product. Wave uses the active product with this name, or creates it.',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{
		...resourceLocator({
			name: 'defaultIncomeAccount',
			displayName: 'Default Income Account',
			searchMethod: 'searchIncomeAccounts',
			resourceLabel: 'income account',
			description: 'The income account of the products that Wave creates for unknown names',
		}),
		displayOptions: showFor(RESOURCE, ['create'], { matchProductsByName: [true] }),
	},
	{
		...itemsField({
			description: 'The line items of the invoice',
			withProductNameMatching: true,
		}),
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
			...sharedOptionalFields,
			{
				displayName: 'Skip If Invoice Number Exists',
				name: 'skipIfInvoiceNumberExists',
				type: 'boolean',
				default: false,
				description:
					'Whether to return the invoice with the same Invoice Number, and not create a new one. Wave does not run the After Create steps then.',
				displayOptions: { show: { invoiceNumber: [{ _cnd: { exists: true } }] } },
			},
		],
	},
	...afterCreateFields(RESOURCE, 'invoice', sendOptionFields),

	// Update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['update']),
		options: [
			customerLocator({ description: 'Move the invoice to this customer' }),
			itemsField({
				description: 'The new line items. They replace all existing items of the invoice.',
			}),
			...sharedOptionalFields,
		],
	},

	// Download PDF
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'The name of the binary field that gets the PDF',
		displayOptions: showFor(RESOURCE, ['downloadPdf']),
	},

	// Mark Sent
	{
		displayName: 'Send Method',
		name: 'sendMethod',
		type: 'options',
		options: enumOptions('InvoiceSendMethod'),
		default: 'MARKED_SENT',
		description: 'How the invoice was sent',
		displayOptions: showFor(RESOURCE, ['markSent']),
	},
	{
		displayName: 'Sent At',
		name: 'sentAt',
		type: 'dateTime',
		default: '',
		description: 'When the invoice was sent. Defaults to now.',
		displayOptions: showFor(RESOURCE, ['markSent']),
	},

	// Send
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. name@example.com, other@example.com',
		description: 'Email addresses that receive the invoice. Separate many addresses with commas.',
		displayOptions: showFor(RESOURCE, ['send']),
	},
	{
		displayName: 'Additional Fields',
		name: 'sendFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['send']),
		options: sendOptionFields,
	},

	// Get Many
	...paginationFields(showFor(RESOURCE, ['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor(RESOURCE, ['getAll']),
		options: [
			{
				displayName: 'Amount Due',
				name: 'amountDue',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'Only invoices with exactly this amount due',
			},
			customerLocator({ description: 'Only invoices of this customer' }),
			currencyField({ description: 'Only invoices in this currency' }),
			{
				displayName: 'Invoice Date End',
				name: 'invoiceDateEnd',
				type: 'dateTime',
				default: '',
				description: 'Only invoices dated on or before this date',
			},
			{
				displayName: 'Invoice Date Start',
				name: 'invoiceDateStart',
				type: 'dateTime',
				default: '',
				description: 'Only invoices dated on or after this date',
			},
			text(
				'Invoice Number',
				'invoiceNumber',
				'Only invoices with a number that contains this text',
			),
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
				description: 'Only invoices modified after this time',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
				description: 'Only invoices modified before this time',
			},
			text('Source ID', 'sourceId', 'Only invoices that were created from this source'),
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: enumOptions('InvoiceStatus'),
				default: 'DRAFT',
			},
		],
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		options: enumOptions('InvoiceSort'),
		default: 'CREATED_AT_DESC',
		description: 'The order of the invoices',
		displayOptions: showFor(RESOURCE, ['getAll']),
	},
];

type InvoiceOutput = { invoice: IDataObject | null; didSucceed: boolean };

export const invoiceResource: ResourceModule = {
	option: { name: 'Invoice', value: RESOURCE },
	description,
	operations: {
		async approve({ itemIndex }: OperationContext) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			return await approveInvoice(this, itemIndex, invoiceId);
		},
		async clone({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const output = await waveMutation<InvoiceOutput>(
				this,
				`mutation($input: InvoiceCloneInput!) {
					invoiceClone(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoice { ${INVOICE_FIELDS} }
					}
				}`,
				'invoiceClone',
				{ invoiceId },
				{ itemIndex },
			);
			return output.invoice ?? {};
		},
		async create({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const customerId = getRequiredString.call(this, 'customer', itemIndex);
			const { skipIfInvoiceNumberExists, ...fields } = this.getNodeParameter(
				'additionalFields',
				itemIndex,
				{},
			) as IDataObject;
			const invoiceNumber = String(fields.invoiceNumber ?? '').trim();
			if (skipIfInvoiceNumberExists && invoiceNumber) {
				const existingId = await findInvoiceIdByNumber(this, itemIndex, businessId, invoiceNumber);
				if (existingId) return await getInvoice(this, itemIndex, businessId, existingId);
			}
			const rawItems = this.getNodeParameter('items', itemIndex, {});
			const matching = getProductMatchConfig(this, itemIndex, businessId);
			const items = buildLineItems(
				matching ? await resolveItemProducts(this, itemIndex, matching, rawItems) : rawItems,
			);
			const output = await waveMutation<InvoiceOutput>(
				this,
				`mutation($input: InvoiceCreateInput!) {
					invoiceCreate(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoice { ${INVOICE_FIELDS} }
					}
				}`,
				'invoiceCreate',
				compactInput({
					businessId,
					customerId,
					...(items.length ? { items } : {}),
					...buildInvoiceFields(fields),
				}),
				{ itemIndex },
			);
			const created = output.invoice ?? {};
			const id = created.id as string | undefined;
			if (!id) return created;
			return await runAfterCreate(this, itemIndex, created, {
				label: 'Invoice',
				id,
				action: this.getNodeParameter('afterCreate', itemIndex, 'draft'),
				run: async (step) => {
					if (step === 'approve') await approveInvoice(this, itemIndex, id);
					else if (step === 'markSent')
						await markInvoiceSent(this, itemIndex, { invoiceId: id, sendMethod: 'MARKED_SENT' });
					else {
						const customer = created.customer as IDataObject | undefined;
						const to = splitList(this.getNodeParameter('afterCreateTo', itemIndex, ''));
						if (to.length === 0 && customer?.email) to.push(String(customer.email));
						if (to.length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'No email address. Fill in Send To, or add an email address to the customer.',
								{ itemIndex },
							);
						}
						const options = this.getNodeParameter('afterCreateSendOptions', itemIndex, {});
						await sendInvoice(this, itemIndex, { invoiceId: id, to, ...(options as IDataObject) });
					}
				},
				reload: () => getInvoice(this, itemIndex, businessId, id),
			});
		},
		async delete({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			await waveMutation(
				this,
				`mutation($input: InvoiceDeleteInput!) {
					invoiceDelete(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'invoiceDelete',
				{ invoiceId },
				{ itemIndex },
			);
			return { success: true, id: invoiceId };
		},
		async downloadPdf({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const invoice = await getInvoice(this, itemIndex, businessId, invoiceId);
			const pdfUrl = invoice.pdfUrl as string | null | undefined;
			if (!pdfUrl) {
				throw new NodeOperationError(this.getNode(), `Invoice ${invoiceId} has no PDF URL`, {
					itemIndex,
				});
			}
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
			const binary = await downloadPdf(
				this,
				pdfUrl,
				`invoice-${String(invoice.invoiceNumber ?? invoiceId.slice(-12))}.pdf`,
			);
			const result: INodeExecutionData = {
				json: { invoiceId, invoiceNumber: invoice.invoiceNumber, pdfUrl },
				binary: { [binaryPropertyName]: binary },
			};
			return [result];
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			return await getInvoice(this, itemIndex, businessId, invoiceId);
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			const sort = this.getNodeParameter('sort', itemIndex, 'CREATED_AT_DESC') as string;
			return await waveGetAll<IDataObject, { business: { invoices: WaveConnection<IDataObject> } }>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!, $sort: [InvoiceSort!]!,
					$status: InvoiceStatus, $customerId: ID, $currency: CurrencyCode, $sourceId: ID,
					$invoiceDateStart: Date, $invoiceDateEnd: Date, $modifiedAtAfter: DateTime,
					$modifiedAtBefore: DateTime, $invoiceNumber: String, $amountDue: Decimal
				) {
					business(id: $businessId) {
						invoices(
							page: $page, pageSize: $pageSize, sort: $sort, status: $status,
							customerId: $customerId, currency: $currency, sourceId: $sourceId,
							invoiceDateStart: $invoiceDateStart, invoiceDateEnd: $invoiceDateEnd,
							modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore,
							invoiceNumber: $invoiceNumber, amountDue: $amountDue
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${INVOICE_LIST_FIELDS} } }
						}
					}
				}`,
				{
					businessId,
					sort: [sort],
					status: filters.status ?? null,
					customerId: getLocatorValue(filters.customer) ?? null,
					currency: filters.currency || null,
					sourceId: filters.sourceId || null,
					invoiceDateStart: toDate(filters.invoiceDateStart) ?? null,
					invoiceDateEnd: toDate(filters.invoiceDateEnd) ?? null,
					modifiedAtAfter: filters.modifiedAtAfter || null,
					modifiedAtBefore: filters.modifiedAtBefore || null,
					invoiceNumber: filters.invoiceNumber || null,
					amountDue: filters.amountDue === undefined ? null : String(filters.amountDue),
				},
				(data) => data.business?.invoices,
				{ limit, itemIndex },
			);
		},
		async markSent({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			return await markInvoiceSent(this, itemIndex, {
				invoiceId,
				sendMethod: this.getNodeParameter('sendMethod', itemIndex) as string,
				sentAt: this.getNodeParameter('sentAt', itemIndex, '') as string,
			});
		},
		async send({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const to = splitList(this.getNodeParameter('to', itemIndex));
			const fields = this.getNodeParameter('sendFields', itemIndex, {}) as IDataObject;
			return await sendInvoice(this, itemIndex, { invoiceId, to, ...fields });
		},
		async update({ itemIndex }) {
			const invoiceId = getResourceId.call(this, 'invoiceId', itemIndex, 'Invoice');
			const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			const output = await waveMutation<InvoiceOutput>(
				this,
				`mutation($input: InvoicePatchInput!) {
					invoicePatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoice { ${INVOICE_FIELDS} }
					}
				}`,
				'invoicePatch',
				{ id: invoiceId, ...buildInvoiceFields(fields) },
				{ itemIndex },
			);
			return output.invoice ?? {};
		},
	},
};
