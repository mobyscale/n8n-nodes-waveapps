import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { waveRequest } from '../transport';

interface Country {
	code: string;
	name: string;
	provinces: Array<{ code: string; name: string }>;
}

const byName = (a: INodePropertyOptions, b: INodePropertyOptions) => a.name.localeCompare(b.name);

export async function getCurrencies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const data = await waveRequest<{ currencies: Array<{ code: string; name: string }> }>(
		this,
		'query { currencies { code name } }',
	);
	return data.currencies
		.map((currency) => ({ name: `${currency.code} - ${currency.name}`, value: currency.code }))
		.sort(byName);
}

export async function getCountries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const data = await waveRequest<{ countries: Array<{ code: string; name: string }> }>(
		this,
		'query { countries { code name } }',
	);
	return data.countries
		.map((country) => ({ name: country.name, value: country.code }))
		.sort(byName);
}

/** Reads the country set beside the province field, when there is one. */
function getSelectedCountry(ctx: ILoadOptionsFunctions): string | undefined {
	const paths = ['address.countryCode', 'countryCode', 'shippingAddress.countryCode'];
	for (const path of paths) {
		try {
			const value = ctx.getCurrentNodeParameter(path);
			if (typeof value === 'string' && value) return value;
		} catch {
			continue;
		}
	}
	const parameters = ctx.getCurrentNodeParameters() as IDataObject | undefined;
	const country = JSON.stringify(parameters ?? {}).match(/"countryCode":"([A-Z]{2})"/);
	return country?.[1];
}

export async function getProvinces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const data = await waveRequest<{ countries: Country[] }>(
		this,
		'query { countries { code name provinces { code name } } }',
	);
	const selected = getSelectedCountry(this);
	const countries = selected
		? data.countries.filter((country) => country.code === selected)
		: data.countries;
	const showCountry = countries.length > 1;
	return countries
		.flatMap((country) =>
			country.provinces.map((province) => ({
				name: showCountry ? `${province.name} (${country.name})` : province.name,
				value: province.code,
			})),
		)
		.sort(byName);
}

export async function getAccountTypes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const data = await waveRequest<{
		accountTypes: Array<{ name: string; value: string; normalBalanceType: string }>;
	}>(this, 'query { accountTypes { name value normalBalanceType } }');
	return data.accountTypes
		.map((type) => ({
			name: type.name,
			value: type.value,
			description: `Normal balance: ${type.normalBalanceType.toLowerCase()}`,
		}))
		.sort(byName);
}

export async function getAccountSubtypes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const data = await waveRequest<{
		accountSubtypes: Array<{
			name: string;
			value: string;
			description?: string | null;
			type: { name: string };
		}>;
	}>(this, 'query { accountSubtypes { name value description type { name } } }');
	return data.accountSubtypes
		.map((subtype) => ({
			name: `${subtype.name} (${subtype.type.name})`,
			value: subtype.value,
			...(subtype.description ? { description: subtype.description } : {}),
		}))
		.sort(byName);
}
