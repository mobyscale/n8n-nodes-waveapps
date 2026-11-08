import { afterAll, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, hasConfig, rl, runNode, uniqueName } from './harness';

describe.skipIf(!hasConfig)('sales tax', () => {
	const cleanup = new Cleanup();
	afterAll(async () => await cleanup.run());

	async function createTax(extra: Record<string, unknown> = {}) {
		const businessId = await getTestBusinessId();
		const name = uniqueName('tax');
		const [tax] = await runNode({
			resource: 'salesTax',
			operation: 'create',
			businessId: rl(businessId),
			name,
			abbreviation: `T${Math.floor(Math.random() * 1e8)}`,
			rate: 0.05,
			additionalFields: { description: 'Created by a test', ...extra },
		});
		cleanup.add(`archive ${name}`, async () => {
			// Wave fails when an archived sales tax is archived again
			const [current] = await runNode({
				resource: 'salesTax',
				operation: 'get',
				businessId: rl(businessId),
				salesTaxId: rl(tax.id as string),
			});
			if (current.isArchived) return;
			await runNode({
				resource: 'salesTax',
				operation: 'archive',
				businessId: rl(businessId),
				salesTaxId: rl(tax.id as string),
			});
		});
		return { businessId, name, tax };
	}

	it('creates, gets, updates and archives a sales tax', async () => {
		const { businessId, name, tax } = await createTax({
			taxNumber: '123',
			showTaxNumberOnInvoices: true,
			isCompound: true,
			isRecoverable: true,
		});
		expect(tax).toMatchObject({
			name,
			rate: '0.05',
			description: 'Created by a test',
			taxNumber: '123',
			showTaxNumberOnInvoices: true,
			isCompound: true,
			isRecoverable: true,
			isArchived: false,
		});

		const [fetched] = await runNode({
			resource: 'salesTax',
			operation: 'get',
			businessId: rl(businessId),
			salesTaxId: rl(tax.id as string),
		});
		expect(fetched.id).toBe(tax.id);

		const [renamed] = await runNode({
			resource: 'salesTax',
			operation: 'update',
			businessId: rl(businessId),
			salesTaxId: rl(tax.id as string),
			updateFields: { description: 'Changed', taxNumber: '456' },
		});
		expect(renamed).toMatchObject({ name, description: 'Changed', taxNumber: '456', rate: '0.05' });

		const [rated] = await runNode({
			resource: 'salesTax',
			operation: 'update',
			businessId: rl(businessId),
			salesTaxId: rl(tax.id as string),
			updateFields: { rate: 0.07, rateEffective: '2020-01-01' },
		});
		expect(rated.rate).toBe('0.07');
		expect(rated.rates).toEqual([
			{ effective: '0001-01-01', rate: '0.05' },
			{ effective: '2020-01-01', rate: '0.07' },
		]);

		const [archived] = await runNode({
			resource: 'salesTax',
			operation: 'archive',
			businessId: rl(businessId),
			salesTaxId: rl(tax.id as string),
		});
		expect(archived).toMatchObject({ success: true, id: tax.id });
		expect(archived.salesTax).toMatchObject({ isArchived: true });
	});

	it('gets many sales taxes with filters', async () => {
		const { businessId, tax } = await createTax();
		const active = await runNode({
			resource: 'salesTax',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { modifiedAtAfter: new Date(Date.now() - 3600_000).toISOString() },
		});
		expect(active.map((entry) => entry.id)).toContain(tax.id);

		const archived = await runNode({
			resource: 'salesTax',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { isArchived: true },
		});
		expect(archived.every((entry) => entry.isArchived === true)).toBe(true);
		expect(archived.map((entry) => entry.id)).not.toContain(tax.id);
	});
});
