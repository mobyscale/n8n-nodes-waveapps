import type { IDataObject } from 'n8n-workflow';

/**
 * The fields that the Wave schema types as `Decimal` and that the nodes select. Wave sends a
 * Decimal as a string. A field that is not in this list stays a string, so that IDs, invoice
 * numbers, postal codes and phone numbers are never changed.
 */
export const DECIMAL_FIELDS: ReadonlySet<string> = new Set([
	'amount',
	'amountDue',
	'balance',
	'balanceInBusinessCurrency',
	'depositValue',
	'exchangeRate',
	'percentage',
	'price',
	'quantity',
	'rate',
	'unitPrice',
]);

/** Fields that are removed at every depth. */
const REMOVED_FIELDS: ReadonlySet<string> = new Set(['minorUnitValue', 'classicId', '__typename']);

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

const isObject = (value: unknown): value is IDataObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isMoney = (value: IDataObject) => 'value' in value && 'currency' in value;
const isCurrency = (value: IDataObject) => 'code' in value && 'symbol' in value;
const isCodeAndName = (value: IDataObject) =>
	'code' in value && 'name' in value && !('id' in value);
const isEnumValue = (value: IDataObject) =>
	'name' in value && 'value' in value && !('currency' in value);
const isAddress = (value: IDataObject) => 'addressLine1' in value || 'postalCode' in value;
const isReference = (value: IDataObject) => typeof value.id === 'string';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function toNumber<T>(value: T): T | number {
	if (typeof value === 'string' && NUMBER_PATTERN.test(value.trim())) return Number(value);
	return value;
}

function addressText(address: IDataObject): string {
	return [
		address.addressLine1,
		address.addressLine2,
		address.city,
		address.province,
		address.postalCode,
		address.country,
	]
		.filter((part) => typeof part === 'string' && part !== '')
		.join(', ');
}

/**
 * Makes a Wave record flat enough for a spreadsheet: Money and Decimal values become numbers,
 * currencies, provinces and countries become codes, and nested records become `<key>Id` and
 * `<key>Name`. It does not change the input.
 */
export function simplifyRecord(record: IDataObject): IDataObject {
	const result: IDataObject = {};
	let moneyCurrency: unknown;

	for (const [key, value] of Object.entries(record)) {
		if (REMOVED_FIELDS.has(key)) continue;
		if (key === 'business' && isObject(value)) continue;

		if (Array.isArray(value)) {
			result[key] = value.map((entry) => (isObject(entry) ? simplifyRecord(entry) : entry));
		} else if (!isObject(value)) {
			result[key] = DECIMAL_FIELDS.has(key) ? toNumber(value) : value;
		} else if (isMoney(value)) {
			result[key] = toNumber(value.value);
			const currency = value.currency;
			moneyCurrency ??= isObject(currency) ? currency.code : currency;
		} else if (isCurrency(value) || isCodeAndName(value)) {
			result[key] = value.code;
		} else if (isEnumValue(value)) {
			result[key] = value.value;
		} else if (isAddress(value)) {
			const address = simplifyRecord(value);
			result[key] = address;
			const text = addressText(address);
			if (text) result[`${key}Text`] = text;
		} else if (isReference(value)) {
			result[`${key}Id`] = value.id;
			for (const [innerKey, innerValue] of Object.entries(simplifyRecord(value))) {
				if (innerKey === 'id') continue;
				// "name" in "customer" becomes "customerName". "invoiceNumber" in "invoice" stays.
				const name = innerKey.startsWith(key) ? innerKey : `${key}${capitalize(innerKey)}`;
				result[name] = innerValue;
			}
		} else if (key === 'shippingDetails') {
			for (const [innerKey, innerValue] of Object.entries(simplifyRecord(value))) {
				result[`shipping${capitalize(innerKey)}`] = innerValue;
			}
		} else {
			result[key] = simplifyRecord(value);
		}
	}

	if (moneyCurrency !== undefined && !('currency' in result)) result.currency = moneyCurrency;
	return result;
}
