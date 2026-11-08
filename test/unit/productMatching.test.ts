import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { findOrCreateProduct, resolveItemProducts } from '../../nodes/Wave/shared/productMatching';

const node = {
	id: '1',
	name: 'Wave',
	type: 'n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

const BUSINESS = 'QnVzaW5lc3M6YQ==';
const config = { businessId: BUSINESS, incomeAccountId: 'income-1' };

interface MockProduct {
	id: string;
	name: string;
	isArchived?: boolean;
}

function createContext(products: MockProduct[]) {
	let created = 0;
	const request = vi.fn(async (_type: string, options: { body: IDataObject }) => {
		const query = String(options.body.query);
		const variables = options.body.variables as IDataObject;
		if (query.includes('productCreate')) {
			created++;
			return {
				data: {
					productCreate: { didSucceed: true, inputErrors: [], product: { id: `new-${created}` } },
				},
			};
		}
		return {
			data: {
				business: {
					products: {
						pageInfo: { currentPage: variables.page, totalPages: 1, totalCount: products.length },
						edges: products.map((product) => ({ node: product })),
					},
				},
			},
		};
	});
	const ctx = {
		getNode: () => node,
		getInputData: () => [{ json: {} }],
		getNodeParameter: (_name: string, _index: number, fallback?: unknown) =>
			fallback ?? 'accessToken',
		helpers: { httpRequestWithAuthentication: request },
	} as unknown as IExecuteFunctions;
	const calls = (needle: string) =>
		request.mock.calls.filter(([, options]) => String(options.body.query).includes(needle));
	return { ctx, calls };
}

describe('findOrCreateProduct', () => {
	it('matches by trimmed name without case', async () => {
		const { ctx } = createContext([{ id: 'p1', name: 'Web Design' }]);
		expect(await findOrCreateProduct(ctx, 0, config, '  web DESIGN ')).toBe('p1');
	});

	it('does not match an archived product and creates a new one', async () => {
		const { ctx, calls } = createContext([{ id: 'p1', name: 'Old', isArchived: true }]);
		expect(await findOrCreateProduct(ctx, 0, config, 'Old', '12.5')).toBe('new-1');
		const [[, options]] = calls('productCreate');
		expect((options.body.variables as IDataObject).input).toEqual({
			businessId: BUSINESS,
			name: 'Old',
			unitPrice: '12.5',
			incomeAccountId: 'income-1',
		});
	});

	it('uses a unit price of 0 when the line has none', async () => {
		const { ctx, calls } = createContext([]);
		await findOrCreateProduct(ctx, 0, config, 'Thing');
		const [[, options]] = calls('productCreate');
		expect(((options.body.variables as IDataObject).input as IDataObject).unitPrice).toBe('0');
	});

	it('uses the first product when two have the same name', async () => {
		const { ctx } = createContext([
			{ id: 'first', name: 'Same' },
			{ id: 'second', name: 'same' },
		]);
		expect(await findOrCreateProduct(ctx, 0, config, 'Same')).toBe('first');
	});

	it('loads the product list once and caches created products', async () => {
		const { ctx, calls } = createContext([{ id: 'p1', name: 'Known' }]);
		await findOrCreateProduct(ctx, 0, config, 'Known');
		await findOrCreateProduct(ctx, 1, config, 'known');
		const first = await findOrCreateProduct(ctx, 2, config, 'Fresh');
		const second = await findOrCreateProduct(ctx, 3, config, ' fresh ');
		expect(second).toBe(first);
		expect(calls('products(')).toHaveLength(1);
		expect(calls('productCreate')).toHaveLength(1);
	});
});

describe('resolveItemProducts', () => {
	it('replaces Product Name with the product ID for each line', async () => {
		const { ctx } = createContext([{ id: 'p1', name: 'Known' }]);
		const result = await resolveItemProducts(ctx, 0, config, {
			itemValues: [
				{ productName: 'known', quantity: 2, unitPrice: '5' },
				{ productName: 'Brand New', quantity: 1 },
			],
		});
		expect(result).toEqual({
			itemValues: [
				{ quantity: 2, unitPrice: '5', product: 'p1' },
				{ quantity: 1, product: 'new-1' },
			],
		});
	});

	it('fails when a line has no product name', async () => {
		const { ctx } = createContext([]);
		await expect(
			resolveItemProducts(ctx, 0, config, { itemValues: [{ productName: ' ' }] }),
		).rejects.toThrow(/Item 1 has no Product Name/);
	});
});
