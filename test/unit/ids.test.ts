import { describe, expect, it } from 'vitest';

import { decodeWaveId, getBusinessUuid, toBusinessId, toWaveId } from '../../nodes/Wave/shared/ids';

// Examples from the Wave webhooks setup guide.
const BUSINESS_ID = 'QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZA==';
const UUID = '3be6dae8-c292-4963-8f70-8440f8bb68f3';

describe('Wave IDs', () => {
	it('decodes an API ID into its parts', () => {
		expect(decodeWaveId(BUSINESS_ID)).toEqual({ Business: 'test-business-id' });
		expect(
			decodeWaveId('QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZDtJbnZvaWNlOnRlc3QtaW52b2ljZS1pZA=='),
		).toEqual({ Business: 'test-business-id', Invoice: 'test-invoice-id' });
		expect(decodeWaveId('not base64 at all')).toBeUndefined();
	});

	it('converts a raw business UUID and keeps an API ID', () => {
		expect(toBusinessId(UUID)).toBe(Buffer.from(`Business:${UUID}`).toString('base64'));
		expect(toBusinessId(BUSINESS_ID)).toBe(BUSINESS_ID);
		expect(getBusinessUuid(toBusinessId(UUID))).toBe(UUID);
	});

	it('builds documented resource IDs from raw webhook IDs', () => {
		expect(toWaveId('Invoice', 'test-invoice-id', BUSINESS_ID)).toBe(
			'QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZDtJbnZvaWNlOnRlc3QtaW52b2ljZS1pZA==',
		);
		expect(toWaveId('Estimate', 'test-estimate-id', BUSINESS_ID)).toBe(
			'QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZDtFc3RpbWF0ZTp0ZXN0LWVzdGltYXRlLWlk',
		);
		expect(toWaveId('Checkout', 'test-checkout-id', BUSINESS_ID)).toBe(
			'QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZDtDaGVja291dDp0ZXN0LWNoZWNrb3V0LWlk',
		);
	});

	it('keeps an API ID and leaves a raw ID alone without a business', () => {
		const invoiceId = 'QnVzaW5lc3M6dGVzdC1idXNpbmVzcy1pZDtJbnZvaWNlOnRlc3QtaW52b2ljZS1pZA==';
		expect(toWaveId('Invoice', invoiceId, BUSINESS_ID)).toBe(invoiceId);
		expect(toWaveId('Invoice', 'raw-id')).toBe('raw-id');
	});
});
