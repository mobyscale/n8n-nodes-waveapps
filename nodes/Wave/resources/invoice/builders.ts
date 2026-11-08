import type { IDataObject } from 'n8n-workflow';

import {
	compactInput,
	fixedCollectionValues,
	getLocatorValue,
	toDate,
} from '../../shared/utils';

/** Builds the `taxes` list of an `InvoiceCreateItemInput`. */
export function buildTaxes(taxes: unknown): IDataObject[] | undefined {
	const list = fixedCollectionValues(taxes, 'taxValues')
		.map((tax) => getLocatorValue(tax.salesTax))
		.filter((id): id is string => id !== undefined)
		.map((salesTaxId) => ({ salesTaxId }));
	return list.length ? list : undefined;
}

/**
 * Builds the `items` list of an invoice from the "Items" fixed collection. A missing tax list
 * lets Wave apply the default taxes of the product.
 */
export function buildItems(items: unknown): IDataObject[] {
	return fixedCollectionValues(items, 'itemValues').map((item) => {
		const unitPrice = item.unitPrice;
		return compactInput({
			productId: getLocatorValue(item.product),
			description: item.description,
			quantity: item.quantity,
			unitPrice: unitPrice === '' || unitPrice === undefined ? undefined : String(unitPrice),
			taxes: buildTaxes(item.taxes),
		});
	});
}

/** Builds the `discounts` list from the "Discounts" fixed collection. */
export function buildDiscounts(discounts: unknown): IDataObject[] {
	return fixedCollectionValues(discounts, 'discountValues').map((discount) => {
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

/**
 * Maps the optional invoice fields (Additional Fields of create, Update Fields of update) to
 * the Wave input fields that both mutations share.
 */
export function buildInvoiceFields(fields: IDataObject): IDataObject {
	const { items, discounts, customer, invoiceDate, dueDate, ...rest } = fields;
	const input: IDataObject = { ...rest };
	const customerId = getLocatorValue(customer);
	if (customerId) input.customerId = customerId;
	if (invoiceDate) input.invoiceDate = toDate(invoiceDate);
	if (dueDate) input.dueDate = toDate(dueDate);
	if (items) {
		const built = buildItems(items);
		if (built.length) input.items = built;
	}
	if (discounts) {
		const built = buildDiscounts(discounts);
		if (built.length) input.discounts = built;
	}
	return compactInput(input);
}
