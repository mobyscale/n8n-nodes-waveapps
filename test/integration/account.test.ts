import { afterAll, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, hasConfig, rl, runNode, uniqueName } from './harness';

describe.skipIf(!hasConfig)('account', () => {
	const cleanup = new Cleanup();
	afterAll(async () => await cleanup.run());

	async function createAccount() {
		const businessId = await getTestBusinessId();
		const name = uniqueName('account');
		const [account] = await runNode({
			resource: 'account',
			operation: 'create',
			businessId: rl(businessId),
			name,
			subtype: 'EXPENSE',
			additionalFields: { description: 'Created by a test' },
		});
		cleanup.add(`archive ${name}`, async () => {
			// Wave fails when an archived account is archived again
			const [current] = await runNode({
				resource: 'account',
				operation: 'get',
				businessId: rl(businessId),
				accountId: rl(account.id as string),
			});
			if (current.isArchived) return;
			await runNode({
				resource: 'account',
				operation: 'archive',
				businessId: rl(businessId),
				accountId: rl(account.id as string),
			});
		});
		return { businessId, name, account };
	}

	it('creates, gets, updates and archives an account', async () => {
		const { businessId, name, account } = await createAccount();
		expect(account).toMatchObject({
			name,
			description: 'Created by a test',
			isArchived: false,
			type: { value: 'EXPENSE' },
			subtype: { value: 'EXPENSE' },
		});

		const [fetched] = await runNode({
			resource: 'account',
			operation: 'get',
			businessId: rl(businessId),
			accountId: rl(account.id as string),
		});
		expect(fetched.id).toBe(account.id);

		const [updated] = await runNode({
			resource: 'account',
			operation: 'update',
			businessId: rl(businessId),
			accountId: rl(account.id as string),
			updateFields: { description: 'Changed by a test', displayId: '99901' },
		});
		expect(updated).toMatchObject({ name, description: 'Changed by a test', displayId: '99901' });
		expect(updated.sequence).toBeGreaterThan(account.sequence as number);

		const [archived] = await runNode({
			resource: 'account',
			operation: 'archive',
			businessId: rl(businessId),
			accountId: rl(account.id as string),
		});
		expect(archived).toEqual({ success: true, id: account.id });

		const [afterArchive] = await runNode({
			resource: 'account',
			operation: 'get',
			businessId: rl(businessId),
			accountId: rl(account.id as string),
		});
		expect(afterArchive.isArchived).toBe(true);
	});

	it('gets many accounts with filters', async () => {
		const { businessId, account } = await createAccount();
		const expense = await runNode({
			resource: 'account',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { types: ['EXPENSE'], excludedSubtypes: ['COST_OF_GOODS_SOLD'] },
		});
		expect(expense.map((entry) => entry.id)).toContain(account.id);
		expect(expense.every((entry) => (entry.type as { value: string }).value === 'EXPENSE')).toBe(
			true,
		);

		const limited = await runNode({
			resource: 'account',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: false,
			limit: 2,
			filters: { subtypes: ['EXPENSE'] },
		});
		expect(limited).toHaveLength(2);

		const archivedList = await runNode({
			resource: 'account',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			filters: { isArchived: true },
		});
		expect(archivedList.every((entry) => entry.isArchived === true)).toBe(true);
	});
});
