import { afterAll, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, hasConfig, rl, runNode, uniqueName } from './harness';

describe.skipIf(!hasConfig)('customer', () => {
	const cleanup = new Cleanup();
	afterAll(async () => {
		await cleanup.run();
	});

	const base = async () => ({ resource: 'customer', businessId: rl(await getTestBusinessId()) });

	async function createCustomer(additionalFields: Record<string, unknown> = {}) {
		const name = uniqueName('customer');
		const [customer] = await runNode({
			...(await base()),
			operation: 'create',
			name,
			additionalFields,
		});
		cleanup.add(`delete ${name}`, async () => {
			await runNode({
				...(await base()),
				operation: 'delete',
				customerId: rl(customer.id as string),
			}).catch(() => undefined);
		});
		return { name, customer };
	}

	it('creates a customer with all kinds of fields', async () => {
		const { name, customer } = await createCustomer({
			firstName: 'Ada',
			lastName: 'Lovelace',
			displayId: 'N8N-1',
			email: 'ada@example.com',
			mobile: '5551230001',
			phone: '5551230002',
			fax: '5551230003',
			tollFree: '8005551234',
			website: 'https://example.com',
			internalNotes: 'Created by a test',
			currency: 'CAD',
			address: {
				addressLine1: '1 Main St',
				city: 'Toronto',
				countryCode: 'CA',
				provinceCode: 'CA-ON',
			},
			shippingDetails: {
				name: 'Warehouse',
				phone: '5551230004',
				instructions: 'Use the back door',
				address: { addressLine1: '2 Dock Rd', city: 'Ottawa', countryCode: 'CA' },
			},
		});
		expect(customer).toMatchObject({
			name,
			firstName: 'Ada',
			email: 'ada@example.com',
			currency: { code: 'CAD' },
			address: { city: 'Toronto', province: { code: 'CA-ON' } },
			shippingDetails: { name: 'Warehouse', instructions: 'Use the back door' },
		});
	});

	function trackDelete(id: string) {
		cleanup.add(`delete ${id}`, async () => {
			await runNode({
				...(await base()),
				operation: 'delete',
				customerId: rl(id),
			}).catch(() => undefined);
		});
	}

	it('creates, then updates, a customer with Create or Update by email', async () => {
		const name = uniqueName('upsert');
		const email = `n8n-test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
		const parameters = async (phone: string) => ({
			...(await base()),
			operation: 'upsert',
			matchBy: 'email',
			name,
			additionalFields: { email, phone },
		});

		const [first] = await runNode(await parameters('5551110001'));
		const id = first.id as string;
		trackDelete(id);
		expect(first).toMatchObject({ name, email, phone: '5551110001' });

		const [second] = await runNode(await parameters('5551110002'));
		expect(second.id).toBe(id);
		expect(second.phone).toBe('5551110002');

		const [fetched] = await runNode({ ...(await base()), operation: 'get', customerId: rl(id) });
		expect(fetched).toMatchObject({ id, name, email, phone: '5551110002' });
	});

	it('creates, then updates, a customer with Create or Update by name', async () => {
		const name = uniqueName('upsert name');
		const parameters = async (phone: string, matchName: string) => ({
			...(await base()),
			operation: 'upsert',
			matchBy: 'name',
			name: matchName,
			additionalFields: { phone },
		});

		const [first] = await runNode(await parameters('5552220001', name));
		const id = first.id as string;
		trackDelete(id);

		const [second] = await runNode(await parameters('5552220002', ` ${name.toUpperCase()} `));
		expect(second.id).toBe(id);
		expect(second.phone).toBe('5552220002');
	});

	it('gets, lists, updates and deletes a customer', async () => {
		const { name, customer } = await createCustomer({ email: 'flow@example.com' });
		const id = customer.id as string;

		const [fetched] = await runNode({ ...(await base()), operation: 'get', customerId: rl(id) });
		expect(fetched).toMatchObject({ id, name, email: 'flow@example.com' });

		const found = await runNode({
			...(await base()),
			operation: 'getAll',
			returnAll: true,
			filters: { email: 'flow@example.com' },
			options: { sort: 'CREATED_AT_DESC' },
		});
		expect(found.map((entry) => entry.id)).toContain(id);

		const recent = await runNode({
			...(await base()),
			operation: 'getAll',
			returnAll: false,
			limit: 5,
			filters: { modifiedAtAfter: new Date(Date.now() - 3600_000).toISOString() },
		});
		expect(recent.length).toBeLessThanOrEqual(5);

		const [updated] = await runNode({
			...(await base()),
			operation: 'update',
			customerId: rl(id),
			updateFields: { name: `${name} v2`, phone: '5559990000', address: { city: 'Calgary' } },
		});
		expect(updated).toMatchObject({ id, name: `${name} v2`, phone: '5559990000' });
		expect(updated.address).toMatchObject({ city: 'Calgary' });
		expect(updated.email).toBe('flow@example.com');

		const [deleted] = await runNode({
			...(await base()),
			operation: 'delete',
			customerId: rl(id),
		});
		expect(deleted).toEqual({ success: true, id });

		const after = await runNode({
			...(await base()),
			operation: 'getAll',
			returnAll: true,
			filters: { email: 'flow@example.com' },
		});
		expect(after.map((entry) => entry.id)).not.toContain(id);
	});
});
