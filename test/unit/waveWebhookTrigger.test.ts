import type { IDataObject, IWebhookFunctions } from 'n8n-workflow';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import { decodeWaveId } from '../../nodes/Wave/shared/ids';
import {
	findIds,
	getEventType,
	isEventSelected,
	normalizeEventType,
	toApiIds,
	WAVE_EVENTS,
} from '../../nodes/WaveWebhookTrigger/payload';
import {
	parseSignatureHeader,
	verifyWaveSignature,
} from '../../nodes/WaveWebhookTrigger/signature';
import {
	testWebhookSecret,
	WaveWebhookTrigger,
} from '../../nodes/WaveWebhookTrigger/WaveWebhookTrigger.node';
import { getRawBody } from '../../nodes/WaveWebhookTrigger/webhook';

const SECRET = 'whsec_test_secret';
const BUSINESS_UUID = '3be6dae8-c292-4963-8f70-8440f8bb68f3';
const INVOICE_UUID = '9f1c2d3e-4b5a-6978-8a9b-0c1d2e3f4a5b';
const CUSTOMER_UUID = '11111111-2222-3333-4444-555555555555';
const NOW_SECONDS = 1_767_225_600;

const sign = (body: string, timestamp: number | string = NOW_SECONDS, secret = SECRET) =>
	createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex');
const header = (body: string, timestamp: number | string = NOW_SECONDS, secret = SECRET) =>
	`t=${timestamp},v1=${sign(body, timestamp, secret)}`;
const b64 = (value: string) => Buffer.from(value, 'utf8').toString('base64');

const BODY = JSON.stringify({
	event_type: 'invoice.paid',
	data: { business_id: BUSINESS_UUID, invoice_id: INVOICE_UUID, customer_id: CUSTOMER_UUID },
});

describe('verifyWaveSignature', () => {
	const verify = (overrides: Partial<Parameters<typeof verifyWaveSignature>[0]> = {}) =>
		verifyWaveSignature({
			rawBody: Buffer.from(BODY, 'utf8'),
			signatureHeader: header(BODY),
			timestampHeader: String(NOW_SECONDS),
			secret: SECRET,
			nowMs: NOW_SECONDS * 1000 + 5000,
			...overrides,
		});

	it('accepts a valid signature', () => {
		expect(verify()).toEqual({ valid: true });
		expect(verify({ rawBody: BODY })).toEqual({ valid: true });
	});

	it('rejects a signature made with another secret', () => {
		expect(verify({ signatureHeader: header(BODY, NOW_SECONDS, 'other') })).toMatchObject({
			valid: false,
			reason: 'The signature does not match',
		});
	});

	it('rejects a changed body', () => {
		expect(verify({ rawBody: BODY.replace('invoice.paid', 'invoice.sent') }).valid).toBe(false);
		expect(verify({ rawBody: `${BODY} ` }).valid).toBe(false);
	});

	it('rejects an old or future timestamp', () => {
		const old = NOW_SECONDS - 301;
		expect(verify({ signatureHeader: header(BODY, old), nowMs: NOW_SECONDS * 1000 })).toMatchObject(
			{ valid: false, reason: 'The timestamp is too old or in the future' },
		);
		const future = NOW_SECONDS + 301;
		expect(verify({ signatureHeader: header(BODY, future), nowMs: NOW_SECONDS * 1000 }).valid).toBe(
			false,
		);
		expect(
			verify({ signatureHeader: header(BODY, NOW_SECONDS - 299), nowMs: NOW_SECONDS * 1000 }).valid,
		).toBe(true);
	});

	it('rejects a missing or malformed header', () => {
		expect(verify({ signatureHeader: undefined }).valid).toBe(false);
		expect(verify({ signatureHeader: sign(BODY) }).valid).toBe(false);
		expect(verify({ signatureHeader: `t=${NOW_SECONDS},v1=zz` }).valid).toBe(false);
		expect(verify({ signatureHeader: `t=abc,v1=${sign(BODY, 'abc')}` }).valid).toBe(false);
		expect(verify({ secret: '' }).valid).toBe(false);
	});

	it('uses x-wave-timestamp when the signature header has no timestamp', () => {
		expect(verify({ signatureHeader: `v1=${sign(BODY)}` })).toEqual({ valid: true });
		expect(verify({ signatureHeader: `v1=${sign(BODY)}`, timestampHeader: undefined }).valid).toBe(
			false,
		);
	});

	it('parses more than one signature and upper case hex', () => {
		const parsed = parseSignatureHeader(` t=1 , v1=ABC, v1=def, v0=x`);
		expect(parsed).toEqual({ timestamp: '1', signatures: ['abc', 'def'] });
		expect(
			verify({ signatureHeader: `t=${NOW_SECONDS},v1=00,v1=${sign(BODY).toUpperCase()}` }).valid,
		).toBe(true);
	});
});

describe('event type', () => {
	it('finds the event in top-level fields and in an event object', () => {
		expect(getEventType({ event_type: 'invoice.paid' })).toBe('invoice.paid');
		expect(getEventType({ type: 'ESTIMATE_PARTIALLY_PAID' })).toBe('estimate.partially_paid');
		expect(getEventType({ event: 'checkoutPaid' })).toBe('checkout.paid');
		expect(getEventType({ event: { type: 'invoice.sent' } })).toBe('invoice.sent');
		expect(getEventType({ event_type: 'invoice.refunded' })).toBe('invoice.refunded');
		expect(getEventType({ data: {} })).toBeUndefined();
	});

	it('knows all events of the setup guide', () => {
		expect(WAVE_EVENTS).toHaveLength(17);
		for (const event of WAVE_EVENTS) expect(normalizeEventType(event.value)).toBe(event.value);
	});

	it('filters events', () => {
		expect(isEventSelected('invoice.paid', [])).toBe(true);
		expect(isEventSelected(undefined, [])).toBe(true);
		expect(isEventSelected('invoice.paid', ['invoice.paid', 'invoice.sent'])).toBe(true);
		expect(isEventSelected('invoice.viewed', ['invoice.paid'])).toBe(false);
		expect(isEventSelected(undefined, ['invoice.paid'])).toBe(false);
	});
});

describe('IDs', () => {
	it('finds snake case, camel case and nested IDs at any depth', () => {
		expect(
			findIds({
				event_type: 'invoice.paid',
				id: 'event-id',
				data: {
					object: { businessId: BUSINESS_UUID, invoice: { id: INVOICE_UUID } },
					customer: { id: CUSTOMER_UUID },
				},
			}),
		).toEqual({ business: BUSINESS_UUID, invoice: INVOICE_UUID, customer: CUSTOMER_UUID });
		expect(findIds({ items: [{ checkout_id: 'c1', business_id: BUSINESS_UUID }] })).toEqual({
			checkout: 'c1',
			business: BUSINESS_UUID,
		});
	});

	it('prefers the ID closest to the top', () => {
		expect(findIds({ invoice_id: 'top', data: { invoice_id: 'deep' } })).toEqual({
			invoice: 'top',
		});
	});

	it('builds the Wave API IDs', () => {
		const apiIds = toApiIds({
			business: BUSINESS_UUID,
			invoice: INVOICE_UUID,
			customer: CUSTOMER_UUID,
			estimate: 'e1',
			checkout: 'c1',
		});
		expect(apiIds).toEqual({
			businessId: b64(`Business:${BUSINESS_UUID}`),
			invoiceId: b64(`Business:${BUSINESS_UUID};Invoice:${INVOICE_UUID}`),
			customerId: b64(`Business:${BUSINESS_UUID};Customer:${CUSTOMER_UUID}`),
			estimateId: b64(`Business:${BUSINESS_UUID};Estimate:e1`),
			checkoutId: b64(`Business:${BUSINESS_UUID};Checkout:c1`),
		});
		expect(decodeWaveId(apiIds.invoiceId as string)).toEqual({
			Business: BUSINESS_UUID,
			Invoice: INVOICE_UUID,
		});
	});

	it('keeps API IDs and raw IDs without a business', () => {
		const invoiceId = b64(`Business:${BUSINESS_UUID};Invoice:${INVOICE_UUID}`);
		expect(toApiIds({ invoice: invoiceId })).toEqual({ invoiceId });
		expect(toApiIds({ invoice: INVOICE_UUID })).toEqual({ invoiceId: INVOICE_UUID });
	});
});

describe('testWebhookSecret', () => {
	const credential = (secret?: string) => ({
		id: '1',
		name: 'x',
		type: 'waveWebhookApi',
		data: { secret },
	});

	it('fails when the secret is empty', () => {
		expect(testWebhookSecret(credential('')).status).toBe('Error');
		expect(testWebhookSecret(credential()).status).toBe('Error');
		expect(testWebhookSecret(credential('secret')).status).toBe('OK');
	});
});

describe('getRawBody', () => {
	it('prefers the raw body of the request', () => {
		expect(getRawBody({ rawBody: Buffer.from('raw') }, { a: 1 }).toString()).toBe('raw');
		expect(getRawBody({}, '{"a":1}').toString()).toBe('{"a":1}');
		expect(getRawBody({}, { a: 1 }).toString()).toBe('{"a":1}');
	});
});

interface WebhookContextOptions {
	parameters?: IDataObject;
	body?: string;
	headers?: IDataObject;
	secret?: string;
	apiResponse?: unknown;
}

function createWebhookContext(options: WebhookContextOptions = {}) {
	const rawBody = options.body ?? BODY;
	const parameters: IDataObject = {
		verifySignature: true,
		events: [],
		addApiIds: true,
		fetchFullRecord: false,
		authentication: 'oAuth2',
		...options.parameters,
	};
	const response = { status: vi.fn(), json: vi.fn() };
	response.status.mockReturnValue(response);
	const request = vi.fn();
	if (options.apiResponse instanceof Error) request.mockRejectedValue(options.apiResponse);
	else request.mockResolvedValue(options.apiResponse);
	const getCredentials = vi.fn(async () => ({ secret: options.secret ?? SECRET }));
	const context = {
		getNode: () => ({ id: '1', name: 'Wave Webhook Trigger', type: 'x', typeVersion: 1 }),
		getNodeParameter: (name: string, fallback?: unknown) =>
			name in parameters ? parameters[name] : fallback,
		getCredentials,
		getRequestObject: () => ({ rawBody: Buffer.from(rawBody, 'utf8') }),
		getResponseObject: () => response,
		getBodyData: () => JSON.parse(rawBody) as IDataObject,
		getHeaderData: () => ({
			'x-wave-signature': header(rawBody, Math.floor(Date.now() / 1000)),
			'x-wave-timestamp': String(Math.floor(Date.now() / 1000)),
			...options.headers,
		}),
		logger: { warn: vi.fn() },
		helpers: { httpRequestWithAuthentication: request },
	} as unknown as IWebhookFunctions;
	return { context, response, request, getCredentials };
}

describe('WaveWebhookTrigger.webhook', () => {
	const run = (context: IWebhookFunctions) => new WaveWebhookTrigger().webhook.call(context);

	it('starts the workflow with the payload and the API IDs', async () => {
		const { context, response, request } = createWebhookContext();
		const result = await run(context);
		expect(response.status).toHaveBeenCalledWith(200);
		expect(result.noWebhookResponse).toBe(true);
		const [[item]] = result.workflowData!;
		expect(item.json).toMatchObject({
			event_type: 'invoice.paid',
			data: { invoice_id: INVOICE_UUID },
			apiIds: {
				businessId: b64(`Business:${BUSINESS_UUID}`),
				invoiceId: b64(`Business:${BUSINESS_UUID};Invoice:${INVOICE_UUID}`),
				customerId: b64(`Business:${BUSINESS_UUID};Customer:${CUSTOMER_UUID}`),
			},
		});
		expect(item.json.record).toBeUndefined();
		expect(request).not.toHaveBeenCalled();
	});

	it('replies 401 to a bad signature and does not start the workflow', async () => {
		const { context, response } = createWebhookContext({ secret: 'wrong' });
		const result = await run(context);
		expect(response.status).toHaveBeenCalledWith(401);
		expect(result).toEqual({ noWebhookResponse: true });
	});

	it('replies 401 when the signature header is missing', async () => {
		const { context, response } = createWebhookContext({
			headers: { 'x-wave-signature': undefined },
		});
		expect(await run(context)).toEqual({ noWebhookResponse: true });
		expect(response.status).toHaveBeenCalledWith(401);
	});

	it('does not check the signature when verification is off', async () => {
		const { context, getCredentials } = createWebhookContext({
			parameters: { verifySignature: false },
			headers: { 'x-wave-signature': 'bad' },
		});
		const result = await run(context);
		expect(result.workflowData).toHaveLength(1);
		expect(getCredentials).not.toHaveBeenCalled();
	});

	it('replies 200 without a workflow run to an event that is not selected', async () => {
		const { context, response } = createWebhookContext({
			parameters: { events: ['estimate.sent'] },
		});
		expect(await run(context)).toEqual({ noWebhookResponse: true });
		expect(response.status).toHaveBeenCalledWith(200);
	});

	it('leaves out the API IDs when the option is off', async () => {
		const { context } = createWebhookContext({ parameters: { addApiIds: false } });
		const result = await run(context);
		expect(result.workflowData![0][0].json.apiIds).toBeUndefined();
	});

	it('loads the full invoice', async () => {
		const invoice = { id: 'inv', status: 'PAID' };
		const { context, request } = createWebhookContext({
			parameters: { fetchFullRecord: true },
			apiResponse: { data: { business: { invoice } } },
		});
		const result = await run(context);
		expect(result.workflowData![0][0].json.record).toEqual(invoice);
		expect(request).toHaveBeenCalledWith(
			'waveOAuth2Api',
			expect.objectContaining({
				body: expect.objectContaining({
					variables: {
						businessId: b64(`Business:${BUSINESS_UUID}`),
						id: b64(`Business:${BUSINESS_UUID};Invoice:${INVOICE_UUID}`),
					},
				}),
			}),
		);
		expect(request.mock.calls[0][1].body.query).toContain('invoice(id: $id)');
	});

	it('loads the full estimate for an estimate event', async () => {
		const body = JSON.stringify({
			type: 'estimate.viewed',
			business_id: BUSINESS_UUID,
			estimate_id: 'e1',
		});
		const { context, request } = createWebhookContext({
			body,
			parameters: { fetchFullRecord: true },
			apiResponse: { data: { business: { estimate: { id: 'est' } } } },
		});
		const result = await run(context);
		expect(result.workflowData![0][0].json.record).toEqual({ id: 'est' });
		expect(request.mock.calls[0][1].body.query).toContain('estimate(id: $id)');
	});

	it('adds the error and still starts the workflow when the record cannot be loaded', async () => {
		const { context, response } = createWebhookContext({
			parameters: { fetchFullRecord: true },
			apiResponse: {
				data: { business: null },
				errors: [{ message: 'Not allowed', extensions: { code: 'FORBIDDEN' } }],
			},
		});
		const result = await run(context);
		expect(response.status).toHaveBeenCalledWith(200);
		expect(result.workflowData![0][0].json.recordError).toBe('Not allowed');
	});

	it('does not load a record for a checkout event', async () => {
		const body = JSON.stringify({
			event_type: 'checkout.paid',
			business_id: BUSINESS_UUID,
			checkout_id: 'c1',
		});
		const { context, request } = createWebhookContext({
			body,
			parameters: { fetchFullRecord: true },
		});
		const result = await run(context);
		expect(request).not.toHaveBeenCalled();
		expect(result.workflowData![0][0].json.apiIds).toMatchObject({
			checkoutId: b64(`Business:${BUSINESS_UUID};Checkout:c1`),
		});
	});
});
