import { describe, expect, it } from 'vitest';

import {
	buildCreateInput,
	buildDiscounts,
	buildEstimateFields,
	buildItems,
	buildListVariables,
	buildPatchInput,
	type CurrentEstimate,
} from '../../nodes/Wave/resources/estimate/inputs';

const rl = (value: string) => ({ __rl: true, mode: 'list', value });

describe('buildItems', () => {
	it('maps items and removes empty values', () => {
		expect(
			buildItems({
				item: [
					{
						product: rl('P1'),
						description: '',
						quantity: 2,
						unitPrice: '',
						salesTax: rl('T1'),
						extraSalesTaxIds: 'T2, T3',
					},
					{
						product: rl('P2'),
						quantity: 1,
						unitPrice: '9.5',
						salesTax: rl(''),
						extraSalesTaxIds: '',
					},
				],
			}),
		).toEqual([
			{
				productId: 'P1',
				quantity: 2,
				taxes: [{ salesTaxId: 'T1' }, { salesTaxId: 'T2' }, { salesTaxId: 'T3' }],
			},
			{ productId: 'P2', quantity: 1, unitPrice: '9.5' },
		]);
	});

	it('returns undefined without items', () => {
		expect(buildItems({})).toBeUndefined();
		expect(buildItems(undefined)).toBeUndefined();
	});
});

describe('buildDiscounts', () => {
	it('sends the value that fits the type', () => {
		expect(
			buildDiscounts({
				discount: [
					{ discountType: 'FIXED', name: 'Promo', amount: 5, percentage: 10 },
					{ discountType: 'PERCENTAGE', amount: 5, percentage: 10 },
				],
			}),
		).toEqual([
			{ discountType: 'FIXED', name: 'Promo', amount: 5 },
			{ discountType: 'PERCENTAGE', percentage: 10 },
		]);
	});
});

describe('buildEstimateFields', () => {
	it('maps optional fields', () => {
		expect(
			buildEstimateFields({
				title: 'Quote',
				memo: '',
				estimateDate: '2026-03-04T00:00:00',
				depositStatus: 'ENABLED_MANDATORY',
				depositUnit: 'PERCENTAGE',
				depositValue: 25,
				hideUnit: false,
				attachmentIds: 'a1, a2',
				dontCarryOverNotesToInvoice: true,
			}),
		).toEqual({
			title: 'Quote',
			estimateDate: '2026-03-04',
			depositStatus: 'ENABLED_MANDATORY',
			depositUnit: 'PERCENTAGE',
			depositValue: 25,
			hideUnit: false,
			attachmentIds: ['a1', 'a2'],
			dontCarryOverNotesToInvoice: true,
		});
	});
});

describe('buildCreateInput', () => {
	it('combines the business, customer, items and fields', () => {
		const input = buildCreateInput(
			'B1',
			'C1',
			{ item: [{ product: rl('P1'), quantity: 1, unitPrice: '3' }] },
			{ poNumber: 'PO-1' },
		);
		expect(input).toEqual({
			businessId: 'B1',
			customerId: 'C1',
			poNumber: 'PO-1',
			items: [{ productId: 'P1', quantity: 1, unitPrice: '3' }],
		});
	});
});

describe('buildPatchInput', () => {
	const current: CurrentEstimate = {
		id: 'E1',
		status: 'DRAFT',
		title: 'Estimate',
		estimateDate: '2026-01-01',
		dueDate: '2026-01-31',
		exchangeRate: '1',
		currency: { code: 'USD' },
		customer: { id: 'C1' },
		poNumber: 'PO-1',
		memo: null,
		hideUnit: false,
		discounts: [{ __typename: 'PercentageEstimateDiscount', name: 'Promo', percentage: '10' }],
	};

	it('keeps the current values that the user does not change', () => {
		expect(buildPatchInput(current, { memo: 'Hello' })).toEqual({
			poNumber: 'PO-1',
			hideUnit: false,
			discounts: [{ discountType: 'PERCENTAGE', name: 'Promo', percentage: '10' }],
			id: 'E1',
			customerId: 'C1',
			status: 'DRAFT',
			title: 'Estimate',
			estimateDate: '2026-01-01',
			currency: 'USD',
			exchangeRate: '1',
			dueDate: '2026-01-31',
			memo: 'Hello',
		});
	});

	it('lets the user values win', () => {
		const input = buildPatchInput(
			current,
			{ title: 'New', status: 'APPROVED', currency: 'CAD', dueDate: '2026-02-15T00:00:00' },
			'C2',
		);
		expect(input).toMatchObject({
			customerId: 'C2',
			status: 'APPROVED',
			title: 'New',
			currency: 'CAD',
			dueDate: '2026-02-15',
		});
	});
});

describe('buildListVariables', () => {
	it('uses null for filters that are not set', () => {
		expect(buildListVariables({}, undefined)).toEqual({
			status: null,
			customerId: null,
			currency: null,
			estimateDateStart: null,
			estimateDateEnd: null,
			modifiedAtAfter: null,
			modifiedAtBefore: null,
			estimateNumber: null,
			amountDue: null,
		});
	});

	it('maps the filters', () => {
		expect(
			buildListVariables(
				{
					status: 'SENT',
					currency: 'USD',
					estimateDateStart: '2026-01-01T00:00:00',
					modifiedAtAfter: '2026-01-01T00:00:00Z',
					estimateNumber: '12',
					amountDue: 0,
				},
				'C1',
			),
		).toMatchObject({
			status: 'SENT',
			customerId: 'C1',
			currency: 'USD',
			estimateDateStart: '2026-01-01',
			modifiedAtAfter: '2026-01-01T00:00:00.000Z',
			estimateNumber: '12',
			amountDue: 0,
		});
	});
});
