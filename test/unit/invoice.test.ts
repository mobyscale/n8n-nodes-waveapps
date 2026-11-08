import { describe, expect, it } from 'vitest';

import {
	buildDiscounts,
	buildInvoiceFields,
	buildItems,
	buildTaxes,
} from '../../nodes/Wave/resources/invoice/builders';

const rl = (value: string) => ({ __rl: true, mode: 'list', value });

describe('buildTaxes', () => {
	it('maps sales tax locators and skips empty ones', () => {
		expect(
			buildTaxes({
				taxValues: [{ salesTax: rl('tax-1') }, { salesTax: rl('') }, { salesTax: 'tax-2' }],
			}),
		).toEqual([{ salesTaxId: 'tax-1' }, { salesTaxId: 'tax-2' }]);
	});

	it('returns undefined without taxes, so Wave uses the product taxes', () => {
		expect(buildTaxes({})).toBeUndefined();
		expect(buildTaxes(undefined)).toBeUndefined();
		expect(buildTaxes({ taxValues: [] })).toBeUndefined();
	});
});

describe('buildItems', () => {
	it('builds items and removes empty optional values', () => {
		expect(
			buildItems({
				itemValues: [
					{
						product: rl('product-1'),
						description: '',
						quantity: 2,
						unitPrice: '',
						taxes: { taxValues: [{ salesTax: rl('tax-1') }] },
					},
					{
						product: rl('product-2'),
						description: 'Work',
						quantity: 1,
						unitPrice: 12.5,
						taxes: {},
					},
				],
			}),
		).toEqual([
			{ productId: 'product-1', quantity: 2, taxes: [{ salesTaxId: 'tax-1' }] },
			{ productId: 'product-2', description: 'Work', quantity: 1, unitPrice: '12.5' },
		]);
	});

	it('returns an empty list when there are no items', () => {
		expect(buildItems({})).toEqual([]);
		expect(buildItems(undefined)).toEqual([]);
	});
});

describe('buildDiscounts', () => {
	it('sends the percentage of a percentage discount', () => {
		expect(
			buildDiscounts({
				discountValues: { discountType: 'PERCENTAGE', name: 'Early', percentage: 10, amount: 0 },
			}),
		).toEqual([{ discountType: 'PERCENTAGE', name: 'Early', percentage: 10 }]);
	});

	it('sends the amount of a fixed discount as a string', () => {
		expect(
			buildDiscounts({
				discountValues: [{ discountType: 'FIXED', name: '', amount: 5, percentage: 0 }],
			}),
		).toEqual([{ discountType: 'FIXED', amount: '5' }]);
	});
});

describe('buildInvoiceFields', () => {
	it('maps locators, dates, items and discounts', () => {
		expect(
			buildInvoiceFields({
				customer: rl('customer-1'),
				invoiceDate: '2026-03-04T00:00:00.000',
				dueDate: '2026-04-04T10:00:00.000Z',
				title: 'Invoice',
				memo: '',
				items: { itemValues: [{ product: rl('p'), quantity: 1 }] },
				discounts: {},
				hideName: false,
			}),
		).toEqual({
			customerId: 'customer-1',
			invoiceDate: '2026-03-04',
			dueDate: '2026-04-04',
			title: 'Invoice',
			items: [{ productId: 'p', quantity: 1 }],
			hideName: false,
		});
	});

	it('does not send items when the list is empty', () => {
		expect(buildInvoiceFields({ items: {} })).toEqual({});
	});
});
