import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { searchConnection } from '../../nodes/Wave/methods/searchHelpers';
import { enumOptions, toDisplayName } from '../../nodes/Wave/shared/descriptions';
import {
	compactInput,
	fixedCollectionValues,
	getLocatorValue,
	splitList,
	toDate,
	toDateTime,
} from '../../nodes/Wave/shared/utils';

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

describe('toDate', () => {
	it('keeps only the date', () => {
		expect(toDate('2026-11-01T23:30:00')).toBe('2026-11-01');
		expect(toDate('2026-11-01')).toBe('2026-11-01');
		expect(toDate(' 2026-11-01 ')).toBe('2026-11-01');
		expect(toDate(new Date('2026-11-01T10:00:00Z'))).toBe('2026-11-01');
	});

	it('returns undefined for empty or invalid values', () => {
		expect(toDate('')).toBeUndefined();
		expect(toDate(undefined)).toBeUndefined();
		expect(toDate(null)).toBeUndefined();
		expect(toDate('yesterday')).toBeUndefined();
		expect(toDate(new Date('invalid'))).toBeUndefined();
	});
});

describe('splitList', () => {
	it('splits on commas, semicolons and line breaks and drops empty values', () => {
		expect(splitList('a@x.com, b@x.com;\n c@x.com ,')).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
		expect(splitList('a\r\nb')).toEqual(['a', 'b']);
	});

	it('trims list entries', () => {
		expect(splitList(['a', ' b ', ''])).toEqual(['a', 'b']);
	});

	it('returns an empty list for empty values', () => {
		expect(splitList('')).toEqual([]);
		expect(splitList(undefined)).toEqual([]);
	});
});

describe('fixedCollectionValues', () => {
	it('returns the entries of a list', () => {
		expect(fixedCollectionValues({ values: [{ a: 1 }, { a: 2 }] })).toEqual([{ a: 1 }, { a: 2 }]);
	});

	it('turns a single object into a one entry list', () => {
		expect(fixedCollectionValues({ itemValues: { a: 1 } }, 'itemValues')).toEqual([{ a: 1 }]);
	});

	it('returns an empty list when the key is missing or the value is empty', () => {
		expect(fixedCollectionValues({}, 'itemValues')).toEqual([]);
		expect(fixedCollectionValues({ other: [{ a: 1 }] })).toEqual([]);
		expect(fixedCollectionValues(undefined)).toEqual([]);
		expect(fixedCollectionValues('text')).toEqual([]);
	});
});
