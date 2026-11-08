import { describe, expect, it } from 'vitest';

import { buildAccountCreateInput } from '../../nodes/Wave/resources/account';
import { buildProductFields } from '../../nodes/Wave/resources/product';
import { buildRateInput, toDateString } from '../../nodes/Wave/resources/salesTax';

describe('buildAccountCreateInput', () => {
	it('moves canArchive into restrictions and drops empty fields', () => {
		expect(
			buildAccountCreateInput('b1', 'Bank', 'CASH_AND_BANK', {
				canArchive: false,
				description: '',
				currency: 'USD',
			}),
		).toEqual({
			businessId: 'b1',
			name: 'Bank',
			subtype: 'CASH_AND_BANK',
			currency: 'USD',
			restrictions: { canArchive: false },
		});
	});

	it('sends no restrictions when canArchive is not set', () => {
		expect(buildAccountCreateInput('b1', 'Bank', 'EXPENSE', {})).toEqual({
			businessId: 'b1',
			name: 'Bank',
			subtype: 'EXPENSE',
		});
	});
});

describe('buildProductFields', () => {
	const locator = (value: string) => ({ __rl: true, mode: 'id', value });

	it('maps locators and sales taxes to IDs', () => {
		expect(
			buildProductFields({
				description: 'Text',
				incomeAccountId: locator('inc'),
				expenseAccountId: locator(''),
				defaultSalesTaxes: {
					items: [{ salesTaxId: locator('t1') }, { salesTaxId: locator('t2') }],
				},
			}),
		).toEqual({ description: 'Text', incomeAccountId: 'inc', defaultSalesTaxIds: ['t1', 't2'] });
	});

	it('sends an empty list when the sales tax collection is empty', () => {
		expect(buildProductFields({ defaultSalesTaxes: {} })).toEqual({ defaultSalesTaxIds: [] });
	});

	it('leaves the sales taxes out when the field is not set', () => {
		expect(buildProductFields({ name: 'A' })).toEqual({ name: 'A' });
	});
});

describe('sales tax rates', () => {
	it('builds a rate with the given effective date', () => {
		expect(buildRateInput('2025-01-01T00:00:00.000Z', 0.07)).toEqual([
			{ effective: '2025-01-01', rate: '0.07' },
		]);
	});

	it('uses today when there is no effective date', () => {
		expect(buildRateInput('', '0.06', new Date('2026-01-02T00:00:00Z'))).toEqual([
			{ effective: '2026-01-02', rate: '0.06' },
		]);
	});

	it('formats dates', () => {
		expect(toDateString('2025-03-04T10:00:00.000Z')).toBe('2025-03-04');
		expect(toDateString('', new Date('2026-01-02T00:00:00Z'))).toBe('2026-01-02');
	});
});
