import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { currencyField, enumOptions, resourceLocator } from '../Wave/shared/descriptions';
import { toWaveId } from '../Wave/shared/ids';
import { getLocatorValue } from '../Wave/shared/utils';
import {
	CUSTOMER_FIELDS,
	ESTIMATE_FIELDS,
	INVOICE_LIST_FIELDS,
	PRODUCT_FIELDS,
	SALES_TAX_FIELDS,
	VENDOR_FIELDS,
} from './selections';

export type TriggerResource =
	| 'customer'
	| 'estimate'
	| 'invoice'
	| 'product'
	| 'salesTax'
	| 'vendor';

interface SortValues {
	createdDesc: string;
	modifiedAsc: string;
	modifiedDesc: string;
	/** Whether the sort argument is a list (invoices) or a single value (estimates). */
	isList: boolean;
}

export interface ResourceConfig {
	name: string;
	/** The connection field of `Business`. */
	listField: string;
	fields: string;
	/** Filter arguments of the connection with their GraphQL types. */
	filterArgs: Record<string, string>;
	/** Undefined when the connection has no sort argument. */
	sort?: SortValues;
}

const sortValues = (isList: boolean): SortValues => ({
	createdDesc: 'CREATED_AT_DESC',
	modifiedAsc: 'MODIFIED_AT_ASC',
	modifiedDesc: 'MODIFIED_AT_DESC',
	isList,
});

export const RESOURCES: Record<TriggerResource, ResourceConfig> = {
	customer: {
		name: 'Customer',
		listField: 'customers',
		fields: CUSTOMER_FIELDS,
		filterArgs: { email: 'String', isArchived: 'Boolean' },
		sort: sortValues(true),
	},
	estimate: {
		name: 'Estimate',
		listField: 'estimates',
		fields: ESTIMATE_FIELDS,
		filterArgs: { status: 'EstimateListStatusFilter', customerId: 'ID', currency: 'CurrencyCode' },
		sort: sortValues(false),
	},
	invoice: {
		name: 'Invoice',
		listField: 'invoices',
		fields: INVOICE_LIST_FIELDS,
		filterArgs: { status: 'InvoiceStatus', customerId: 'ID', currency: 'CurrencyCode' },
		sort: sortValues(true),
	},
	product: {
		name: 'Product',
		listField: 'products',
		fields: PRODUCT_FIELDS,
		filterArgs: { isSold: 'Boolean', isBought: 'Boolean', isArchived: 'Boolean' },
		sort: sortValues(true),
	},
	salesTax: {
		name: 'Sales Tax',
		listField: 'salesTaxes',
		fields: SALES_TAX_FIELDS,
		filterArgs: { isArchived: 'Boolean' },
	},
	vendor: {
		name: 'Vendor',
		listField: 'vendors',
		fields: VENDOR_FIELDS,
		filterArgs: { email: 'String' },
	},
};

export const resourceOptions = (Object.keys(RESOURCES) as TriggerResource[]).map((value) => ({
	name: RESOURCES[value].name,
	value,
}));

/**
 * Builds the list query. Only the filters in `filterNames` are declared, so that a filter that
 * the user did not set is not sent.
 */
export function buildListQuery(
	resource: TriggerResource,
	filterNames: string[],
	sort?: string,
): string {
	const config = RESOURCES[resource];
	const declarations = [
		'$businessId: ID!',
		'$page: Int!',
		'$pageSize: Int!',
		'$modifiedAtAfter: DateTime',
		...filterNames.map((name) => `$${name}: ${config.filterArgs[name]}`),
	];
	const args = [
		'page: $page',
		'pageSize: $pageSize',
		'modifiedAtAfter: $modifiedAtAfter',
		...filterNames.map((name) => `${name}: $${name}`),
	];
	if (sort && config.sort) args.push(`sort: ${config.sort.isList ? `[${sort}]` : sort}`);
	return `query(${declarations.join(', ')}) {
		business(id: $businessId) {
			${config.listField}(${args.join(', ')}) {
				pageInfo { currentPage totalPages }
				edges { node { ${config.fields} } }
			}
		}
	}`;
}

const ARCHIVED_VALUES: Record<string, boolean | null> = {
	all: null,
	active: false,
	archived: true,
};

/**
 * Turns the Filters collection into GraphQL variables. Wave lists only active products and sales
 * taxes by default, so `isArchived` is sent as null (all records) when the user does not set it.
 */
export function getFilterVariables(
	resource: TriggerResource,
	filters: IDataObject,
	businessId: string,
): IDataObject {
	const allowed = RESOURCES[resource].filterArgs;
	const variables: IDataObject = {};
	if ('isArchived' in allowed) {
		const archived = typeof filters.archived === 'string' ? filters.archived : 'all';
		variables.isArchived = ARCHIVED_VALUES[archived] ?? null;
	}
	for (const name of ['email', 'status', 'currency']) {
		const value = filters[name];
		if (name in allowed && typeof value === 'string' && value.trim()) {
			variables[name] = value.trim();
		}
	}
	for (const name of ['isSold', 'isBought']) {
		if (name in allowed && typeof filters[name] === 'boolean') variables[name] = filters[name];
	}
	if ('customerId' in allowed) {
		const customerId = getLocatorValue(filters.customerId)?.trim();
		if (customerId) variables.customerId = toWaveId('Customer', customerId, businessId);
	}
	return variables;
}

const show = (resource: TriggerResource) => ({ show: { resource: [resource] } });

const archivedFilter: INodeProperties = {
	displayName: 'Archived',
	name: 'archived',
	type: 'options',
	options: [
		{ name: 'Active and Archived', value: 'all' },
		{ name: 'Active Only', value: 'active' },
		{ name: 'Archived Only', value: 'archived' },
	],
	default: 'all',
	description: 'Which records to watch. Archiving a record is an update.',
};

const emailFilter: INodeProperties = {
	displayName: 'Email',
	name: 'email',
	type: 'string',
	placeholder: 'name@email.com',
	default: '',
	description: 'Only watch records with this email address',
};

const customerFilter = resourceLocator({
	name: 'customerId',
	displayName: 'Customer',
	searchMethod: 'searchCustomers',
	resourceLabel: 'customer',
	required: false,
	description: 'Only watch records of this customer',
});

const currencyFilter = currencyField();

function filtersFor(resource: TriggerResource, options: INodeProperties[]): INodeProperties {
	return {
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(resource),
		options,
	};
}

export const filterProperties: INodeProperties[] = [
	filtersFor('customer', [archivedFilter, emailFilter]),
	filtersFor('estimate', [
		currencyFilter,
		customerFilter,
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: enumOptions('EstimateListStatusFilter'),
			default: 'ACTIVE',
			description: 'Only watch estimates with this status',
		},
	]),
	filtersFor('invoice', [
		currencyFilter,
		customerFilter,
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: enumOptions('InvoiceStatus'),
			default: 'UNPAID',
			description: 'Only watch invoices with this status',
		},
	]),
	filtersFor('product', [
		archivedFilter,
		{
			displayName: 'Is Bought',
			name: 'isBought',
			type: 'boolean',
			default: true,
			description:
				'Whether to only watch products that the business buys (true) or does not buy (false)',
		},
		{
			displayName: 'Is Sold',
			name: 'isSold',
			type: 'boolean',
			default: true,
			description:
				'Whether to only watch products that the business sells (true) or does not sell (false)',
		},
	]),
	filtersFor('salesTax', [archivedFilter]),
	filtersFor('vendor', [emailFilter]),
];
