import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toBusinessId } from '../shared/ids';
import { waveRequest, type WaveConnection } from '../transport';

const PAGE_SIZE = 100;
/** With a filter, pages are read until this number of matches is found (or the list ends). */
const MIN_FILTERED_RESULTS = 25;
const MAX_PAGES_PER_SEARCH = 20;

interface SearchConfig<TNode> {
	query: string;
	variables?: IDataObject;
	getConnection: (data: IDataObject) => WaveConnection<TNode> | null | undefined;
	toItem: (node: TNode) => INodeListSearchItems;
	/** Text that the filter is matched against. Defaults to the item name. */
	searchText?: (node: TNode) => string;
}

export function matchesFilter(text: string, filter?: string): boolean {
	if (!filter) return true;
	return text.toLowerCase().includes(filter.trim().toLowerCase());
}

/**
 * Wave lists have no text search, so the filter is applied to each page here. Without a filter
 * one page is returned at a time. With a filter, pages are read until enough matches are found.
 */
export async function searchConnection<TNode>(
	ctx: ILoadOptionsFunctions,
	config: SearchConfig<TNode>,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const results: INodeListSearchItems[] = [];
	let page = paginationToken ? Number(paginationToken) : 1;
	for (let pagesRead = 0; pagesRead < MAX_PAGES_PER_SEARCH; pagesRead++) {
		const data = await waveRequest<IDataObject>(ctx, config.query, {
			...config.variables,
			page,
			pageSize: PAGE_SIZE,
		});
		const connection = config.getConnection(data);
		if (!connection) return { results };
		for (const { node } of connection.edges) {
			const item = config.toItem(node);
			const text = config.searchText ? config.searchText(node) : item.name;
			if (matchesFilter(text, filter)) results.push(item);
		}
		const hasMore = connection.pageInfo.currentPage < connection.pageInfo.totalPages;
		if (!hasMore) return { results };
		page = connection.pageInfo.currentPage + 1;
		if (!filter || results.length >= MIN_FILTERED_RESULTS) {
			return { results, paginationToken: String(page) };
		}
	}
	return { results, paginationToken: String(page) };
}

/** Reads the business that is selected in the node, for searches inside a business. */
export function getSelectedBusinessId(ctx: ILoadOptionsFunctions): string {
	let value: unknown;
	try {
		value = ctx.getCurrentNodeParameter('businessId', { extractValue: true });
	} catch {
		value = undefined;
	}
	const businessId = typeof value === 'string' ? value.trim() : '';
	if (!businessId) {
		throw new NodeOperationError(ctx.getNode(), 'Select a business first');
	}
	return toBusinessId(businessId);
}

/** Subtypes that can be the bank side ("anchor") of a money transaction or receive a payment. */
export const PAYMENT_ACCOUNT_SUBTYPES = [
	'CASH_AND_BANK',
	'CREDIT_CARD',
	'MONEY_IN_TRANSIT',
	'LOANS',
];
