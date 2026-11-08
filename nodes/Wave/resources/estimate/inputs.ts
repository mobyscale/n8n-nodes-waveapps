import type { IDataObject } from 'n8n-workflow';

import { buildDiscounts, buildLineItems } from '../../shared/lineItems';
import { compactInput, splitList, toDate, toDateTime } from '../../shared/utils';

const PASS_THROUGH_FIELDS = [
	'title',
	'subhead',
	'estimateNumber',
	'poNumber',
	'exchangeRate',
	'memo',
	'footer',
	'disableAmexPayments',
	'disableCreditCardPayments',
	'disableBankPayments',
	'itemTitle',
	'unitTitle',
	'priceTitle',
	'amountTitle',
	'hideName',
	'hideDescription',
	'hideUnit',
	'hidePrice',
	'hideAmount',
	'requireTermsOfServiceAgreement',
	'depositStatus',
	'depositValue',
	'depositUnit',
	'dontCarryOverNotesToInvoice',
	'currency',
];

const ITEM_OPTIONS = { withItemName: true };

// An empty list must stay undefined: estimatePatch then keeps the current items and discounts.
function buildEstimateItems(value: unknown): IDataObject[] | undefined {
	const items = buildLineItems(value, ITEM_OPTIONS);
	return items.length ? items : undefined;
}

function buildEstimateDiscounts(value: unknown): IDataObject[] | undefined {
	const discounts = buildDiscounts(value);
	return discounts.length ? discounts : undefined;
}

/** Maps the optional fields of Create (Additional Fields) and Update (Update Fields) to API input. */
export function buildEstimateFields(fields: IDataObject): IDataObject {
	const input: IDataObject = {};
	for (const key of PASS_THROUGH_FIELDS) {
		if (fields[key] !== undefined) input[key] = fields[key];
	}
	input.estimateDate = toDate(fields.estimateDate);
	input.dueDate = toDate(fields.dueDate);
	input.items = buildEstimateItems(fields.items);
	input.discounts = buildEstimateDiscounts(fields.discounts);
	if (fields.attachmentIds !== undefined) {
		const ids = splitList(fields.attachmentIds);
		input.attachmentIds = ids.length ? ids : undefined;
	}
	return compactInput(input);
}

export function buildCreateInput(
	businessId: string,
	customerId: string,
	items: unknown,
	fields: IDataObject,
): IDataObject {
	return compactInput({
		businessId,
		customerId,
		...buildEstimateFields(fields),
		items: buildEstimateItems(items),
	});
}

export interface CurrentEstimate extends IDataObject {
	id: string;
	status: string;
	title: string;
	estimateDate: string;
	dueDate: string;
	exchangeRate: string;
	currency: { code: string };
	customer: { id: string };
	discounts?: Array<IDataObject & { __typename: string }> | null;
}

// Wave resets a field that estimatePatch does not get, so these keep their current values.
const PRESERVED_FIELDS = PASS_THROUGH_FIELDS.filter(
	(field) => !['title', 'exchangeRate', 'currency'].includes(field),
);

function currentDiscounts(current: CurrentEstimate): IDataObject[] | undefined {
	if (!current.discounts?.length) return undefined;
	return current.discounts.map((discount) =>
		compactInput({
			discountType: discount.__typename === 'FixedEstimateDiscount' ? 'FIXED' : 'PERCENTAGE',
			name: discount.name as string,
			amount: discount.amount as string,
			percentage: discount.percentage as string,
		}),
	);
}

/**
 * estimatePatch requires several fields, and Wave resets the optional fields that it does not
 * get. So the current values fill the gaps, and the values from the user win.
 */
export function buildPatchInput(
	current: CurrentEstimate,
	fields: IDataObject,
	customerId?: string,
): IDataObject {
	const kept: IDataObject = {};
	for (const field of PRESERVED_FIELDS) {
		if (current[field] !== null && current[field] !== undefined) kept[field] = current[field];
	}
	return {
		...compactInput(kept),
		discounts: currentDiscounts(current),
		id: current.id,
		customerId: customerId ?? current.customer.id,
		status: (fields.status as string | undefined) || current.status,
		title: current.title,
		estimateDate: current.estimateDate,
		currency: current.currency.code,
		exchangeRate: current.exchangeRate,
		dueDate: current.dueDate,
		...buildEstimateFields(fields),
	};
}

/** Builds the variables of the Business.estimates query from the Filters collection. */
export function buildListVariables(
	filters: IDataObject,
	customerId: string | undefined,
): IDataObject {
	return {
		status: filters.status || null,
		customerId: customerId ?? null,
		currency: filters.currency || null,
		estimateDateStart: toDate(filters.estimateDateStart) ?? null,
		estimateDateEnd: toDate(filters.estimateDateEnd) ?? null,
		modifiedAtAfter: toDateTime(filters.modifiedAtAfter) ?? null,
		modifiedAtBefore: toDateTime(filters.modifiedAtBefore) ?? null,
		estimateNumber: filters.estimateNumber || null,
		amountDue: filters.amountDue ?? null,
	};
}
