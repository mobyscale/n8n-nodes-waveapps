import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../shared/descriptions';
import { CURRENCY_FIELDS } from '../../shared/fields';
import { getRequiredString } from '../../shared/utils';
import { waveRequest } from '../../transport';
import type { ResourceModule } from '../types';

const RESOURCE = 'referenceData';

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Get Account Subtypes',
				value: 'getAccountSubtypes',
				description: 'Get the account subtypes that Wave supports in the chart of accounts',
				action: 'Get account subtypes',
			},
			{
				name: 'Get Account Types',
				value: 'getAccountTypes',
				description: 'Get the account types (asset, liability, equity, income, expense)',
				action: 'Get account types',
			},
			{
				name: 'Get Countries',
				value: 'getCountries',
				description: 'Get the countries that Wave supports, with their provinces',
				action: 'Get countries',
			},
			{
				name: 'Get Country',
				value: 'getCountry',
				description: 'Get a country and its provinces',
				action: 'Get a country',
			},
			{
				name: 'Get Currencies',
				value: 'getCurrencies',
				description: 'Get the currencies that Wave supports',
				action: 'Get currencies',
			},
			{
				name: 'Get Currency',
				value: 'getCurrency',
				description: 'Get a currency',
				action: 'Get a currency',
			},
			{
				name: 'Get Province',
				value: 'getProvince',
				description: 'Get a province or state by its ISO 3166-2 code',
				action: 'Get a province',
			},
		],
		default: 'getCurrencies',
	},
	{
		displayName: 'Country Name or ID',
		name: 'countryCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCountries' },
		required: true,
		default: '',
		description:
			'Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: showFor(RESOURCE, ['getCountry']),
	},
	{
		displayName: 'Currency Name or ID',
		name: 'currencyCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCurrencies' },
		required: true,
		default: '',
		description:
			'Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: showFor(RESOURCE, ['getCurrency']),
	},
	{
		displayName: 'Province Name or ID',
		name: 'provinceCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getProvinces' },
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ISO 3166-2 code (for example CA-ON) using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: showFor(RESOURCE, ['getProvince']),
	},
];

const COUNTRY_FIELDS = `code name nameWithArticle currency { ${CURRENCY_FIELDS} } provinces { code name }`;
const CURRENCY_DETAIL_FIELDS = `${CURRENCY_FIELDS} plural exponent`;

export const referenceDataResource: ResourceModule = {
	option: { name: 'Reference Data', value: RESOURCE },
	description,
	operations: {
		async getAccountSubtypes({ itemIndex }) {
			const data = await waveRequest<{ accountSubtypes: IDataObject[] }>(
				this,
				'query { accountSubtypes { name value description archivable systemCreated type { name value normalBalanceType } } }',
				{},
				{ itemIndex },
			);
			return data.accountSubtypes;
		},
		async getAccountTypes({ itemIndex }) {
			const data = await waveRequest<{ accountTypes: IDataObject[] }>(
				this,
				'query { accountTypes { name value normalBalanceType } }',
				{},
				{ itemIndex },
			);
			return data.accountTypes;
		},
		async getCountries({ itemIndex }) {
			const data = await waveRequest<{ countries: IDataObject[] }>(
				this,
				`query { countries { ${COUNTRY_FIELDS} } }`,
				{},
				{ itemIndex },
			);
			return data.countries;
		},
		async getCountry({ itemIndex }) {
			const code = getRequiredString.call(this, 'countryCode', itemIndex);
			const data = await waveRequest<{ country: IDataObject | null }>(
				this,
				`query($code: CountryCode!) { country(code: $code) { ${COUNTRY_FIELDS} } }`,
				{ code },
				{ itemIndex },
			);
			return data.country ?? {};
		},
		async getCurrencies({ itemIndex }) {
			const data = await waveRequest<{ currencies: IDataObject[] }>(
				this,
				`query { currencies { ${CURRENCY_DETAIL_FIELDS} } }`,
				{},
				{ itemIndex },
			);
			return data.currencies;
		},
		async getCurrency({ itemIndex }) {
			const code = getRequiredString.call(this, 'currencyCode', itemIndex);
			const data = await waveRequest<{ currency: IDataObject | null }>(
				this,
				`query($code: CurrencyCode!) { currency(code: $code) { ${CURRENCY_DETAIL_FIELDS} } }`,
				{ code },
				{ itemIndex },
			);
			return data.currency ?? {};
		},
		async getProvince({ itemIndex }) {
			const code = getRequiredString.call(this, 'provinceCode', itemIndex);
			const data = await waveRequest<{ province: IDataObject | null }>(
				this,
				'query($code: String!) { province(code: $code) { code name } }',
				{ code },
				{ itemIndex },
			);
			return data.province ?? {};
		},
	},
};
