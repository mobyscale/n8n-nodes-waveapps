import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { enumOptions, resourceLocator } from './descriptions';
import { compactInput, fixedCollectionValues, getLocatorValue } from './utils';

export interface LineItemOptions {
	/** Estimate items have an optional product name. */
	withItemName?: boolean;
	/** Invoice item taxes have an optional amount. */
	withTaxAmount?: boolean;
}

export interface ItemsFieldOptions extends LineItemOptions {
	description: string;
	/** Adds the Product Name field that the top-level "Match Products By Name" option turns on. */
	withProductNameMatching?: boolean;
	displayOptions?: INodeProperties['displayOptions'];
}

export interface DiscountsFieldOptions {
	/** The enum of the discount type: InvoiceDiscountType or EstimateDiscountType. */
	typeEnum: 'InvoiceDiscountType' | 'EstimateDiscountType';
	multiple?: boolean;
	description?: string;
	displayOptions?: INodeProperties['displayOptions'];
}

/** The "Items" fixed collection of Invoice and Estimate. The entries are in `itemValues`. */
export function itemsField(options: ItemsFieldOptions): INodeProperties {
	const taxValues: INodeProperties[] = [
		resourceLocator({
			name: 'salesTax',
			displayName: 'Sales Tax',
			searchMethod: 'searchSalesTaxes',
			resourceLabel: 'sales tax',
		}),
	];
	if (options.withTaxAmount) {
		taxValues.push({
			displayName: 'Amount',
			name: 'amount',
			type: 'string',
			default: '',
			description: 'The tax amount. Leave empty to let Wave calculate it.',
		});
	}

	const matching = options.withProductNameMatching;
	const values: INodeProperties[] = [
		{
			...resourceLocator({
				name: 'product',
				displayName: 'Product',
				searchMethod: 'searchProducts',
				resourceLabel: 'product',
			}),
			...(matching ? { displayOptions: { show: { '/matchProductsByName': [false] } } } : {}),
		},
	];
	if (matching) {
		values.push({
			displayName: 'Product Name',
			name: 'productName',
			type: 'string',
			default: '',
			required: true,
			description:
				'Name of an existing product. Wave creates the product when no active product has this name.',
			displayOptions: { show: { '/matchProductsByName': [true] } },
		});
	}
	if (options.withItemName) {
		values.push({
			displayName: 'Name',
			name: 'name',
			type: 'string',
			default: '',
			description: 'Replaces the name of the product',
		});
	}
	values.push(
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
			placeholder: 'e.g. 25.50',
			description: 'Price per unit. Leave empty to use the price of the product.',
		},
		{
			displayName: 'Taxes',
			name: 'taxes',
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			placeholder: 'Add Tax',
			default: {},
			description: 'Leave empty to use the default sales taxes of the product',
			options: [{ displayName: 'Tax', name: 'taxValues', values: taxValues }],
		},
	);

	return {
		displayName: 'Items',
		name: 'items',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Item',
		default: {},
		description: options.description,
		displayOptions: options.displayOptions,
		options: [{ displayName: 'Item', name: 'itemValues', values }],
	};
}

/** The "Discounts" fixed collection of Invoice and Estimate. The entries are in `discountValues`. */
export function discountsField(options: DiscountsFieldOptions): INodeProperties {
	return {
		displayName: 'Discounts',
		name: 'discounts',
		type: 'fixedCollection',
		typeOptions: options.multiple ? { multipleValues: true } : undefined,
		placeholder: 'Add Discount',
		default: {},
		description: options.description,
		displayOptions: options.displayOptions,
		options: [
			{
				displayName: 'Discount',
				name: 'discountValues',
				values: [
					{
						displayName: 'Type',
						name: 'discountType',
						type: 'options',
						options: enumOptions(options.typeEnum),
						default: 'PERCENTAGE',
					},
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{
						displayName: 'Amount',
						name: 'amount',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'The discount amount in the currency of the document',
						displayOptions: { show: { discountType: ['FIXED'] } },
					},
					{
						displayName: 'Percentage',
						name: 'percentage',
						type: 'number',
						typeOptions: { numberPrecision: 4 },
						default: 0,
						description: 'The discount percentage, for example 10 for 10%',
						displayOptions: { show: { discountType: ['PERCENTAGE'] } },
					},
				],
			},
		],
	};
}

function buildItemTaxes(taxes: unknown, withTaxAmount?: boolean): IDataObject[] | undefined {
	const list: IDataObject[] = [];
	for (const tax of fixedCollectionValues(taxes, 'taxValues')) {
		const salesTaxId = getLocatorValue(tax.salesTax);
		if (salesTaxId === undefined) continue;
		const amount = tax.amount;
		const hasAmount = withTaxAmount && amount !== '' && amount !== undefined && amount !== null;
		list.push(hasAmount ? { salesTaxId, amount: String(amount) } : { salesTaxId });
	}
	return list.length ? list : undefined;
}

/**
 * Builds the `items` list of an invoice or estimate from the "Items" fixed collection. A missing
 * tax list lets Wave apply the default taxes of the product. The unit price is a string and is
 * left out when it is empty.
 */
export function buildLineItems(value: unknown, options: LineItemOptions = {}): IDataObject[] {
	return fixedCollectionValues(value, 'itemValues').map((item) => {
		const unitPrice = item.unitPrice;
		return compactInput({
			productId: getLocatorValue(item.product),
			name: options.withItemName ? item.name : undefined,
			description: item.description,
			quantity: item.quantity,
			unitPrice: unitPrice === '' || unitPrice === undefined ? undefined : String(unitPrice),
			taxes: buildItemTaxes(item.taxes, options.withTaxAmount),
		});
	});
}

/** Builds the `discounts` list from the "Discounts" fixed collection. */
export function buildDiscounts(value: unknown): IDataObject[] {
	return fixedCollectionValues(value, 'discountValues').map((discount) => {
		const isPercentage = discount.discountType === 'PERCENTAGE';
		return compactInput({
			discountType: discount.discountType,
			name: discount.name,
			...(isPercentage
				? { percentage: discount.percentage }
				: { amount: discount.amount === undefined ? undefined : String(discount.amount) }),
		});
	});
}
