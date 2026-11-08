import type { IDisplayOptions, INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { WAVE_ENUMS, type WaveEnumValue } from '../generated/enums';

/** Builds display options for the fields of one resource. */
export function showFor(
	resource: string,
	operations?: string[],
	extra: Record<string, unknown[]> = {},
): IDisplayOptions {
	return {
		show: {
			resource: [resource],
			...(operations ? { operation: operations } : {}),
			...extra,
		},
	};
}

const WAVE_ID_REGEX = '^[A-Za-z0-9+/=_-]{8,}$';

export interface LocatorOptions {
	name: string;
	displayName: string;
	/** The listSearch method, for example "searchCustomers". */
	searchMethod: string;
	/** Display name of the resource in hints, for example "customer". */
	resourceLabel: string;
	required?: boolean;
	description?: string;
	displayOptions?: IDisplayOptions;
}

/** A resource locator with a searchable list and an ID mode. */
export function resourceLocator(options: LocatorOptions): INodeProperties {
	return {
		displayName: options.displayName,
		name: options.name,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: options.required ?? true,
		description: options.description,
		displayOptions: options.displayOptions,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: `Select a ${options.resourceLabel}...`,
				typeOptions: {
					searchListMethod: options.searchMethod,
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. QnVzaW5lc3M6...',
				hint: `The Wave API ID of the ${options.resourceLabel}. A raw UUID from a webhook is also accepted.`,
				validation: [
					{
						type: 'regex',
						properties: { regex: WAVE_ID_REGEX, errorMessage: 'Not a valid Wave ID' },
					},
				],
			},
		],
	};
}

/**
 * The business picker. Most operations need it. The URL mode accepts any Wave web app URL,
 * which contains the raw business UUID, for example https://next.waveapps.com/{uuid}/invoices.
 */
export function businessLocator(displayOptions?: IDisplayOptions): INodeProperties {
	return {
		displayName: 'Business',
		name: 'businessId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The Wave business to work with',
		displayOptions,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a business...',
				typeOptions: { searchListMethod: 'searchBusinesses', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. QnVzaW5lc3M6...',
				hint: 'The Wave API ID of the business, or the raw business UUID',
				validation: [
					{
						type: 'regex',
						properties: { regex: WAVE_ID_REGEX, errorMessage: 'Not a valid Wave ID' },
					},
				],
			},
			{
				displayName: 'By URL',
				name: 'url',
				type: 'string',
				placeholder:
					'e.g. https://next.waveapps.com/3be6dae8-c292-4963-8f70-8440f8bb68f3/dashboard',
				extractValue: { type: 'regex', regex: 'waveapps\\.com/([0-9a-fA-F-]{36})' },
				validation: [
					{
						type: 'regex',
						properties: {
							regex: 'waveapps\\.com/[0-9a-fA-F-]{36}',
							errorMessage: 'Not a Wave URL that contains a business ID',
						},
					},
				],
			},
		],
	};
}

/** "Return All" and "Limit" fields for a Get Many operation. */
export function paginationFields(displayOptions: IDisplayOptions): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions,
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			displayOptions: {
				...displayOptions,
				show: { ...displayOptions.show, returnAll: [false] },
			},
		},
	];
}

/** Turns "CASH_AND_BANK" into "Cash And Bank". */
export function toDisplayName(value: string): string {
	return value
		.toLowerCase()
		.split('_')
		.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
		.join(' ');
}

/** Dropdown options for a Wave GraphQL enum, sorted by name, without deprecated values. */
export function enumOptions(
	name: keyof typeof WAVE_ENUMS,
	options: { exclude?: string[]; names?: Record<string, string> } = {},
): INodePropertyOptions[] {
	const values: WaveEnumValue[] = WAVE_ENUMS[name];
	return values
		.filter((entry) => !entry.deprecated && !options.exclude?.includes(entry.value))
		.map((entry) => ({
			name: options.names?.[entry.value] ?? toDisplayName(entry.value),
			value: entry.value,
			...(entry.description ? { description: entry.description } : {}),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fields for a Wave address (AddressInput). Use inside a collection named "address".
 * The province list depends on the country that is set in the same collection.
 */
export const addressFields: INodeProperties[] = [
	{
		displayName: 'Address Line 1',
		name: 'addressLine1',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Address Line 2',
		name: 'addressLine2',
		type: 'string',
		default: '',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Country Name or ID',
		name: 'countryCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCountries' },
		default: '',
		description:
			'Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Province or State Name or ID',
		name: 'provinceCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getProvinces' },
		default: '',
		description:
			'Choose from the list, or specify an ISO 3166-2 code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Set the country first to see only its provinces. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Postal Code',
		name: 'postalCode',
		type: 'string',
		default: '',
	},
];

export const SIMPLIFY_DESCRIPTION =
	'Whether to return a simplified version of the response instead of the raw data';

/** The Simplify toggle. The node applies it to the output of the operations that show it. */
export function simplifyField(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		description: SIMPLIFY_DESCRIPTION,
		displayOptions: showFor(resource, operations),
	};
}

/** A currency dropdown (Wave CurrencyCode). */
export function currencyField(overrides: Partial<INodeProperties> = {}): INodeProperties {
	return {
		displayName: 'Currency Name or ID',
		name: 'currency',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCurrencies' },
		default: '',
		description:
			'Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		...overrides,
	} as INodeProperties;
}
