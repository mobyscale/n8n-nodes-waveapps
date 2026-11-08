import type { IDataObject, IPollFunctions } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';
import { afterAll, describe, expect, it } from 'vitest';

import type { TriggerEvent, TriggerState } from '../../nodes/WaveTrigger/poll';
import { WaveTrigger } from '../../nodes/WaveTrigger/WaveTrigger.node';
import {
	Cleanup,
	createExecuteContext,
	getTestBusinessId,
	graphql,
	hasConfig,
	rl,
	uniqueName,
} from './harness';

interface MutationOutput {
	didSucceed: boolean;
	inputErrors?: Array<{ message: string }> | null;
}

function createPollContext(
	parameters: IDataObject,
	state: TriggerState,
	mode: 'manual' | 'trigger' = 'trigger',
): IPollFunctions {
	const { helpers, getNode } = createExecuteContext({});
	const all: IDataObject = { authentication: 'accessToken', filters: {}, ...parameters };
	return {
		getNode,
		getMode: () => mode,
		getWorkflowStaticData: () => state,
		getNodeParameter: (name: string, fallback?: unknown, options?: { extractValue?: boolean }) => {
			const value = name in all ? all[name] : fallback;
			if (options?.extractValue && value && typeof value === 'object' && '__rl' in value) {
				return (value as { value: unknown }).value;
			}
			return value;
		},
		helpers: {
			...helpers,
			returnJsonArray: (items: IDataObject[]) => items.map((json) => ({ json })),
		},
	} as unknown as IPollFunctions;
}

/** Polls until the record appears, because Wave can need a moment to list a change. */
async function pollFor(
	parameters: IDataObject,
	state: TriggerState,
	id: string,
	attempts = 6,
): Promise<IDataObject | undefined> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		const output = await new WaveTrigger().poll.call(createPollContext(parameters, state));
		const found = output?.[0].map((item) => item.json).find((json) => json.id === id);
		if (found) return found;
		await sleep(3000);
	}
	return undefined;
}

describe.skipIf(!hasConfig)('Wave Trigger', () => {
	const cleanup = new Cleanup();
	afterAll(async () => await cleanup.run());

	it('returns a created customer, then its update', async () => {
		const businessId = await getTestBusinessId();
		const parameters = (event: TriggerEvent): IDataObject => ({
			businessId: rl(businessId, 'list'),
			resource: 'customer',
			event,
		});
		const state: TriggerState = {};

		expect(await new WaveTrigger().poll.call(createPollContext(parameters('created'), state))).toBe(
			null,
		);
		expect(state.lastPollAt).toEqual(expect.any(String));

		const name = uniqueName('trigger customer');
		const created = await graphql<{
			customerCreate: MutationOutput & { customer: { id: string } };
		}>(
			`
				mutation ($input: CustomerCreateInput!) {
					customerCreate(input: $input) {
						didSucceed
						inputErrors {
							message
						}
						customer {
							id
						}
					}
				}
			`,
			{ input: { businessId, name, email: 'n8n-test@example.com' } },
		);
		expect(created.customerCreate.didSucceed).toBe(true);
		const customerId = created.customerCreate.customer.id;
		cleanup.add('delete customer', async () => {
			const deleted = await graphql<{ customerDelete: MutationOutput }>(
				`
					mutation ($input: CustomerDeleteInput!) {
						customerDelete(input: $input) {
							didSucceed
							inputErrors {
								message
							}
						}
					}
				`,
				{ input: { id: customerId } },
			);
			if (!deleted.customerDelete.didSucceed) throw new Error('Wave did not delete the customer');
		});

		const createdRecord = await pollFor(parameters('created'), state, customerId);
		expect(createdRecord).toMatchObject({ id: customerId, name, email: 'n8n-test@example.com' });
		expect(createdRecord?.outstandingAmount).toMatchObject({ currency: expect.any(Object) });

		// The same change is not returned again.
		const again = await new WaveTrigger().poll.call(
			createPollContext(parameters('createdOrUpdated'), state),
		);
		expect(again?.[0].some((item) => item.json.id === customerId) ?? false).toBe(false);

		// Wave keeps whole seconds in the modifiedAt of customers. Wait so that the update has a new value.
		await sleep(1500);
		const newName = `${name} updated`;
		const patched = await graphql<{ customerPatch: MutationOutput }>(
			`
				mutation ($input: CustomerPatchInput!) {
					customerPatch(input: $input) {
						didSucceed
						inputErrors {
							message
						}
					}
				}
			`,
			{ input: { id: customerId, name: newName } },
		);
		expect(patched.customerPatch.didSucceed).toBe(true);

		const updatedRecord = await pollFor(parameters('updated'), state, customerId);
		expect(updatedRecord).toMatchObject({ id: customerId, name: newName });

		const manual = await new WaveTrigger().poll.call(
			createPollContext(parameters('updated'), {}, 'manual'),
		);
		expect(manual?.[0]).toHaveLength(1);
		expect(manual?.[0][0].json.id).toBe(customerId);
	});

	it.each(['customer', 'estimate', 'invoice', 'product', 'salesTax', 'vendor'])(
		'reads the newest %s with the full selection in manual mode',
		async (resource) => {
			const businessId = await getTestBusinessId();
			const output = await new WaveTrigger().poll.call(
				createPollContext(
					{ businessId: rl(businessId, 'list'), resource, event: 'createdOrUpdated' },
					{},
					'manual',
				),
			);
			if (output) {
				expect(output[0]).toHaveLength(1);
				expect(output[0][0].json).toMatchObject({
					id: expect.any(String),
					createdAt: expect.any(String),
					modifiedAt: expect.any(String),
				});
			}
		},
	);
});
