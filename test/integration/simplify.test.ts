import type { IDataObject } from 'n8n-workflow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, hasConfig, rl, runNode, uniqueName } from './harness';

const daysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const isPlainObject = (value: unknown): value is IDataObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Lists the paths of nested objects. Lists of objects count as nested too. */
function nestedPaths(record: IDataObject, allowed: string[] = ['address']): string[] {
	return Object.entries(record)
		.filter(
			([key, value]) => (isPlainObject(value) || Array.isArray(value)) && !allowed.includes(key),
		)
		.map(([key]) => key);
}

describe.skipIf(!hasConfig)('simplify', () => {
	const cleanup = new Cleanup();
	let businessId: string;
	let customerId: string;
	let customerName: string;
	let invoiceId: string;

	const business = () => ({ businessId: rl(businessId) });

	beforeAll(async () => {
		businessId = await getTestBusinessId();

		customerName = uniqueName('simplify customer');
		const [customer] = await runNode({
			resource: 'customer',
			operation: 'create',
			...business(),
			name: customerName,
			additionalFields: {
				currency: 'CAD',
				address: {
					addressLine1: '1 Main St',
					city: 'Toronto',
					countryCode: 'CA',
					provinceCode: 'CA-ON',
					postalCode: 'M5V 1A1',
				},
			},
		});
		customerId = customer.id as string;
		cleanup.add('delete customer', async () => {
			await runNode({
				resource: 'customer',
				operation: 'delete',
				...business(),
				customerId: rl(customerId),
			});
		});

		const [income] = await runNode({
			resource: 'account',
			operation: 'getAll',
			...business(),
			returnAll: false,
			limit: 1,
			filters: { types: ['INCOME'] },
		});
		const [product] = await runNode({
			resource: 'product',
			operation: 'create',
			...business(),
			name: uniqueName('simplify product'),
			unitPrice: 12.5,
			additionalFields: { incomeAccountId: rl(income.id as string) },
		});
		cleanup.add('archive product', async () => {
			await runNode({
				resource: 'product',
				operation: 'archive',
				...business(),
				productId: rl(product.id as string),
			});
		});

		const [invoice] = await runNode({
			resource: 'invoice',
			operation: 'create',
			...business(),
			customer: rl(customerId),
			items: {
				itemValues: [
					{
						product: rl(product.id as string),
						description: 'Test work',
						quantity: 2,
						unitPrice: '40',
					},
				],
			},
			additionalFields: {
				invoiceDate: `${daysFromNow(1)}T00:00:00.000Z`,
				dueDate: `${daysFromNow(31)}T00:00:00.000Z`,
			},
		});
		invoiceId = invoice.id as string;
		cleanup.add('delete invoice', async () => {
			await runNode({
				resource: 'invoice',
				operation: 'delete',
				...business(),
				invoiceId: rl(invoiceId),
			});
		});
	}, 60_000);

	afterAll(async () => {
		await cleanup.run();
	}, 60_000);

	it('simplifies invoices', async () => {
		const invoices = await runNode({
			resource: 'invoice',
			operation: 'getAll',
			...business(),
			simplify: true,
			returnAll: false,
			limit: 5,
			sort: 'CREATED_AT_DESC',
			filters: { customer: rl(customerId) },
		});
		const invoice = invoices.find((entry) => entry.id === invoiceId);
		expect(invoice).toBeDefined();
		// Items are a list of records. Every other field is a plain value.
		expect(nestedPaths(invoice!, ['items', 'discounts'])).toEqual([]);
		expect(invoice).toMatchObject({
			customerId,
			customerName,
			total: 80,
			amountDue: 80,
			currency: expect.stringMatching(/^[A-Z]{3}$/),
		});
		for (const field of [
			'subtotal',
			'taxTotal',
			'discountTotal',
			'total',
			'amountPaid',
			'amountDue',
		]) {
			expect(typeof invoice![field]).toBe('number');
		}
		expect(typeof invoice!.exchangeRate).toBe('number');
		expect(invoice!.invoiceNumber).toEqual(expect.any(String));
		const [item] = invoice!.items as IDataObject[];
		expect(item).toMatchObject({ quantity: 2, unitPrice: 40, subtotal: 80 });
		expect(item.productName).toEqual(expect.stringContaining('n8n-test'));
	});

	it('simplifies customers', async () => {
		const customers = await runNode({
			resource: 'customer',
			operation: 'getAll',
			...business(),
			simplify: true,
			returnAll: true,
		});
		const customer = customers.find((entry) => entry.id === customerId);
		expect(customer).toBeDefined();
		expect(nestedPaths(customer!)).toEqual([]);
		expect(customer).toMatchObject({
			currency: 'CAD',
			address: {
				addressLine1: '1 Main St',
				city: 'Toronto',
				province: 'CA-ON',
				country: 'CA',
				postalCode: 'M5V 1A1',
			},
			addressText: '1 Main St, Toronto, CA-ON, M5V 1A1, CA',
		});
		expect(typeof customer!.outstandingAmount).toBe('number');
		expect(typeof customer!.overdueAmount).toBe('number');
	});

	it('simplifies accounts', async () => {
		const accounts = await runNode({
			resource: 'account',
			operation: 'getAll',
			...business(),
			simplify: true,
			returnAll: false,
			limit: 10,
		});
		expect(accounts.length).toBeGreaterThan(0);
		for (const account of accounts) {
			expect(nestedPaths(account)).toEqual([]);
			expect(typeof account.currency).toBe('string');
			expect(typeof account.type).toBe('string');
			expect(typeof account.subtype).toBe('string');
			if (account.balance !== null) expect(typeof account.balance).toBe('number');
		}
	});

	it('returns the raw data when Simplify is off', async () => {
		const [customer] = await runNode({
			resource: 'customer',
			operation: 'get',
			...business(),
			customerId: rl(customerId),
		});
		expect(customer.currency).toMatchObject({ code: 'CAD' });
	});
});
