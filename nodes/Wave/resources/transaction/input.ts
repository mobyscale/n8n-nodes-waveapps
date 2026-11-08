import { createHash, randomUUID } from 'node:crypto';
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
import {
	compactInput,
	fixedCollectionValues,
	getLocatorValue,
	getResourceId,
	toDate,
} from '../../shared/utils';

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

export interface ExternalIdSource {
	anchorAccountId: string;
	date: string;
	direction: TransactionDirection;
	amount: string;
	description: string;
}

/**
 * A stable External ID from the data that identifies a bank row, so that an import that runs
 * again gives the same IDs and Wave rejects the repeats. The category accounts are left out on
 * purpose: a row that gets a different category on the next run is still the same row.
 */
export function generateExternalId(source: ExternalIdSource): string {
	const amount = Number(source.amount);
	const normalized = [
		source.anchorAccountId.trim(),
		source.date,
		source.direction,
		Number.isFinite(amount) ? amount.toFixed(2) : source.amount.trim(),
		source.description.trim().replace(/\s+/g, ' ').toLowerCase(),
	].join('|');
	return `n8n-${createHash('sha256').update(normalized).digest('hex').slice(0, 40)}`;
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

	const date = toDate(this.getNodeParameter('date', itemIndex));
	if (!date) {
		throw new NodeOperationError(this.getNode(), 'Set a date for the transaction', { itemIndex });
	}
	const description = String(this.getNodeParameter('description', itemIndex, '')).trim();
	if (!description) {
		throw new NodeOperationError(this.getNode(), 'Wave needs a description for the transaction', {
			itemIndex,
		});
	}
	const externalIdInput = String(this.getNodeParameter('externalId', itemIndex, '')).trim();
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

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

	let externalId = externalIdInput;
	if (!externalId) {
		externalId =
			options.externalIdWhenEmpty === 'generate'
				? generateExternalId({
						anchorAccountId,
						date,
						direction: entries.anchor.direction,
						amount: entries.anchor.amount,
						description,
					})
				: randomUUID();
	}

	return compactInput({
		externalId,
		date,
		description,
		notes: (additionalFields.notes as string | undefined)?.trim(),
		...entries,
	}) as MoneyTransactionDetails;
}
