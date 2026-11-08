import type { IDataObject, IPollFunctions } from 'n8n-workflow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toWaveId } from '../../nodes/Wave/shared/ids';
import {
	MAX_SEEN,
	OVERLAP_MS,
	pollWave,
	processRecords,
	type TriggerState,
	type WaveRecord,
} from '../../nodes/WaveTrigger/poll';
import {
	buildListQuery,
	getFilterVariables,
	RESOURCES,
	type TriggerResource,
} from '../../nodes/WaveTrigger/resources';
import { WaveTrigger } from '../../nodes/WaveTrigger/WaveTrigger.node';

const BUSINESS_UUID = '3be6dae8-c292-4963-8f70-8440f8bb68f3';
const BUSINESS_ID = Buffer.from(`Business:${BUSINESS_UUID}`).toString('base64');
const NOW = Date.parse('2026-01-01T12:00:00.000Z');
const LAST_POLL = NOW - 60_000;

const iso = (ms: number) => new Date(ms).toISOString();

function record(id: string, createdAt: number, modifiedAt: number): WaveRecord {
	return { id, name: id, createdAt: iso(createdAt), modifiedAt: iso(modifiedAt) };
}

describe('processRecords', () => {
	const base = { lastPollMs: LAST_POLL, nowMs: NOW, seen: [] as string[] };

	it('splits created and updated records by createdAt', () => {
		const created = record('a', LAST_POLL + 1000, LAST_POLL + 1000);
		const updated = record('b', LAST_POLL - 3_600_000, LAST_POLL + 2000);
		const records = [updated, created];

		expect(processRecords(records, { ...base, event: 'created' }).records).toEqual([created]);
		expect(processRecords(records, { ...base, event: 'updated' }).records).toEqual([updated]);
		expect(processRecords(records, { ...base, event: 'createdOrUpdated' }).records).toEqual([
			created,
			updated,
		]);
	});

	it('removes records that were seen with the same modifiedAt', () => {
		const first = record('a', LAST_POLL - 3_600_000, NOW - 2000);
		const again = processRecords([first], { ...base, event: 'createdOrUpdated' });
		expect(again.records).toEqual([first]);

		const second = processRecords([first], {
			...base,
			event: 'createdOrUpdated',
			seen: again.seen,
		});
		expect(second.records).toEqual([]);

		const changed = record('a', LAST_POLL - 3_600_000, NOW - 1000);
		expect(
			processRecords([first, changed], { ...base, event: 'createdOrUpdated', seen: again.seen })
				.records,
		).toEqual([changed]);
	});

	it('treats a record in the overlap as created only when it was not seen before', () => {
		const inOverlap = record('a', LAST_POLL - 2000, LAST_POLL - 2000);
		expect(processRecords([inOverlap], { ...base, event: 'created' }).records).toEqual([inOverlap]);

		const seen = [`a|${inOverlap.modifiedAt}`];
		const update = record('a', LAST_POLL - 2000, LAST_POLL + 1000);
		expect(processRecords([update], { ...base, event: 'created', seen }).records).toEqual([]);
		expect(processRecords([update], { ...base, event: 'updated', seen }).records).toEqual([update]);
	});

	it('keeps the seen list small', () => {
		const old = `old|${iso(NOW - 10 * OVERLAP_MS)}`;
		const recent = record('r', NOW - 1000, NOW - 1000);
		const result = processRecords([recent], { ...base, event: 'createdOrUpdated', seen: [old] });
		expect(result.seen).toEqual([`r|${recent.modifiedAt}`]);

		const many = Array.from({ length: MAX_SEEN + 50 }, (_, index) =>
			record(`id${index}`, NOW - 1000, NOW - 1000 + index),
		);
		const bounded = processRecords(many, { ...base, event: 'createdOrUpdated' });
		expect(bounded.records).toHaveLength(MAX_SEEN + 50);
		expect(bounded.seen).toHaveLength(MAX_SEEN);
		expect(bounded.seen.at(-1)).toBe(`id${MAX_SEEN + 49}|${many.at(-1)!.modifiedAt}`);
	});
});

describe('getFilterVariables and buildListQuery', () => {
	it('sends isArchived as null unless the user sets it', () => {
		expect(getFilterVariables('product', {}, BUSINESS_ID)).toEqual({ isArchived: null });
		expect(getFilterVariables('salesTax', { archived: 'active' }, BUSINESS_ID)).toEqual({
			isArchived: false,
		});
		expect(getFilterVariables('vendor', { archived: 'active' }, BUSINESS_ID)).toEqual({});
	});

	it('converts a raw customer ID and ignores filters of other resources', () => {
		const variables = getFilterVariables(
			'invoice',
			{
				status: 'PAID',
				customerId: { __rl: true, mode: 'id', value: '12345' },
				currency: 'USD',
				email: 'x@example.com',
			},
			BUSINESS_ID,
		);
		expect(variables).toEqual({
			status: 'PAID',
			customerId: toWaveId('Customer', '12345', BUSINESS_ID),
			currency: 'USD',
		});
	});

	it('declares only the filters that are set and uses the sort shape of the list', () => {
		const invoices = buildListQuery('invoice', ['status'], 'MODIFIED_AT_ASC');
		expect(invoices).toContain('$status: InvoiceStatus');
		expect(invoices).not.toContain('$customerId');
		expect(invoices).toContain('sort: [MODIFIED_AT_ASC]');
		expect(buildListQuery('estimate', [], 'MODIFIED_AT_ASC')).toContain('sort: MODIFIED_AT_ASC');
		expect(buildListQuery('vendor', [], 'MODIFIED_AT_ASC')).not.toContain('sort:');
	});
});

interface PollContextOptions {
	parameters?: IDataObject;
	mode?: 'manual' | 'trigger';
	state?: TriggerState;
	pages?: IDataObject[][];
}

function createPollContext(options: PollContextOptions = {}) {
	const parameters: IDataObject = {
		authentication: 'accessToken',
		businessId: { __rl: true, mode: 'list', value: BUSINESS_ID },
		resource: 'customer',
		event: 'createdOrUpdated',
		filters: {},
		...options.parameters,
	};
	const state = (options.state ?? {}) as TriggerState;
	const request = vi.fn();
	for (const nodes of options.pages ?? [[]]) {
		request.mockResolvedValueOnce({
			data: {
				business: {
					[RESOURCES[parameters.resource as TriggerResource].listField]: {
						pageInfo: { currentPage: 1, totalPages: 1 },
						edges: nodes.map((node) => ({ node })),
					},
				},
			},
		});
	}
	const context = {
		getNode: () => ({ id: '1', name: 'Wave Trigger', type: 'waveTrigger', typeVersion: 1 }),
		getMode: () => options.mode ?? 'trigger',
		getWorkflowStaticData: () => state,
		getNodeParameter: (name: string, fallback?: unknown, opts?: { extractValue?: boolean }) => {
			const value = name in parameters ? parameters[name] : fallback;
			if (opts?.extractValue && value && typeof value === 'object' && '__rl' in value) {
				return (value as { value: unknown }).value;
			}
			return value;
		},
		helpers: {
			httpRequestWithAuthentication: request,
			returnJsonArray: (items: IDataObject[]) => items.map((json) => ({ json })),
		},
	} as unknown as IPollFunctions;
	return { context, request, state };
}

const variablesOf = (request: ReturnType<typeof vi.fn>, call = 0) =>
	request.mock.calls[call][1].body.variables as IDataObject;
const queryOf = (request: ReturnType<typeof vi.fn>, call = 0) =>
	request.mock.calls[call][1].body.query as string;

describe('pollWave', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('saves the start time on the first poll and returns nothing', async () => {
		const { context, request, state } = createPollContext();
		expect(await pollWave.call(context)).toBeNull();
		expect(request).not.toHaveBeenCalled();
		expect(state).toEqual({
			lastPollAt: iso(NOW),
			configKey: `${BUSINESS_ID}|customer`,
			seen: [],
		});
	});

	it('reads the changes since the last poll minus the overlap', async () => {
		const created = record('new', NOW - 5000, NOW - 5000);
		const updated = record('old', LAST_POLL - 3_600_000, NOW - 3000);
		const { context, request, state } = createPollContext({
			parameters: { event: 'updated' },
			state: { lastPollAt: iso(LAST_POLL), configKey: `${BUSINESS_ID}|customer`, seen: [] },
			pages: [[created, updated]],
		});
		const output = await pollWave.call(context);
		expect(output).toEqual([[{ json: updated }]]);
		expect(variablesOf(request)).toMatchObject({
			businessId: BUSINESS_ID,
			modifiedAtAfter: iso(LAST_POLL - OVERLAP_MS),
			isArchived: null,
			page: 1,
		});
		expect(queryOf(request)).toContain('sort: [MODIFIED_AT_ASC]');
		expect(state.lastPollAt).toBe(iso(NOW));
		expect(state.seen).toEqual([`new|${created.modifiedAt}`, `old|${updated.modifiedAt}`]);
	});

	it('returns simplified records when the Simplify option is on', async () => {
		const changed = {
			...record('a', LAST_POLL - 5000, LAST_POLL - 5000),
			currency: { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
		};
		const { context } = createPollContext({
			parameters: { options: { simplify: true } },
			state: { lastPollAt: iso(LAST_POLL), configKey: `${BUSINESS_ID}|customer`, seen: [] },
			pages: [[changed]],
		});
		const output = await pollWave.call(context);
		expect(output).toEqual([[{ json: { ...changed, currency: 'CAD' } }]]);
	});

	it('returns nothing when all records were seen', async () => {
		const seenRecord = record('a', LAST_POLL - 5000, LAST_POLL - 5000);
		const { context } = createPollContext({
			state: {
				lastPollAt: iso(LAST_POLL),
				configKey: `${BUSINESS_ID}|customer`,
				seen: [`a|${seenRecord.modifiedAt}`],
			},
			pages: [[seenRecord]],
		});
		expect(await pollWave.call(context)).toBeNull();
	});

	it('starts again when the business or the resource changes', async () => {
		const { context, request, state } = createPollContext({
			parameters: { resource: 'invoice' },
			state: { lastPollAt: iso(LAST_POLL), configKey: `${BUSINESS_ID}|customer`, seen: ['x|y'] },
		});
		expect(await pollWave.call(context)).toBeNull();
		expect(request).not.toHaveBeenCalled();
		expect(state.configKey).toBe(`${BUSINESS_ID}|invoice`);
		expect(state.seen).toEqual([]);
	});

	it('returns the newest record in manual mode and keeps the static data', async () => {
		const newest = record('n', LAST_POLL, NOW - 1000);
		const { context, request, state } = createPollContext({
			mode: 'manual',
			parameters: { resource: 'invoice', filters: { status: 'PAID' } },
			pages: [[newest]],
		});
		expect(await pollWave.call(context)).toEqual([[{ json: newest }]]);
		expect(queryOf(request)).toContain('sort: [MODIFIED_AT_DESC]');
		expect(variablesOf(request)).toMatchObject({ status: 'PAID', pageSize: 1 });
		expect(variablesOf(request).modifiedAtAfter).toBeUndefined();
		expect(state).toEqual({});
	});

	it('sorts by creation date in manual mode for the created event', async () => {
		const { context, request } = createPollContext({
			mode: 'manual',
			parameters: { resource: 'estimate', event: 'created' },
			pages: [[record('e', NOW, NOW)]],
		});
		await pollWave.call(context);
		expect(queryOf(request)).toContain('sort: CREATED_AT_DESC');
	});

	it('finds the newest vendor in manual mode without a sort argument', async () => {
		const older = record('older', LAST_POLL, LAST_POLL);
		const newer = record('newer', LAST_POLL, NOW - 1000);
		const { context, request } = createPollContext({
			mode: 'manual',
			parameters: { resource: 'vendor' },
			pages: [[newer, older].reverse()],
		});
		expect(await pollWave.call(context)).toEqual([[{ json: newer }]]);
		expect(queryOf(request)).not.toContain('sort:');
	});

	it('returns nothing in manual mode when there are no records', async () => {
		const { context } = createPollContext({ mode: 'manual', pages: [[]] });
		expect(await pollWave.call(context)).toBeNull();
	});

	it('fails without a business', async () => {
		const { context } = createPollContext({
			parameters: { businessId: { __rl: true, mode: 'list', value: '' } },
		});
		await expect(new WaveTrigger().poll.call(context)).rejects.toThrow('Select a business');
	});
});
