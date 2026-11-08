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
