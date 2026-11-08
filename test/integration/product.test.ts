import { afterAll, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, hasConfig, rl, runNode, uniqueName } from './harness';

describe.skipIf(!hasConfig)('product', () => {
	const cleanup = new Cleanup();
	afterAll(async () => await cleanup.run());

	function archiveLater(businessId: string, resource: string, key: string, id: string) {
		cleanup.add(`archive ${resource} ${id}`, async () => {
			await runNode({
				resource,
				operation: 'archive',
				businessId: rl(businessId),
				[key]: rl(id),
			});
		});
	}

	async function firstAccount(businessId: string, type: string) {
		const [account] = await runNode({
			resource: 'account',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: false,
			limit: 1,
			filters: { types: [type] },
		});
		return account;
	}

	it('creates, gets, updates and archives a product', async () => {
		const businessId = await getTestBusinessId();
		const [tax] = await runNode({
			resource: 'salesTax',
			operation: 'create',
			businessId: rl(businessId),
			name: uniqueName('tax'),
			abbreviation: `T${Math.floor(Math.random() * 1e8)}`,
			rate: 0.05,
			additionalFields: {},
		});
		archiveLater(businessId, 'salesTax', 'salesTaxId', tax.id as string);
		const income = await firstAccount(businessId, 'INCOME');
		const expense = await firstAccount(businessId, 'EXPENSE');

		const name = uniqueName('product');
		const [product] = await runNode({
			resource: 'product',
			operation: 'create',
			businessId: rl(businessId),
			name,
			unitPrice: 12.5,
			additionalFields: {
				description: 'Created by a test',
				incomeAccountId: rl(income.id as string),
				expenseAccountId: rl(expense.id as string),
				defaultSalesTaxes: { items: [{ salesTaxId: rl(tax.id as string) }] },
			},
		});
		archiveLater(businessId, 'product', 'productId', product.id as string);
		expect(product).toMatchObject({
			name,
			unitPrice: '12.5',
			isSold: true,
			isBought: true,
			isArchived: false,
			incomeAccount: { id: income.id },
			expenseAccount: { id: expense.id },
			defaultSalesTaxes: [{ id: tax.id }],
		});

		const [fetched] = await runNode({
			resource: 'product',
			operation: 'get',
			businessId: rl(businessId),
			productId: rl(product.id as string),
		});
		expect(fetched.id).toBe(product.id);

		const [updated] = await runNode({
			resource: 'product',
			operation: 'update',
			businessId: rl(businessId),
			productId: rl(product.id as string),
			updateFields: { unitPrice: 20, description: 'Changed', defaultSalesTaxes: {} },
		});
		expect(updated).toMatchObject({
			unitPrice: '20',
			description: 'Changed',
			defaultSalesTaxes: [],
		});
		expect(updated.name).toBe(name);

		const [archived] = await runNode({
			resource: 'product',
			operation: 'archive',
			businessId: rl(businessId),
			productId: rl(product.id as string),
		});
		expect(archived).toMatchObject({ success: true, id: product.id });
		expect(archived.product).toMatchObject({ isArchived: true });
	});

	it('gets many products with filters and sort', async () => {
		const businessId = await getTestBusinessId();
		const income = await firstAccount(businessId, 'INCOME');
		const [product] = await runNode({
			resource: 'product',
			operation: 'create',
			businessId: rl(businessId),
			name: uniqueName('product list'),
			unitPrice: 1,
			additionalFields: { incomeAccountId: rl(income.id as string) },
		});
		archiveLater(businessId, 'product', 'productId', product.id as string);

		const all = await runNode({
			resource: 'product',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { modifiedAtAfter: new Date(Date.now() - 3600_000).toISOString() },
			sort: ['NAME_ASC'],
		});
		expect(all.map((entry) => entry.id)).toContain(product.id);
		const names = all.map((entry) => entry.name as string);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

		const none = await runNode({
			resource: 'product',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { isSold: false, isBought: false, modifiedAtBefore: '2000-01-01T00:00:00.000Z' },
		});
		expect(none).toHaveLength(0);
	});
});
