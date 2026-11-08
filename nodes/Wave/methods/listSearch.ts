import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import type { WaveConnection } from '../transport';
import { getSelectedBusinessId, PAYMENT_ACCOUNT_SUBTYPES, searchConnection } from './searchHelpers';

type Node = IDataObject & { id: string; name: string };

const businessConnection = (data: IDataObject) =>
	data.businesses as WaveConnection<Node> | undefined;
const inBusiness = (field: string) => (data: IDataObject) =>
	(data.business as IDataObject | null)?.[field] as WaveConnection<Node> | undefined;

export async function searchBusinesses(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		this,
		{
			query: `query($page: Int!, $pageSize: Int!) {
				businesses(page: $page, pageSize: $pageSize) {
					pageInfo { currentPage totalPages }
					edges { node { id name isPersonal isArchived } }
				}
			}`,
			getConnection: businessConnection,
			toItem: (node) => ({
				name: `${node.name}${node.isPersonal ? ' (Personal)' : ''}${node.isArchived ? ' (Archived)' : ''}`,
				value: node.id,
			}),
		},
		filter,
		paginationToken,
	);
}

export async function searchCustomers(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					customers(page: $page, pageSize: $pageSize, sort: [NAME_ASC]) {
						pageInfo { currentPage totalPages }
						edges { node { id name email } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('customers'),
			toItem: (node) => ({
				name: node.email ? `${node.name} (${node.email as string})` : node.name,
				value: node.id,
			}),
		},
		filter,
		paginationToken,
	);
}

export async function searchVendors(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					vendors(page: $page, pageSize: $pageSize) {
						pageInfo { currentPage totalPages }
						edges { node { id name email } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('vendors'),
			toItem: (node) => ({
				name: node.email ? `${node.name} (${node.email as string})` : node.name,
				value: node.id,
			}),
		},
		filter,
		paginationToken,
	);
}

export async function searchProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					products(page: $page, pageSize: $pageSize, sort: [NAME_ASC], isArchived: false) {
						pageInfo { currentPage totalPages }
						edges { node { id name unitPrice } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('products'),
			toItem: (node) => ({ name: `${node.name} (${node.unitPrice as string})`, value: node.id }),
			searchText: (node) => node.name,
		},
		filter,
		paginationToken,
	);
}

export async function searchSalesTaxes(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					salesTaxes(page: $page, pageSize: $pageSize, isArchived: false) {
						pageInfo { currentPage totalPages }
						edges { node { id name abbreviation rate } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('salesTaxes'),
			toItem: (node) => ({
				name: `${node.name} (${node.abbreviation as string}, ${node.rate as string})`,
				value: node.id,
			}),
			searchText: (node) => `${node.name} ${node.abbreviation as string}`,
		},
		filter,
		paginationToken,
	);
}

export async function searchInvoices(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<IDataObject & { id: string }>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					invoices(page: $page, pageSize: $pageSize, sort: [INVOICE_DATE_DESC]) {
						pageInfo { currentPage totalPages }
						edges { node { id invoiceNumber invoiceDate status total { value currency { code } } customer { name } } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('invoices') as never,
			toItem: (node) => {
				const total = node.total as { value: string; currency: { code: string } };
				const customer = node.customer as { name: string } | null;
				return {
					name: `#${node.invoiceNumber as string} ${customer?.name ?? ''} ${total.value} ${total.currency.code} (${node.status as string}, ${node.invoiceDate as string})`,
					value: node.id,
				};
			},
		},
		filter,
		paginationToken,
	);
}

export async function searchEstimates(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<IDataObject & { id: string }>(
		this,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
				business(id: $businessId) {
					estimates(page: $page, pageSize: $pageSize, sort: ESTIMATE_DATE_DESC) {
						pageInfo { currentPage totalPages }
						edges { node { id estimateNumber estimateDate status total { value currency { code } } customer { name } } }
					}
				}
			}`,
			variables: { businessId: getSelectedBusinessId(this) },
			getConnection: inBusiness('estimates') as never,
			toItem: (node) => {
				const total = node.total as { value: string; currency: { code: string } } | null;
				const customer = node.customer as { name: string } | null;
				return {
					name: `#${node.estimateNumber as string} ${customer?.name ?? ''} ${total ? `${total.value} ${total.currency.code}` : ''} (${node.status as string}, ${node.estimateDate as string})`,
					value: node.id,
				};
			},
		},
		filter,
		paginationToken,
	);
}

interface AccountFilter {
	types?: string[];
	subtypes?: string[];
}

async function searchAccountsWith(
	ctx: ILoadOptionsFunctions,
	accountFilter: AccountFilter,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchConnection<Node>(
		ctx,
		{
			query: `query($businessId: ID!, $page: Int!, $pageSize: Int!, $types: [AccountTypeValue!], $subtypes: [AccountSubtypeValue!]) {
				business(id: $businessId) {
					accounts(page: $page, pageSize: $pageSize, types: $types, subtypes: $subtypes, isArchived: false) {
						pageInfo { currentPage totalPages }
						edges { node { id name displayId currency { code } subtype { name } } }
					}
				}
			}`,
			variables: {
				businessId: getSelectedBusinessId(ctx),
				types: accountFilter.types ?? null,
				subtypes: accountFilter.subtypes ?? null,
			},
			getConnection: inBusiness('accounts'),
			toItem: (node) => {
				const subtype = (node.subtype as { name: string }).name;
				const currency = (node.currency as { code: string }).code;
				return { name: `${node.name} (${subtype}, ${currency})`, value: node.id };
			},
			searchText: (node) => `${node.name} ${(node.displayId as string) ?? ''}`,
		},
		filter,
		paginationToken,
	);
}

export async function searchAccounts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchAccountsWith(this, {}, filter, paginationToken);
}

export async function searchExpenseAccounts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchAccountsWith(this, { types: ['EXPENSE'] }, filter, paginationToken);
}

export async function searchIncomeAccounts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchAccountsWith(this, { types: ['INCOME'] }, filter, paginationToken);
}

export async function searchPaymentAccounts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await searchAccountsWith(
		this,
		{ subtypes: PAYMENT_ACCOUNT_SUBTYPES },
		filter,
		paginationToken,
	);
}
