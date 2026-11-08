import { describe, expect, it } from 'vitest';

import { getTestBusinessId, hasConfig, rl, runNode } from './harness';

describe.skipIf(!hasConfig)('vendor', () => {
	it('gets many vendors and one vendor', async () => {
		const businessId = rl(await getTestBusinessId());
		const vendors = await runNode({
			resource: 'vendor',
			operation: 'getAll',
			businessId,
			returnAll: true,
		});
		expect(Array.isArray(vendors)).toBe(true);

		// Wave cannot create vendors through the API, so Get needs an existing one.
		if (vendors.length === 0) return;
		const [vendor] = await runNode({
			resource: 'vendor',
			operation: 'get',
			businessId,
			vendorId: rl(vendors[0].id as string),
		});
		expect(vendor.id).toBe(vendors[0].id);
	});

	it('accepts the filters', async () => {
		const vendors = await runNode({
			resource: 'vendor',
			operation: 'getAll',
			businessId: rl(await getTestBusinessId()),
			returnAll: true,
			filters: { email: 'nobody@example.invalid', modifiedAtAfter: '2020-01-01T00:00:00Z' },
		});
		expect(vendors).toEqual([]);
	});
});
