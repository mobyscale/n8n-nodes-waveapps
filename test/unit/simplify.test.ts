import type { IDataObject } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { simplifyRecord } from '../../nodes/Wave/shared/simplify';

const cad = { code: 'CAD', symbol: '$', name: 'Canadian Dollar' };
const money = (value: string, currency = cad) => ({
	value,
	minorUnitValue: String(Math.round(Number(value) * 100)),
	currency,
});

const address = {
	addressLine1: '1 Main St',
	addressLine2: null,
	city: 'Toronto',
	province: { code: 'CA-ON', name: 'Ontario' },
	country: { code: 'CA', name: 'Canada' },
	postalCode: 'M5V 1A1',
};

const invoice: IDataObject = {
	__typename: 'Invoice',
	id: 'SW52b2ljZTox',
	invoiceNumber: '0012',
	status: 'SAVED',
	title: 'Invoice',
	poNumber: '00123',
	invoiceDate: '2026-11-01',
	createdAt: '2026-11-01T10:00:00.000Z',
	pdfUrl: 'https://example.com/invoice.pdf',
	customer: { id: 'Q3VzdG9tZXI6MQ', name: 'Acme Inc', email: 'ap@acme.test' },
	currency: cad,
	exchangeRate: '1.00000000',
	subtotal: money('100.00'),
	taxTotal: money('5.00'),
	total: money('105.00'),
	amountDue: money('105.00'),
	discounts: [{ __typename: 'PercentageInvoiceDiscount', name: 'Early', percentage: '10' }],
	items: [
		{
			id: 'item-1',
			description: 'Work',
			quantity: '2',
			unitPrice: '50.00',
			product: { id: 'UHJvZHVjdDox', name: 'Consulting' },
			account: { id: 'QWNjb3VudDox', name: 'Sales' },
			subtotal: money('100.00'),
			total: money('105.00'),
			taxes: [
				{
					salesTax: { id: 'U2FsZXNUYXg6MQ', name: 'GST', abbreviation: 'GST', rate: '0.05' },
					amount: money('5.00'),
				},
			],
		},
	],
	business: { id: 'QnVzaW5lc3M6MQ', name: 'My Business' },
};

describe('simplifyRecord for an invoice', () => {
	const result = simplifyRecord(invoice);

	it('turns Money into numbers and keeps the currency', () => {
		expect(result).toMatchObject({
			subtotal: 100,
			taxTotal: 5,
			total: 105,
			amountDue: 105,
			currency: 'CAD',
		});
	});

	it('replaces nested records with an ID and a name', () => {
		expect(result).toMatchObject({
			customerId: 'Q3VzdG9tZXI6MQ',
			customerName: 'Acme Inc',
			customerEmail: 'ap@acme.test',
		});
		expect(result).not.toHaveProperty('customer');
	});

	it('simplifies the items and their taxes at any depth', () => {
		expect(result.items).toEqual([
			{
				id: 'item-1',
				description: 'Work',
				quantity: 2,
				unitPrice: 50,
				productId: 'UHJvZHVjdDox',
				productName: 'Consulting',
				accountId: 'QWNjb3VudDox',
				accountName: 'Sales',
				subtotal: 100,
				total: 105,
				currency: 'CAD',
				taxes: [
					{
						salesTaxId: 'U2FsZXNUYXg6MQ',
						salesTaxName: 'GST',
						salesTaxAbbreviation: 'GST',
						salesTaxRate: 0.05,
						amount: 5,
						currency: 'CAD',
					},
				],
			},
		]);
	});

	it('removes the business, the type name and the minor unit values', () => {
		const text = JSON.stringify(result);
		expect(result).not.toHaveProperty('business');
		expect(result).not.toHaveProperty('__typename');
		expect(text).not.toContain('minorUnitValue');
		expect(text).not.toContain('__typename');
	});

	it('keeps strings that only look like numbers, dates and enums', () => {
		expect(result).toMatchObject({
			id: 'SW52b2ljZTox',
			invoiceNumber: '0012',
			poNumber: '00123',
			status: 'SAVED',
			invoiceDate: '2026-11-01',
			createdAt: '2026-11-01T10:00:00.000Z',
			pdfUrl: 'https://example.com/invoice.pdf',
		});
	});

	it('turns Decimal fields into numbers', () => {
		expect(result.exchangeRate).toBe(1);
		expect(result.discounts).toEqual([{ name: 'Early', percentage: 10 }]);
	});

	it('does not change the input', () => {
		expect(invoice.total).toEqual(money('105.00'));
		expect(invoice).toHaveProperty('business');
	});
});

describe('simplifyRecord for a customer', () => {
	const customer: IDataObject = {
		id: 'Q3VzdG9tZXI6MQ',
		name: 'Acme Inc',
		displayId: '0042',
		phone: '5551230002',
		address,
		currency: cad,
		shippingDetails: {
			name: 'Warehouse',
			phone: '5551230004',
			instructions: null,
			address: { ...address, addressLine1: '2 Dock Rd' },
		},
		outstandingAmount: money('20.50'),
		overdueAmount: money('0.00'),
		isArchived: false,
	};
	const result = simplifyRecord(customer);

	it('keeps the address as an object with simple values and adds one line of text', () => {
		expect(result.address).toEqual({
			addressLine1: '1 Main St',
			addressLine2: null,
			city: 'Toronto',
			province: 'CA-ON',
			country: 'CA',
			postalCode: 'M5V 1A1',
		});
		expect(result.addressText).toBe('1 Main St, Toronto, CA-ON, M5V 1A1, CA');
	});

	it('turns the currency into its code', () => {
		expect(result.currency).toBe('CAD');
	});

	it('does not turn IDs, display IDs or phone numbers into numbers', () => {
		expect(result).toMatchObject({ displayId: '0042', phone: '5551230002' });
	});

	it('turns Money into numbers and does not add a second currency field', () => {
		expect(result).toMatchObject({ outstandingAmount: 20.5, overdueAmount: 0, currency: 'CAD' });
	});

	it('flattens the shipping details', () => {
		expect(result).toMatchObject({
			shippingName: 'Warehouse',
			shippingPhone: '5551230004',
			shippingInstructions: null,
			shippingAddressText: '2 Dock Rd, Toronto, CA-ON, M5V 1A1, CA',
		});
		expect(result).not.toHaveProperty('shippingDetails');
	});
});

describe('simplifyRecord for an account and a sales tax', () => {
	it('flattens an account', () => {
		const result = simplifyRecord({
			id: 'QWNjb3VudDox',
			name: 'Checking',
			displayId: '1000',
			currency: cad,
			type: { name: 'Assets', value: 'ASSET', normalBalanceType: 'DEBIT' },
			subtype: {
				name: 'Cash and Bank',
				value: 'CASH_AND_BANK',
				type: { name: 'Assets', value: 'ASSET' },
				description: 'Bank accounts',
			},
			normalBalanceType: 'DEBIT',
			sequence: 3,
			balance: '1234.50',
			balanceInBusinessCurrency: '1234.50',
		});
		expect(result).toEqual({
			id: 'QWNjb3VudDox',
			name: 'Checking',
			displayId: '1000',
			currency: 'CAD',
			type: 'ASSET',
			subtype: 'CASH_AND_BANK',
			normalBalanceType: 'DEBIT',
			sequence: 3,
			balance: 1234.5,
			balanceInBusinessCurrency: 1234.5,
		});
	});

	it('keeps a null balance', () => {
		expect(simplifyRecord({ id: 'a', balance: null })).toEqual({ id: 'a', balance: null });
	});

	it('simplifies a sales tax', () => {
		const result = simplifyRecord({
			id: 'U2FsZXNUYXg6MQ',
			name: 'GST',
			abbreviation: 'GST',
			taxNumber: '123456789',
			rate: '0.05',
			rates: [{ effective: '2026-01-01', rate: '0.05' }],
			isCompound: false,
		});
		expect(result).toEqual({
			id: 'U2FsZXNUYXg6MQ',
			name: 'GST',
			abbreviation: 'GST',
			taxNumber: '123456789',
			rate: 0.05,
			rates: [{ effective: '2026-01-01', rate: 0.05 }],
			isCompound: false,
		});
	});
});

describe('simplifyRecord for a payment', () => {
	it('adds the currency of a Money value when the record has none', () => {
		const result = simplifyRecord({ id: 'p', paid: money('7.25', { ...cad, code: 'USD' }) });
		expect(result).toEqual({ id: 'p', paid: 7.25, currency: 'USD' });
	});

	it('keeps the invoice number of a referenced invoice', () => {
		const result = simplifyRecord({
			id: 'p',
			amount: '10.00',
			exchangeRate: '1',
			account: { id: 'a', name: 'Bank' },
			invoice: { id: 'i', invoiceNumber: '0012' },
			paymentCurrency: cad,
		});
		expect(result).toEqual({
			id: 'p',
			amount: 10,
			exchangeRate: 1,
			accountId: 'a',
			accountName: 'Bank',
			invoiceId: 'i',
			invoiceNumber: '0012',
			paymentCurrency: 'CAD',
		});
	});
});
