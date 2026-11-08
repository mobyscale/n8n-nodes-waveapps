import type { INodeProperties } from 'n8n-workflow';

import { currencyField, enumOptions, resourceLocator } from '../../shared/descriptions';

export const itemsField = (
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties => ({
	displayName: 'Items',
	name: 'items',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Item',
	default: {},
	description: 'The line items of the estimate. On an update, they replace all current items.',
	displayOptions,
	options: [
		{
			displayName: 'Item',
			name: 'item',
			values: [
				resourceLocator({
					name: 'product',
					displayName: 'Product',
					searchMethod: 'searchProducts',
					resourceLabel: 'product',
				}),
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Replaces the description of the product',
				},
				{
					displayName: 'Quantity',
					name: 'quantity',
					type: 'number',
					typeOptions: { numberPrecision: 8 },
					default: 1,
				},
				{
					displayName: 'Unit Price',
					name: 'unitPrice',
					type: 'string',
					default: '',
					description:
						'Price per unit in the major currency unit. Wave requires a price, so leave this empty to use the price of the product.',
				},
				resourceLocator({
					name: 'salesTax',
					displayName: 'Sales Tax',
					searchMethod: 'searchSalesTaxes',
					resourceLabel: 'sales tax',
					required: false,
					description:
						'A sales tax for this item. Leave empty to use the default taxes of the product.',
				}),
				{
					displayName: 'More Sales Tax IDs',
					name: 'extraSalesTaxIds',
					type: 'string',
					default: '',
					description: 'IDs of more sales taxes for this item, separated by commas',
				},
			],
		},
	],
});

const discountsField: INodeProperties = {
	displayName: 'Discounts',
	name: 'discounts',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Discount',
	default: {},
	options: [
		{
			displayName: 'Discount',
			name: 'discount',
			values: [
				{
					displayName: 'Type',
					name: 'discountType',
					type: 'options',
					options: enumOptions('EstimateDiscountType'),
					default: 'PERCENTAGE',
				},
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Amount',
					name: 'amount',
					type: 'number',
					typeOptions: { numberPrecision: 2 },
					default: 0,
					description: 'The discount amount. Used for the type Fixed.',
				},
				{
					displayName: 'Percentage',
					name: 'percentage',
					type: 'number',
					typeOptions: { numberPrecision: 4 },
					default: 0,
					description: 'The discount percentage. Used for the type Percentage.',
				},
			],
		},
	],
};

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

/** Optional estimate fields that Create and Update share (EstimateCreateInput, EstimatePatchInput). */
export const estimateFields: INodeProperties[] = [
	text('Amount Column Title', 'amountTitle', 'The label of the Amount column'),
	{
		displayName: 'Attachment IDs',
		name: 'attachmentIds',
		type: 'string',
		default: '',
		description: 'IDs of attachments to add to the estimate, separated by commas',
	},
	currencyField({
		description:
			'Defaults to the currency of the business. Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	}),
	{
		displayName: 'Deposit Status',
		name: 'depositStatus',
		type: 'options',
		options: enumOptions('EstimateDepositStatusType'),
		default: 'DISABLED',
		description: 'Whether the customer can or must pay a deposit',
	},
	{
		displayName: 'Deposit Unit',
		name: 'depositUnit',
		type: 'options',
		options: enumOptions('EstimateDepositUnitType'),
		default: 'PERCENTAGE',
		description: 'The unit of the deposit value',
	},
	{
		displayName: 'Deposit Value',
		name: 'depositValue',
		type: 'number',
		typeOptions: { numberPrecision: 2 },
		default: 0,
		description: 'The deposit as an amount or as a percentage, set by Deposit Unit',
	},
	flag(
		'Disable American Express Payments',
		'disableAmexPayments',
		'Whether the customer cannot pay this estimate with American Express',
	),
	flag(
		'Disable Bank Payments',
		'disableBankPayments',
		'Whether the customer cannot pay this estimate by bank payment',
	),
	flag(
		'Disable Credit Card Payments',
		'disableCreditCardPayments',
		'Whether the customer cannot pay this estimate by card',
	),
	discountsField,
	flag(
		"Don't Carry Over Notes to Invoice",
		'dontCarryOverNotesToInvoice',
		'Whether to leave the notes out when the estimate is converted to an invoice',
	),
	{
		displayName: 'Due Date',
		name: 'dueDate',
		type: 'dateTime',
		default: '',
		description: 'Defaults to the payment terms of the business applied to the estimate date',
	},
	{
		displayName: 'Estimate Date',
		name: 'estimateDate',
		type: 'dateTime',
		default: '',
		description: 'Defaults to today',
	},
	text(
		'Estimate Number',
		'estimateNumber',
		'A unique number. Wave generates a number when you leave this empty.',
	),
	{
		displayName: 'Exchange Rate',
		name: 'exchangeRate',
		type: 'number',
		typeOptions: { numberPrecision: 8 },
		default: 1,
		description: 'The rate from the estimate currency to the currency of the business',
	},
	text('Footer', 'footer'),
	flag('Hide Amount', 'hideAmount', 'Whether to hide the amount of each item'),
	flag('Hide Description', 'hideDescription', 'Whether to hide the description of each item'),
	flag('Hide Name', 'hideName', 'Whether to hide the product name of each item'),
	flag('Hide Price', 'hidePrice', 'Whether to hide the price of each item'),
	flag('Hide Unit', 'hideUnit', 'Whether to hide the unit of each item'),
	text('Item Column Title', 'itemTitle', 'The label of the Item column'),
	{
		displayName: 'Memo',
		name: 'memo',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'The notes of the estimate',
	},
	text('PO Number', 'poNumber', 'The purchase order or sales order number'),
	text('Price Column Title', 'priceTitle', 'The label of the Price column'),
	flag(
		'Require Terms of Service Agreement',
		'requireTermsOfServiceAgreement',
		'Whether the customer must accept the terms of service',
	),
	text('Subheading', 'subhead'),
	text('Title', 'title', 'The title at the top of the document'),
	text('Unit Column Title', 'unitTitle', 'The label of the Unit column'),
];
