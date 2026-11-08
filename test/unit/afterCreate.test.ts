import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import {
	afterCreateSteps,
	runAfterCreate,
	type AfterCreateStep,
} from '../../nodes/Wave/shared/afterCreate';

const ctx = {
	getNode: () => ({ id: '1', name: 'Wave', type: 'wave', typeVersion: 1, position: [0, 0] }),
} as unknown as IExecuteFunctions;

const created = { id: 'inv-1', status: 'DRAFT' };

function setup(action: string, failAt?: AfterCreateStep) {
	const order: string[] = [];
	const run = vi.fn(async (step: AfterCreateStep) => {
		order.push(step);
		if (step === failAt) throw new Error('Action not authorized');
	});
	const reload = vi.fn(async () => {
		order.push('reload');
		return { id: 'inv-1', status: 'SENT' };
	});
	const call = () =>
		runAfterCreate(ctx, 0, created, { label: 'Invoice', id: 'inv-1', action, run, reload });
	return { order, run, reload, call };
}

describe('afterCreateSteps', () => {
	it('maps each action to its steps', () => {
		expect(afterCreateSteps('draft')).toEqual([]);
		expect(afterCreateSteps('approve')).toEqual(['approve']);
		expect(afterCreateSteps('approveMarkSent')).toEqual(['approve', 'markSent']);
		expect(afterCreateSteps('approveSend')).toEqual(['approve', 'send']);
		expect(afterCreateSteps(undefined)).toEqual([]);
	});
});

describe('runAfterCreate', () => {
	it('returns the created record when the invoice stays a draft', async () => {
		const { order, call } = setup('draft');
		expect(await call()).toBe(created);
		expect(order).toEqual([]);
	});

	it('runs approve and mark sent in order, then reads the record again', async () => {
		const { order, call } = setup('approveMarkSent');
		expect(await call()).toEqual({ id: 'inv-1', status: 'SENT' });
		expect(order).toEqual(['approve', 'markSent', 'reload']);
	});

	it('runs approve and send in order', async () => {
		const { order, call } = setup('approveSend');
		await call();
		expect(order).toEqual(['approve', 'send', 'reload']);
	});

	it('names the created ID and stops when a step fails', async () => {
		const { order, reload, call } = setup('approveSend', 'send');
		await expect(call()).rejects.toThrow(
			/invoice was created \(ID inv-1\).*"Send" failed: Action not authorized/,
		);
		expect(order).toEqual(['approve', 'send']);
		expect(reload).not.toHaveBeenCalled();
	});
});
