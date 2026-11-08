import { describe, expect, it } from 'vitest';

import * as listSearch from '../../nodes/Wave/methods/listSearch';
import * as loadOptions from '../../nodes/Wave/methods/loadOptions';
import {
	createExecuteContext,
	createLoadOptionsContext,
	getTestBusinessId,
	hasConfig,
	rl,
	runNode,
} from './harness';
import { waveRequest } from '../../nodes/Wave/transport';

describe.skipIf(!hasConfig)('foundation', () => {
	it('gets the current user', async () => {
		const [user] = await runNode({ resource: 'user', operation: 'getCurrent' });
		expect(user.id).toEqual(expect.any(String));
	});

	it('gets many businesses and one business', async () => {
		const businesses = await runNode({
			resource: 'business',
			operation: 'getAll',
			returnAll: true,
		});
		expect(businesses.length).toBeGreaterThan(0);

		const businessId = await getTestBusinessId();
		const [business] = await runNode({
			resource: 'business',
			operation: 'get',
			businessId: rl(businessId),
		});
		expect(business.id).toBe(businessId);
		expect(business.currency).toMatchObject({ code: expect.any(String) });
	});

	it('accepts a Wave web app URL for the business', async () => {
		const businessId = await getTestBusinessId();
		const uuid = Buffer.from(businessId, 'base64').toString('utf8').split(':')[1];
		const [business] = await runNode({
			resource: 'business',
			operation: 'get',
			businessId: rl(uuid, 'url'),
		});
		expect(business.id).toBe(businessId);
	});

	it('gets reference data', async () => {
		const currencies = await runNode({ resource: 'referenceData', operation: 'getCurrencies' });
		expect(currencies.find((currency) => currency.code === 'USD')).toBeDefined();

		const [country] = await runNode({
			resource: 'referenceData',
			operation: 'getCountry',
			countryCode: 'CA',
		});
		expect(country.provinces).toEqual(expect.arrayContaining([{ code: 'CA-ON', name: 'Ontario' }]));

		const [province] = await runNode({
			resource: 'referenceData',
			operation: 'getProvince',
			provinceCode: 'CA-ON',
		});
		expect(province.name).toBe('Ontario');
	});

	it('reports GraphQL errors as node errors', async () => {
		await expect(
			waveRequest(createExecuteContext({}), 'query { business(id: "bad") { id } }'),
		).rejects.toThrow(/could not be found|not found|invalid/i);
	});

	it('searches businesses and accounts for the list pickers', async () => {
		const businesses = await listSearch.searchBusinesses.call(createLoadOptionsContext());
		expect(businesses.results.length).toBeGreaterThan(0);

		const businessId = await getTestBusinessId();
		const context = createLoadOptionsContext({ businessId: rl(businessId) });
		const expense = await listSearch.searchExpenseAccounts.call(context);
		expect(expense.results.length).toBeGreaterThan(0);
		const filtered = await listSearch.searchAccounts.call(context, 'Accounts Payable');
		expect(filtered.results.map((result) => result.name).join()).toMatch(/Accounts Payable/);
	});

	it('loads dropdown options', async () => {
		const context = createLoadOptionsContext({ address: { countryCode: 'US' } });
		const provinces = await loadOptions.getProvinces.call(context);
		expect(provinces.find((province) => province.value === 'US-NY')).toBeDefined();
		expect(provinces.find((province) => province.value === 'CA-ON')).toBeUndefined();

		const subtypes = await loadOptions.getAccountSubtypes.call(createLoadOptionsContext());
		expect(subtypes.find((subtype) => subtype.value === 'CASH_AND_BANK')).toBeDefined();
	});
});
