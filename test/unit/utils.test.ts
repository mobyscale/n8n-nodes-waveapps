import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { searchConnection } from '../../nodes/Wave/methods/searchHelpers';
import { enumOptions, toDisplayName } from '../../nodes/Wave/shared/descriptions';
import { compactInput, getLocatorValue, toDateTime } from '../../nodes/Wave/shared/utils';

describe('compactInput', () => {
	it('removes empty values and empty nested objects', () => {
		expect(
			compactInput({
				name: 'A',
				email: '',
				phone: undefined,
				address: { city: '', countryCode: '' },
				shipping: { name: 'B', phone: '' },
				clear: null,
				tags: [],
			}),
		).toEqual({ name: 'A', shipping: { name: 'B' }, clear: null, tags: [] });
	});
});

describe('getLocatorValue', () => {
	it('reads resource locator values and plain values', () => {
		expect(getLocatorValue({ __rl: true, mode: 'list', value: 'x' })).toBe('x');
		expect(getLocatorValue({ __rl: true, mode: 'list', value: '' })).toBeUndefined();
		expect(getLocatorValue('y')).toBe('y');
		expect(getLocatorValue(undefined)).toBeUndefined();
	});
});

describe('enum helpers', () => {
	it('builds display names and options', () => {
		expect(toDisplayName('CASH_AND_BANK')).toBe('Cash And Bank');
		const options = enumOptions('TransactionDirection');
		expect(options.map((option) => option.value)).toEqual(['DEPOSIT', 'WITHDRAWAL']);
	});
});

describe('searchConnection', () => {
	function createContext(pages: Array<{ names: string[]; totalPages: number }>) {
		const request = vi.fn();
		pages.forEach((page, index) =>
			request.mockResolvedValueOnce({
				data: {
					items: {
						pageInfo: { currentPage: index + 1, totalPages: page.totalPages },
						edges: page.names.map((name) => ({ node: { id: name, name } })),
					},
				},
			}),
		);
		const context = {
			getNode: () => ({ name: 'Wave' }),
			getNodeParameter: () => 'accessToken',
			helpers: { httpRequestWithAuthentication: request },
		} as unknown as ILoadOptionsFunctions;
		return { context, request };
	}

	const config = {
		query: 'query',
		getConnection: (data: Record<string, unknown>) => data.items as never,
		toItem: (node: { id: string; name: string }) => ({ name: node.name, value: node.id }),
	};

	it('returns one page and a token without a filter', async () => {
		const { context } = createContext([{ names: ['A', 'B'], totalPages: 2 }]);
		const result = await searchConnection(context, config);
		expect(result).toEqual({
			results: [
				{ name: 'A', value: 'A' },
				{ name: 'B', value: 'B' },
			],
			paginationToken: '2',
		});
	});

	it('reads more pages to find matches for a filter', async () => {
		const { context, request } = createContext([
			{ names: ['Alpha', 'Beta'], totalPages: 2 },
			{ names: ['Alphabet'], totalPages: 2 },
		]);
		const result = await searchConnection(context, config, 'alph');
		expect(result.results.map((item) => item.name)).toEqual(['Alpha', 'Alphabet']);
		expect(result.paginationToken).toBeUndefined();
		expect(request).toHaveBeenCalledTimes(2);
	});
});

describe('toDateTime', () => {
	it('returns an ISO string with a time zone', () => {
		expect(toDateTime('2024-05-01T10:00:00+02:00')).toBe('2024-05-01T08:00:00.000Z');
	});

	it('returns undefined for empty values', () => {
		expect(toDateTime('')).toBeUndefined();
		expect(toDateTime(undefined)).toBeUndefined();
	});
});
