import type {
	IDataObject,
	INodeExecutionData,
	INodeParameterResourceLocator,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toBusinessId } from '../Wave/shared/ids';
import { waveGetAll, type WaveConnection } from '../Wave/transport';
import {
	buildListQuery,
	getFilterVariables,
	RESOURCES,
	type ResourceConfig,
	type TriggerResource,
} from './resources';

/**
 * Each poll reads the records that changed since the last poll minus this overlap, so that a
 * small difference between the n8n clock and the Wave clock does not lose changes. Records that
 * the overlap returns again are removed with the "seen" list.
 */
export const OVERLAP_MS = 10_000;
/** The maximum number of "seen" keys in the static data. */
export const MAX_SEEN = 1000;

export type TriggerEvent = 'created' | 'updated' | 'createdOrUpdated';

export interface TriggerState extends IDataObject {
	lastPollAt?: string;
	/** The business and resource of the last poll. A change starts the trigger again. */
	configKey?: string;
	/** Keys of the records that the trigger saw, as "id|modifiedAt". */
	seen?: string[];
}

export interface WaveRecord extends IDataObject {
	id: string;
	createdAt: string;
	modifiedAt: string;
}

const seenKey = (record: WaveRecord) => `${record.id}|${record.modifiedAt}`;
const idOfKey = (key: string) => key.slice(0, key.lastIndexOf('|'));
const timeOfKey = (key: string) => Date.parse(key.slice(key.lastIndexOf('|') + 1));

export interface ProcessOptions {
	event: TriggerEvent;
	lastPollMs: number;
	nowMs: number;
	seen: string[];
}

/**
 * Removes the records that were already seen and returns the records that match the event.
 * A record is "created" when it was created after the last poll (minus the overlap) and the
 * trigger has not seen it before. Otherwise it is "updated".
 */
export function processRecords(
	records: WaveRecord[],
	options: ProcessOptions,
): { records: WaveRecord[]; seen: string[] } {
	const since = options.lastPollMs - OVERLAP_MS;
	const seen = new Set(options.seen);
	const seenIds = new Set(options.seen.map(idOfKey));
	const sorted = [...records].sort((a, b) => Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt));
	const output: WaveRecord[] = [];

	for (const record of sorted) {
		const key = seenKey(record);
		if (seen.has(key)) continue;
		seen.add(key);
		const isCreated = Date.parse(record.createdAt) > since && !seenIds.has(record.id);
		seenIds.add(record.id);
		if (
			options.event === 'createdOrUpdated' ||
			(options.event === 'created' && isCreated) ||
			(options.event === 'updated' && !isCreated)
		) {
			output.push(record);
		}
	}

	// The next poll reads from (now - overlap). Keys older than one more overlap cannot come back.
	const keepAfter = options.nowMs - 2 * OVERLAP_MS;
	const kept = [...seen].filter((key) => !(timeOfKey(key) < keepAfter));
	return { records: output, seen: kept.slice(-MAX_SEEN) };
}

function getBusinessId(ctx: IPollFunctions): string {
	const raw = ctx.getNodeParameter('businessId', '', { extractValue: true }) as
		| string
		| INodeParameterResourceLocator;
	const value = String(typeof raw === 'object' && raw !== null ? raw.value : (raw ?? '')).trim();
	if (!value) throw new NodeOperationError(ctx.getNode(), 'Select a business');
	return toBusinessId(value);
}

const getConnection = (config: ResourceConfig) => (data: IDataObject) =>
	(data.business as IDataObject | null)?.[config.listField] as
		| WaveConnection<WaveRecord>
		| undefined;

function newest(records: WaveRecord[], field: 'createdAt' | 'modifiedAt'): WaveRecord | undefined {
	let result: WaveRecord | undefined;
	for (const record of records) {
		if (!result || Date.parse(record[field]) > Date.parse(result[field])) result = record;
	}
	return result;
}

/** Reads the newest record, so that a manual run shows sample data. */
async function getNewestRecord(
	ctx: IPollFunctions,
	resource: TriggerResource,
	businessId: string,
	filterVariables: IDataObject,
	event: TriggerEvent,
): Promise<WaveRecord | undefined> {
	const config = RESOURCES[resource];
	const filterNames = Object.keys(filterVariables);
	const variables = { businessId, ...filterVariables };
	const field = event === 'created' ? 'createdAt' : 'modifiedAt';
	if (config.sort) {
		const sort = event === 'created' ? config.sort.createdDesc : config.sort.modifiedDesc;
		const query = buildListQuery(resource, filterNames, sort);
		const [record] = await waveGetAll(ctx, query, variables, getConnection(config), { limit: 1 });
		return record;
	}
	// Vendors and sales taxes have no sort argument, so all records are read.
	const query = buildListQuery(resource, filterNames);
	return newest(await waveGetAll(ctx, query, variables, getConnection(config)), field);
}

export async function pollWave(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
	const businessId = getBusinessId(this);
	const resource = this.getNodeParameter('resource') as TriggerResource;
	const event = this.getNodeParameter('event', 'createdOrUpdated') as TriggerEvent;
	const filters = this.getNodeParameter('filters', {}) as IDataObject;
	if (!RESOURCES[resource]) {
		throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported`);
	}
	const config = RESOURCES[resource];
	const filterVariables = getFilterVariables(resource, filters, businessId);

	if (this.getMode() === 'manual') {
		const record = await getNewestRecord(this, resource, businessId, filterVariables, event);
		return record ? [this.helpers.returnJsonArray([record])] : null;
	}

	const state = this.getWorkflowStaticData('node') as TriggerState;
	const nowMs = Date.now();
	const configKey = `${businessId}|${resource}`;
	const lastPollMs = state.lastPollAt ? Date.parse(state.lastPollAt) : NaN;
	if (state.configKey !== configKey || !Number.isFinite(lastPollMs)) {
		state.lastPollAt = new Date(nowMs).toISOString();
		state.configKey = configKey;
		state.seen = [];
		return null;
	}

	const query = buildListQuery(resource, Object.keys(filterVariables), config.sort?.modifiedAsc);
	const records = await waveGetAll(
		this,
		query,
		{
			businessId,
			...filterVariables,
			modifiedAtAfter: new Date(lastPollMs - OVERLAP_MS).toISOString(),
		},
		getConnection(config),
	);
	const result = processRecords(records, {
		event,
		lastPollMs,
		nowMs,
		seen: state.seen ?? [],
	});
	state.lastPollAt = new Date(nowMs).toISOString();
	state.seen = result.seen;
	return result.records.length ? [this.helpers.returnJsonArray(result.records)] : null;
}
