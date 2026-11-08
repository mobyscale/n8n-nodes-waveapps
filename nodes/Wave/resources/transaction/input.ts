import { randomUUID } from 'node:crypto';
import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type {
	BalanceType,
	MoneyTransactionCreateAnchorInput,
	MoneyTransactionCreateLineItemInput,
	MoneyTransactionCreateSalesTaxInput,
	MoneyTransactionDetails,
	TransactionDirection,
} from '../../generated/schema';
import { compactInput, getLocatorValue, getResourceId } from '../../shared/utils';

export type TransactionMode = 'simple' | 'advanced';
export type SimpleTransactionType = 'expense' | 'income';

export interface SimpleTransactionInput {
	type: SimpleTransactionType;
	anchorAccountId: string;
	categoryAccountId: string;
	amount: string;
	customerId?: string;
	taxes?: MoneyTransactionCreateSalesTaxInput[];
}

/** Wave Decimal values are strings. */
export function toDecimal(value: unknown): string {
	if (typeof value === 'number') return String(value);
	return String(value ?? '').trim();
}

/** Wave wants a date as yyyy-MM-dd. The n8n date picker gives a date and time. */
export function toWaveDate(value: unknown): string | undefined {
	let text: string;
	if (value instanceof Date) text = value.toISOString();
	else if (typeof value === 'string') text = value.trim();
	else if (value !== null && value !== undefined) text = String(value);
	else return undefined;
	return /^\d{4}-\d{2}-\d{2}/.exec(text)?.[0];
}

/** Reads the entries of a fixedCollection with multiple values. */
function fixedCollectionValues(raw: unknown, key = 'values'): IDataObject[] {
	if (!raw || typeof raw !== 'object') return [];
	const values = (raw as IDataObject)[key];
	return Array.isArray(values) ? (values as IDataObject[]) : [];
}

/** Sales taxes from a fixedCollection of { salesTaxId, amount } entries. */
export function buildTaxes(raw: unknown): MoneyTransactionCreateSalesTaxInput[] | undefined {
	const taxes = fixedCollectionValues(raw)
		.map((entry) => ({
			salesTaxId: getLocatorValue(entry.salesTaxId) ?? '',
			amount: toDecimal(entry.amount),
		}))
		.filter((tax) => tax.salesTaxId);
	return taxes.length ? taxes : undefined;
}

/** Line items from the Line Items fixedCollection of the advanced mode. */
export function buildLineItems(raw: unknown): MoneyTransactionCreateLineItemInput[] {
	return fixedCollectionValues(raw).map(
		(entry) =>
			compactInput({
				accountId: getLocatorValue(entry.accountId) ?? '',
				amount: toDecimal(entry.amount),
				balance: (entry.balance as BalanceType | undefined) ?? 'INCREASE',
				description: (entry.description as string | undefined)?.trim(),
				customerId: getLocatorValue(entry.customerId),
				taxes: buildTaxes(entry.taxes),
			}) as MoneyTransactionCreateLineItemInput,
	);
}

/**
 * An expense takes money out of the anchor account and an income puts money in. In both cases
 * the category account increases in its normal balance (debit for expense, credit for income).
 */
export function buildSimpleTransaction(input: SimpleTransactionInput): {
	anchor: MoneyTransactionCreateAnchorInput;
	lineItems: MoneyTransactionCreateLineItemInput[];
} {
	const direction: TransactionDirection = input.type === 'expense' ? 'WITHDRAWAL' : 'DEPOSIT';
	return {
		anchor: { accountId: input.anchorAccountId, amount: input.amount, direction },
		lineItems: [
			compactInput({
				accountId: input.categoryAccountId,
				amount: input.amount,
				balance: 'INCREASE' as BalanceType,
				customerId: input.customerId,
				taxes: input.taxes,
			}) as MoneyTransactionCreateLineItemInput,
		],
	};
}

/** Reads the node parameters of one item and builds the Wave transaction input. */
export function readTransactionDetails(
	this: IExecuteFunctions,
	itemIndex: number,
): MoneyTransactionDetails {
	const mode = this.getNodeParameter('mode', itemIndex) as TransactionMode;
	const anchorAccountId = getResourceId.call(this, 'anchorAccountId', itemIndex);
	const amount = toDecimal(this.getNodeParameter('amount', itemIndex));
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

	const date = toWaveDate(this.getNodeParameter('date', itemIndex));
	if (!date) {
		throw new NodeOperationError(this.getNode(), 'Set a date for the transaction', { itemIndex });
	}
	const description = String(this.getNodeParameter('description', itemIndex, '')).trim();
	if (!description) {
		throw new NodeOperationError(this.getNode(), 'Wave needs a description for the transaction', {
			itemIndex,
		});
	}
	const externalId =
		String(this.getNodeParameter('externalId', itemIndex, '')).trim() || randomUUID();

	let entries: Pick<MoneyTransactionDetails, 'anchor' | 'lineItems'>;
	if (mode === 'advanced') {
		entries = {
			anchor: {
				accountId: anchorAccountId,
				amount,
				direction: this.getNodeParameter('direction', itemIndex) as TransactionDirection,
			},
			lineItems: buildLineItems(this.getNodeParameter('lineItems', itemIndex, {})),
		};
		if (entries.lineItems.some((lineItem) => !lineItem.accountId)) {
			throw new NodeOperationError(this.getNode(), 'Select an account for each line item', {
				itemIndex,
			});
		}
	} else {
		const type = this.getNodeParameter('transactionType', itemIndex) as SimpleTransactionType;
		const categoryField = type === 'expense' ? 'expenseAccountId' : 'incomeAccountId';
		entries = buildSimpleTransaction({
			type,
			anchorAccountId,
			categoryAccountId: getResourceId.call(this, categoryField, itemIndex),
			amount,
			customerId: getLocatorValue(additionalFields.customerId),
			taxes: buildTaxes(additionalFields.salesTaxes),
		});
	}

	return compactInput({
		externalId,
		date,
		description,
		notes: (additionalFields.notes as string | undefined)?.trim(),
		...entries,
	}) as MoneyTransactionDetails;
}
