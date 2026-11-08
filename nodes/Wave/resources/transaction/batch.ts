import type { MoneyTransactionDetails } from '../../generated/schema';

/** Wave timed out on a batch of 100 transactions, and a batch of 50 took almost 5 seconds. */
export const DEFAULT_BATCH_SIZE = 20;
export const MAX_BATCH_SIZE = 50;

export interface BatchEntry {
	itemIndex: number;
	businessId: string;
	details: MoneyTransactionDetails;
}

export interface Batch {
	businessId: string;
	entries: BatchEntry[];
}

/**
 * Groups the entries by business (one request can only hold one business) and splits each
 * group into batches of at most `batchSize`. The input order is kept inside each business.
 */
export function planBatches(entries: BatchEntry[], batchSize: number): Batch[] {
	const size = Math.min(Math.max(1, Math.floor(batchSize) || DEFAULT_BATCH_SIZE), MAX_BATCH_SIZE);
	const byBusiness = new Map<string, BatchEntry[]>();
	for (const entry of entries) {
		const group = byBusiness.get(entry.businessId) ?? [];
		group.push(entry);
		byBusiness.set(entry.businessId, group);
	}
	const batches: Batch[] = [];
	for (const [businessId, group] of byBusiness) {
		for (let start = 0; start < group.length; start += size) {
			batches.push({ businessId, entries: group.slice(start, start + size) });
		}
	}
	return batches;
}

/**
 * Wave words the duplicate error as "A transaction with the same externalId already exists".
 * It comes as a GraphQL error or as an input error, so the check reads the whole message text.
 */
export function isDuplicateExternalIdError(error: unknown): boolean {
	const candidate = error as { message?: unknown; description?: unknown } | null;
	const text = [candidate?.message, candidate?.description]
		.filter((part): part is string => typeof part === 'string')
		.join('\n');
	return /same\s+external\s?id/i.test(text);
}
