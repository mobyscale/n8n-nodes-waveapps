import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	businessLocator,
	enumOptions,
	paginationFields,
	resourceLocator,
	showFor,
} from '../../shared/descriptions';
import { CURRENCY_FIELDS, MONEY_FIELDS, PAGE_INFO_FIELDS } from '../../shared/fields';
import { toWaveId } from '../../shared/ids';
import {
	compactInput,
	getBusinessId,
	getLocatorValue,
	getRequiredString,
	getResourceId,
	splitList,
	toDateTime,
} from '../../shared/utils';
import {
	waveGetAll,
	waveMutation,
	waveRequest,
	type WaveConnection,
	type WaveMutationOutput,
} from '../../transport';
import { ESTIMATE_PAYMENT_FIELDS } from '../estimateDeposit';
import type { OperationHandler, ResourceModule } from '../types';
import { estimateFields, itemsField } from './fields';
import {
	buildCreateInput,
	buildListVariables,
	buildPatchInput,
	type CurrentEstimate,
} from './inputs';

const RESOURCE = 'estimate';

export const ESTIMATE_FIELDS = `
	id
	createdAt
	modifiedAt
	pdfUrl
	viewUrl
	status
	title
	subhead
	estimateNumber
	poNumber
	estimateDate
	dueDate
	customer { id name email }
	amountDue { ${MONEY_FIELDS} }
	amountPaid { ${MONEY_FIELDS} }
	taxTotal { ${MONEY_FIELDS} }
	total { ${MONEY_FIELDS} }
	subtotal { ${MONEY_FIELDS} }
	discountTotal { ${MONEY_FIELDS} }
	discounts {
		createdAt
		modifiedAt
		name
		... on FixedEstimateDiscount { amount }
		... on PercentageEstimateDiscount { percentage }
	}
	depositStatus
	depositUnit
	depositValue
	depositTotal { ${MONEY_FIELDS} }
	depositPaymentStatus
	currency { ${CURRENCY_FIELDS} }
	exchangeRate
	items {
		id
		description
		quantity
		unitPrice
		product { id name }
		account { id name }
		subtotal { ${MONEY_FIELDS} }
		total { ${MONEY_FIELDS} }
		taxes { salesTax { id name abbreviation rate } amount { ${MONEY_FIELDS} } }
	}
	memo
	dontCarryOverNotesToInvoice
	footer
	disableCreditCardPayments
	disableBankPayments
	disableAmexPayments
	itemTitle
	unitTitle
	priceTitle
	amountTitle
	hideName
	hideDescription
	hideUnit
	hidePrice
	hideAmount
	lastSentAt
	lastSentVia
	lastViewedAt
	requireTermsOfServiceAgreement
`;

const EMBEDDED_FIELDS = `
	attachments { id active fileName fileSize downloadUrl uploadStatusUpdatedAt }
	history { entityId entityType state name email timestamp }
	payments { ${ESTIMATE_PAYMENT_FIELDS} }
`;

const ESTIMATE_OPERATIONS = [
	'get',
	'update',
	'delete',
	'clone',
	'approve',
	'markSent',
	'markAccepted',
	'resetAcceptance',
	'send',
	'sendAcceptanceEmail',
	'generatePdf',
	'convertToInvoice',
];

const estimateLocator = resourceLocator({
	name: 'estimateId',
	displayName: 'Estimate',
	searchMethod: 'searchEstimates',
	resourceLabel: 'estimate',
	displayOptions: showFor(RESOURCE, ESTIMATE_OPERATIONS),
});

const customerLocator = (displayOptions?: INodeProperties['displayOptions']) =>
	resourceLocator({
		name: 'customerId',
		displayName: 'Customer',
		searchMethod: 'searchCustomers',
		resourceLabel: 'customer',
		description: 'The customer that the estimate is for',
		displayOptions,
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
				name: 'Approve',
				value: 'approve',
				description: 'Approve an estimate',
				action: 'Approve an estimate',
			},
			{
				name: 'Clone',
				value: 'clone',
				description: 'Create a copy of an estimate',
				action: 'Clone an estimate',
			},
			{
				name: 'Convert to Invoice',
				value: 'convertToInvoice',
				description: 'Create an invoice from an estimate',
				action: 'Convert an estimate to an invoice',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an estimate',
				action: 'Create an estimate',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an estimate',
				action: 'Delete an estimate',
			},
			{
				name: 'Generate PDF',
				value: 'generatePdf',
				description: 'Generate the PDF of an estimate',
				action: 'Generate the PDF of an estimate',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an estimate',
				action: 'Get an estimate',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many estimates',
				action: 'Get many estimates',
			},
			{
				name: 'Mark Accepted',
				value: 'markAccepted',
				description: 'Mark an estimate as accepted',
				action: 'Mark an estimate as accepted',
			},
			{
				name: 'Mark Sent',
				value: 'markSent',
				description: 'Mark an estimate as sent',
				action: 'Mark an estimate as sent',
			},
			{
				name: 'Reset Acceptance',
				value: 'resetAcceptance',
				description: 'Remove the accepted state of an estimate',
				action: 'Reset the acceptance of an estimate',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send an estimate by email',
				action: 'Send an estimate',
			},
			{
				name: 'Send Acceptance Email',
				value: 'sendAcceptanceEmail',
				description: 'Send the customer an email that confirms the acceptance of an estimate',
				action: 'Send the acceptance email of an estimate',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an estimate',
				action: 'Update an estimate',
			},
		],
		default: 'create',
	},
	businessLocator(
		showFor(RESOURCE, [
			'create',
			'getAll',
			'get',
			'update',
			'delete',
			'clone',
			'approve',
			'markSent',
			'markAccepted',
			'resetAcceptance',
			'send',
			'sendAcceptanceEmail',
			'generatePdf',
			'convertToInvoice',
		]),
	),
	estimateLocator,

	// Create
	customerLocator(showFor(RESOURCE, ['create'])),
	itemsField(showFor(RESOURCE, ['create'])),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: estimateFields,
	},

	// Get
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['get']),
		options: [
			{
				displayName: 'Embed Attachments',
				name: 'embedAttachments',
				type: 'boolean',
				default: false,
				description: 'Whether to return the attachments of the estimate',
			},
			{
				displayName: 'Embed Deposit Payments',
				name: 'embedDepositPayments',
				type: 'boolean',
				default: false,
				description: 'Whether to return the deposit payments of the estimate',
			},
			{
				displayName: 'Embed History',
				name: 'embedHistory',
				type: 'boolean',
				default: false,
				description: 'Whether to return the acceptance history of the estimate',
			},
		],
	},

	// Get Many
	...paginationFields(showFor(RESOURCE, ['getAll'])),
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		options: enumOptions('EstimateSort'),
		default: 'CREATED_AT_DESC',
		displayOptions: showFor(RESOURCE, ['getAll']),
	},
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
				description: 'Return only estimates with exactly this amount due',
			},
			{
				...customerLocator(),
				required: false,
				description: 'Return only estimates of this customer',
			},
			{
				displayName: 'Currency Name or ID',
				name: 'currency',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getCurrencies' },
				default: '',
				description:
					'Return only estimates in this currency. Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Estimate Date From',
				name: 'estimateDateStart',
				type: 'dateTime',
				default: '',
				description: 'Return only estimates dated on or after this date',
			},
			{
				displayName: 'Estimate Date To',
				name: 'estimateDateEnd',
				type: 'dateTime',
				default: '',
				description: 'Return only estimates dated on or before this date',
			},
			{
				displayName: 'Estimate Number',
				name: 'estimateNumber',
				type: 'string',
				default: '',
				description: 'Return only estimates with a number that contains this text',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: enumOptions('EstimateListStatusFilter'),
				default: 'ACTIVE',
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
			{ ...customerLocator(), required: false },
			itemsField(),
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: enumOptions('EstimateStatus'),
				default: 'DRAFT',
			},
			...estimateFields,
		],
	},

	// Mark Sent
	{
		displayName: 'Send Method',
		name: 'sendMethod',
		type: 'options',
		options: enumOptions('EstimateSendMethod'),
		default: 'MARKED_SENT',
		description: 'How the estimate was sent',
		displayOptions: showFor(RESOURCE, ['markSent']),
	},
	{
		displayName: 'Sent At',
		name: 'sentAt',
		type: 'dateTime',
		default: '',
		description: 'When the estimate was sent. Defaults to now.',
		displayOptions: showFor(RESOURCE, ['markSent']),
	},

	// Send
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. name@example.com',
		description: 'Email addresses that receive the estimate. Separate several with commas.',
		displayOptions: showFor(RESOURCE, ['send']),
	},
	{
		displayName: 'Options',
		name: 'sendOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['send']),
		options: [
			{
				displayName: 'Attach PDF',
				name: 'attachPDF',
				type: 'boolean',
				default: false,
				description: 'Whether to attach a PDF of the estimate',
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
				displayName: 'Hide Grand Total',
				name: 'hideGrandTotal',
				type: 'boolean',
				default: false,
				description: 'Whether to hide the grand total in the email',
			},
			{
				displayName: 'Include Attachments',
				name: 'includeAttachments',
				type: 'boolean',
				default: false,
				description: 'Whether to include the attachments of the estimate in the email',
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

	// Generate PDF
	{
		displayName: 'Download PDF',
		name: 'downloadPdf',
		type: 'boolean',
		default: false,
		description: 'Whether to download the PDF and return it as binary data',
		displayOptions: showFor(RESOURCE, ['generatePdf']),
	},
	{
		displayName: 'Put Output in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'The name of the binary field that gets the PDF',
		displayOptions: showFor(RESOURCE, ['generatePdf'], { downloadPdf: [true] }),
	},
];

type EstimateOutput = WaveMutationOutput & { estimate: IDataObject | null };

async function estimateMutation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	mutation: string,
	inputType: string,
	input: IDataObject,
): Promise<IDataObject> {
	const output = await waveMutation<EstimateOutput>(
		ctx,
		`mutation($input: ${inputType}!) {
			${mutation}(input: $input) {
				didSucceed
				inputErrors { code message path }
				estimate { ${ESTIMATE_FIELDS} }
			}
		}`,
		mutation,
		input,
		{ itemIndex },
	);
	return output.estimate ?? {};
}

/** The operations that only take the estimate ID and return the estimate. */
function simpleEstimateOperation(mutation: string, inputType: string): OperationHandler {
	return async function ({ itemIndex }) {
		const estimateId = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
		return await estimateMutation(this, itemIndex, mutation, inputType, { estimateId });
	};
}

async function getCurrentEstimate(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
	id: string,
): Promise<CurrentEstimate> {
	const data = await waveRequest<{ business: { estimate: CurrentEstimate | null } | null }>(
		ctx,
		`query($businessId: ID!, $id: ID!) {
			business(id: $businessId) {
				estimate(id: $id) {
					id status title subhead estimateNumber poNumber estimateDate dueDate exchangeRate
					currency { code } customer { id } memo footer
					disableAmexPayments disableCreditCardPayments disableBankPayments
					itemTitle unitTitle priceTitle amountTitle
					hideName hideDescription hideUnit hidePrice hideAmount
					requireTermsOfServiceAgreement depositStatus depositUnit depositValue dontCarryOverNotesToInvoice
					discounts { __typename name ... on FixedEstimateDiscount { amount } ... on PercentageEstimateDiscount { percentage } }
				}
			}
		}`,
		{ businessId, id },
		{ itemIndex },
	);
	const estimate = data.business?.estimate;
	if (!estimate) {
		throw new NodeOperationError(ctx.getNode(), `Estimate ${id} was not found`, { itemIndex });
	}
	return estimate;
}

/** Wave needs a unit price for each item. A missing price is read from the product. */
async function fillUnitPrices(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
	items: IDataObject[] | undefined,
): Promise<void> {
	for (const item of items ?? []) {
		if (item.unitPrice !== undefined || !item.productId) continue;
		const data = await waveRequest<{ business: { product: { unitPrice: string } | null } | null }>(
			ctx,
			'query($businessId: ID!, $id: ID!) { business(id: $businessId) { product(id: $id) { unitPrice } } }',
			{ businessId, id: item.productId },
			{ itemIndex },
		);
		const price = data.business?.product?.unitPrice;
		if (price === undefined) {
			throw new NodeOperationError(
				ctx.getNode(),
				`Product ${String(item.productId)} was not found`,
				{
					itemIndex,
				},
			);
		}
		item.unitPrice = price;
	}
}

export const estimateResource: ResourceModule = {
	option: { name: 'Estimate', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const customerId = toWaveId(
				'Customer',
				getRequiredString.call(this, 'customerId', itemIndex),
				businessId,
			);
			const input = buildCreateInput(
				businessId,
				customerId,
				this.getNodeParameter('items', itemIndex, {}),
				this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject,
			);
			await fillUnitPrices(this, itemIndex, businessId, input.items as IDataObject[] | undefined);
			return await estimateMutation(
				this,
				itemIndex,
				'estimateCreate',
				'EstimateCreateInput',
				input,
			);
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
			const data = await waveRequest<{ business: { estimate: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $id: ID!, $embedAttachments: Boolean, $embedHistory: Boolean, $embedDepositPayments: Boolean) {
					business(id: $businessId) {
						estimate(id: $id, embedAttachments: $embedAttachments, embedHistory: $embedHistory, embedDepositPayments: $embedDepositPayments) {
							${ESTIMATE_FIELDS}
							${EMBEDDED_FIELDS}
						}
					}
				}`,
				{
					businessId,
					id,
					embedAttachments: options.embedAttachments ?? false,
					embedHistory: options.embedHistory ?? false,
					embedDepositPayments: options.embedDepositPayments ?? false,
				},
				{ itemIndex },
			);
			return data.business?.estimate ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			const customer = getLocatorValue(filters.customerId);
			return await waveGetAll<
				IDataObject,
				{ business: { estimates: WaveConnection<IDataObject> } }
			>(
				this,
				`query($businessId: ID!, $page: Int!, $pageSize: Int!, $sort: EstimateSort!, $status: EstimateListStatusFilter, $customerId: ID, $currency: CurrencyCode, $estimateDateStart: Date, $estimateDateEnd: Date, $modifiedAtAfter: DateTime, $modifiedAtBefore: DateTime, $estimateNumber: String, $amountDue: Decimal) {
					business(id: $businessId) {
						estimates(page: $page, pageSize: $pageSize, sort: $sort, status: $status, customerId: $customerId, currency: $currency, estimateDateStart: $estimateDateStart, estimateDateEnd: $estimateDateEnd, modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore, estimateNumber: $estimateNumber, amountDue: $amountDue) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${ESTIMATE_FIELDS} } }
						}
					}
				}`,
				{
					businessId,
					sort: this.getNodeParameter('sort', itemIndex) as string,
					...buildListVariables(
						filters,
						customer ? toWaveId('Customer', customer, businessId) : undefined,
					),
				},
				(data) => data.business?.estimates,
				{ limit, itemIndex },
			);
		},
		async update({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			const current = await getCurrentEstimate(this, itemIndex, businessId, id);
			const customer = getLocatorValue(fields.customerId);
			const input = buildPatchInput(
				current,
				fields,
				customer ? toWaveId('Customer', customer, businessId) : undefined,
			);
			await fillUnitPrices(this, itemIndex, businessId, input.items as IDataObject[] | undefined);
			return await estimateMutation(this, itemIndex, 'estimatePatch', 'EstimatePatchInput', input);
		},
		async delete({ itemIndex }) {
			const id = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			await waveMutation(
				this,
				`mutation($input: EstimateDeleteInput!) {
					estimateDelete(input: $input) { didSucceed inputErrors { code message path } }
				}`,
				'estimateDelete',
				{ estimateId: id },
				{ itemIndex },
			);
			return { success: true, id };
		},
		clone: simpleEstimateOperation('estimateClone', 'EstimateCloneInput'),
		approve: simpleEstimateOperation('estimateApprove', 'EstimateApproveInput'),
		markAccepted: simpleEstimateOperation('estimateMarkAccepted', 'EstimateMarkAcceptedInput'),
		resetAcceptance: simpleEstimateOperation(
			'estimateResetAcceptance',
			'EstimateResetAcceptanceInput',
		),
		sendAcceptanceEmail: simpleEstimateOperation(
			'estimateSendAcceptanceCustomerEmail',
			'EstimateSendAcceptanceCustomerEmailInput',
		),
		async markSent({ itemIndex }) {
			return await estimateMutation(
				this,
				itemIndex,
				'estimateMarkSent',
				'EstimateMarkSentInput',
				compactInput({
					estimateId: getResourceId.call(this, 'estimateId', itemIndex, 'Estimate'),
					sendMethod: this.getNodeParameter('sendMethod', itemIndex) as string,
					sentAt: toDateTime(this.getNodeParameter('sentAt', itemIndex, '')),
				}),
			);
		},
		async send({ itemIndex }) {
			const options = this.getNodeParameter('sendOptions', itemIndex, {}) as IDataObject;
			return await estimateMutation(
				this,
				itemIndex,
				'estimateSend',
				'EstimateSendInput',
				compactInput({
					estimateId: getResourceId.call(this, 'estimateId', itemIndex, 'Estimate'),
					to: splitList(this.getNodeParameter('to', itemIndex)),
					subject: options.subject as string,
					message: options.message as string,
					attachPDF: (options.attachPDF as boolean | undefined) ?? false,
					fromAddress: options.fromAddress as string,
					ccMyself: options.ccMyself as boolean,
					hideGrandTotal: options.hideGrandTotal as boolean,
					includeAttachments: options.includeAttachments as boolean,
				}),
			);
		},
		async generatePdf({ itemIndex }) {
			const estimateId = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			const output = await waveMutation<WaveMutationOutput & { pdfUrl: string | null }>(
				this,
				`mutation($input: EstimateGeneratePdfInput!) {
					estimateGeneratePdf(input: $input) { didSucceed inputErrors { code message path } pdfUrl }
				}`,
				'estimateGeneratePdf',
				{ estimateId },
				{ itemIndex },
			);
			const json: IDataObject = { estimateId, pdfUrl: output.pdfUrl };
			if (!this.getNodeParameter('downloadPdf', itemIndex, false) || !output.pdfUrl) return json;

			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
			const content = (await this.helpers.httpRequest({
				method: 'GET',
				url: output.pdfUrl,
				encoding: 'arraybuffer',
				json: false,
			})) as ArrayBuffer;
			const binary = await this.helpers.prepareBinaryData(
				Buffer.from(content),
				`estimate-${estimateId.slice(-12)}.pdf`,
				'application/pdf',
			);
			const result: INodeExecutionData = { json, binary: { [binaryPropertyName]: binary } };
			return [result];
		},
		async convertToInvoice({ itemIndex }) {
			const estimateId = getResourceId.call(this, 'estimateId', itemIndex, 'Estimate');
			const output = await waveMutation<WaveMutationOutput & { invoiceId: string }>(
				this,
				`mutation($input: ConvertEstimateToInvoiceInput!) {
					convertEstimateToInvoice(input: $input) {
						didSucceed
						inputErrors { code message path }
						invoiceId
					}
				}`,
				'convertEstimateToInvoice',
				{ estimateId },
				{ itemIndex },
			);
			return { success: true, estimateId, invoiceId: output.invoiceId };
		},
	},
};
