import type { IDataObject } from 'n8n-workflow';

import { buildDiscounts, buildLineItems } from '../../shared/lineItems';
import { compactInput, getLocatorValue, toDate } from '../../shared/utils';

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
		const built = buildLineItems(items);
		if (built.length) input.items = built;
	}
	if (discounts) {
		const built = buildDiscounts(discounts);
		if (built.length) input.discounts = built;
	}
	return compactInput(input);
}
