import { describe, expect, it } from 'vitest';

import { buildInvoiceFields } from '../../nodes/Wave/resources/invoice/builders';

const rl = (value: string) => ({ __rl: true, mode: 'list', value });

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
