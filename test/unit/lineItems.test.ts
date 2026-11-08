import { describe, expect, it } from 'vitest';

import {
	buildDiscounts,
	buildLineItems,
	discountsField,
	itemsField,
} from '../../nodes/Wave/shared/lineItems';

const rl = (value: string) => ({ __rl: true, mode: 'list', value });

describe('buildLineItems', () => {
	it('builds items, sends the unit price as a string and removes empty optional values', () => {
		expect(
			buildLineItems({
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

	it('skips empty sales tax locators and leaves the taxes out when none is left', () => {
		expect(
			buildLineItems({
				itemValues: [
					{
						product: rl('p'),
						taxes: {
							taxValues: [{ salesTax: rl('tax-1') }, { salesTax: rl('') }, { salesTax: 'tax-2' }],
						},
					},
					{ product: rl('p'), taxes: { taxValues: [{ salesTax: rl('') }] } },
					{ product: rl('p'), taxes: { taxValues: [] } },
				],
			}),
		).toEqual([
			{ productId: 'p', taxes: [{ salesTaxId: 'tax-1' }, { salesTaxId: 'tax-2' }] },
			{ productId: 'p' },
			{ productId: 'p' },
		]);
	});

	it('accepts a single entry that is not in a list', () => {
		expect(buildLineItems({ itemValues: { product: rl('p'), quantity: 1 } })).toEqual([
			{ productId: 'p', quantity: 1 },
		]);
	});

	it('returns an empty list when there are no items', () => {
		expect(buildLineItems({})).toEqual([]);
		expect(buildLineItems(undefined)).toEqual([]);
	});

	it('sends the item name only with withItemName', () => {
		const value = { itemValues: [{ product: rl('p'), name: 'Design' }] };
		expect(buildLineItems(value)).toEqual([{ productId: 'p' }]);
		expect(buildLineItems(value, { withItemName: true })).toEqual([
			{ productId: 'p', name: 'Design' },
		]);
	});

	it('sends the tax amount as a string only with withTaxAmount', () => {
		const value = {
			itemValues: [
				{
					product: rl('p'),
					taxes: {
						taxValues: [
							{ salesTax: rl('t1'), amount: 1.5 },
							{ salesTax: rl('t2'), amount: '' },
						],
					},
				},
			],
		};
		expect(buildLineItems(value)).toEqual([
			{ productId: 'p', taxes: [{ salesTaxId: 't1' }, { salesTaxId: 't2' }] },
		]);
		expect(buildLineItems(value, { withTaxAmount: true })).toEqual([
			{ productId: 'p', taxes: [{ salesTaxId: 't1', amount: '1.5' }, { salesTaxId: 't2' }] },
		]);
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

	it('returns an empty list when there are no discounts', () => {
		expect(buildDiscounts({})).toEqual([]);
		expect(buildDiscounts(undefined)).toEqual([]);
	});
});

describe('field builders', () => {
	type Option = { name: string; values: Array<{ name: string; options?: Option[] }> };
	const entry = (field: { options?: unknown }, name: string) =>
		(field.options as Option[]).find((option) => option.name === name);

	it('builds the Items fixed collection with the item name and tax amount options', () => {
		const plain = entry(itemsField({ description: 'x' }), 'itemValues')!;
		expect(plain.values.map((value) => value.name)).toEqual([
			'product',
			'description',
			'quantity',
			'unitPrice',
			'taxes',
		]);

		const full = entry(
			itemsField({ description: 'x', withItemName: true, withTaxAmount: true }),
			'itemValues',
		)!;
		expect(full.values.map((value) => value.name)).toContain('name');
		const taxes = full.values.find((value) => value.name === 'taxes')!.options![0];
		expect(taxes.name).toBe('taxValues');
		expect(taxes.values.map((value) => value.name)).toEqual(['salesTax', 'amount']);
	});

	it('builds the Discounts fixed collection with the entry list discountValues', () => {
		const single = discountsField({ typeEnum: 'InvoiceDiscountType' });
		expect(single.typeOptions).toBeUndefined();
		expect(entry(single, 'discountValues')).toBeDefined();
		const multiple = discountsField({ typeEnum: 'EstimateDiscountType', multiple: true });
		expect(multiple.typeOptions).toEqual({ multipleValues: true });
	});
});
