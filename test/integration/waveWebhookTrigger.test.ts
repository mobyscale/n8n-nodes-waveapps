import type { IDataObject, IWebhookFunctions } from 'n8n-workflow';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { decodeWaveId } from '../../nodes/Wave/shared/ids';
import { WaveWebhookTrigger } from '../../nodes/WaveWebhookTrigger/WaveWebhookTrigger.node';
import { createExecuteContext, getTestBusinessId, graphql, hasConfig } from './harness';

const SECRET = 'integration-secret';

/** A webhook request as Wave sends it, with a valid signature and raw IDs in the payload. */
function createWebhookContext(payload: IDataObject): {
	context: IWebhookFunctions;
	statuses: number[];
} {
	const { helpers, getNode } = createExecuteContext({});
	const rawBody = JSON.stringify(payload);
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = createHmac('sha256', SECRET).update(`${timestamp}.${rawBody}`).digest('hex');
	const parameters: IDataObject = {
		verifySignature: true,
		events: [],
		addApiIds: true,
		fetchFullRecord: true,
		authentication: 'accessToken',
	};
	const statuses: number[] = [];
	const response = {
		status: (code: number) => {
			statuses.push(code);
			return response;
		},
		json: () => response,
	};
	const context = {
		getNode,
		getNodeParameter: (name: string, fallback?: unknown) =>
			name in parameters ? parameters[name] : fallback,
		getCredentials: async () => ({ secret: SECRET }),
		getRequestObject: () => ({ rawBody: Buffer.from(rawBody, 'utf8') }),
		getResponseObject: () => response,
		getBodyData: () => JSON.parse(rawBody) as IDataObject,
		getHeaderData: () => ({
			'x-wave-signature': `t=${timestamp},v1=${signature}`,
			'x-wave-timestamp': timestamp,
		}),
		logger: { warn: () => undefined },
		helpers,
	} as unknown as IWebhookFunctions;
	return { context, statuses };
}

async function getNewestId(field: 'invoices' | 'estimates'): Promise<string | undefined> {
	const businessId = await getTestBusinessId();
	const data = await graphql<{
		business: Record<string, { edges: Array<{ node: { id: string } }> }>;
	}>(
		`
			query ($businessId: ID!) {
				business(id: $businessId) {
					${field}(page: 1, pageSize: 1) {
						edges {
							node {
								id
							}
						}
					}
				}
			}
		`,
		{ businessId },
	);
	return data.business[field].edges[0]?.node.id;
}

describe.skipIf(!hasConfig)('Wave Webhook Trigger', () => {
	it.each([
		['invoice', 'invoices', 'Invoice', 'invoice.viewed'],
		['estimate', 'estimates', 'Estimate', 'estimate.viewed'],
	] as const)(
		'converts the raw IDs of an %s event and loads the full record',
		async (name, field, type, eventType) => {
			const apiId = await getNewestId(field);
			if (!apiId) return;
			const parts = decodeWaveId(apiId)!;
			const { context, statuses } = createWebhookContext({
				event_type: eventType,
				data: { business_id: parts.Business, [`${name}_id`]: parts[type] },
			});

			const result = await new WaveWebhookTrigger().webhook.call(context);

			expect(statuses).toEqual([200]);
			const json = result.workflowData![0][0].json;
			expect(json.recordError).toBeUndefined();
			expect(json.apiIds).toMatchObject({ [`${name}Id`]: apiId });
			expect(json.record).toMatchObject({ id: apiId, customer: { id: expect.any(String) } });
		},
	);
});
