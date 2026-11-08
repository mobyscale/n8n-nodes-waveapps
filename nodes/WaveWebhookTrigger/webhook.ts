import type { IDataObject, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';

import { waveRequest } from '../Wave/transport';
import { ESTIMATE_FIELDS, INVOICE_FIELDS } from '../WaveTrigger/selections';
import { findIds, getEventType, isEventSelected, toApiIds } from './payload';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyWaveSignature } from './signature';

export const WEBHOOK_CREDENTIAL_TYPE = 'waveWebhookApi';

function getHeader(headers: IDataObject, name: string): string | undefined {
	const value = headers[name] ?? headers[name.toLowerCase()];
	if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
	return typeof value === 'string' ? value : undefined;
}

/** The signature covers the body exactly as Wave sent it, so the raw body is used when n8n has it. */
export function getRawBody(request: unknown, body: unknown): Buffer {
	const rawBody = (request as { rawBody?: unknown } | undefined)?.rawBody;
	if (Buffer.isBuffer(rawBody)) return rawBody;
	if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8');
	if (typeof body === 'string') return Buffer.from(body, 'utf8');
	return Buffer.from(JSON.stringify(body ?? {}), 'utf8');
}

const RECORD_QUERIES = {
	invoice: `query($businessId: ID!, $id: ID!) {
		business(id: $businessId) { invoice(id: $id) { ${INVOICE_FIELDS} } }
	}`,
	estimate: `query($businessId: ID!, $id: ID!) {
		business(id: $businessId) { estimate(id: $id) { ${ESTIMATE_FIELDS} } }
	}`,
};

/** Loads the invoice or the estimate of the event. Other events have no record to load. */
export async function fetchRecord(
	ctx: IWebhookFunctions,
	eventType: string | undefined,
	apiIds: IDataObject,
): Promise<IDataObject | undefined> {
	const businessId = apiIds.businessId as string | undefined;
	if (!businessId) return undefined;
	const prefix = eventType?.split('.')[0];
	const kind =
		prefix === 'invoice' || prefix === 'estimate'
			? prefix
			: apiIds.invoiceId
				? 'invoice'
				: apiIds.estimateId
					? 'estimate'
					: undefined;
	const id = kind ? (apiIds[`${kind}Id`] as string | undefined) : undefined;
	if (!kind || !id) return undefined;
	const data = await waveRequest<{ business: IDataObject | null }>(ctx, RECORD_QUERIES[kind], {
		businessId,
		id,
	});
	return (data.business?.[kind] as IDataObject | null) ?? undefined;
}

/**
 * Wave retries 5xx responses and timeouts, does not retry 4xx responses, and suspends the
 * subscription after 10 failures in a row. So the node replies 200 to every valid event,
 * also to events that it ignores, and 401 only when the signature is not valid.
 */
export async function handleWebhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
	const res = this.getResponseObject();
	const body = this.getBodyData() as IDataObject;

	if (this.getNodeParameter('verifySignature', true) as boolean) {
		const credentials = await this.getCredentials<{ secret?: string }>(WEBHOOK_CREDENTIAL_TYPE);
		const headers = this.getHeaderData() as IDataObject;
		const result = verifyWaveSignature({
			rawBody: getRawBody(this.getRequestObject(), body),
			signatureHeader: getHeader(headers, SIGNATURE_HEADER),
			timestampHeader: getHeader(headers, TIMESTAMP_HEADER),
			secret: credentials.secret ?? '',
		});
		if (!result.valid) {
			this.logger.warn(`Wave webhook rejected: ${result.reason}`);
			res.status(401).json({ message: 'Invalid signature' });
			return { noWebhookResponse: true };
		}
	}

	const eventType = getEventType(body);
	const selectedEvents = this.getNodeParameter('events', []) as string[];
	if (!isEventSelected(eventType, selectedEvents)) {
		res.status(200).json({ received: true });
		return { noWebhookResponse: true };
	}

	const addApiIds = this.getNodeParameter('addApiIds', true) as boolean;
	const fetchFullRecord = this.getNodeParameter('fetchFullRecord', false) as boolean;
	const apiIds = toApiIds(findIds(body));
	const output: IDataObject = { ...body };
	if (addApiIds) output.apiIds = apiIds;

	// Reply before the API request, so that a slow or failed request does not make Wave retry.
	res.status(200).json({ received: true });

	if (fetchFullRecord) {
		try {
			const record = await fetchRecord(this, eventType, apiIds);
			if (record) output.record = record;
		} catch (error) {
			output.recordError = (error as Error).message;
		}
	}

	return { noWebhookResponse: true, workflowData: [[{ json: output }]] };
}
