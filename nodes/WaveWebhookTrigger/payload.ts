import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';

import { toBusinessId, toWaveId, type WaveIdType } from '../Wave/shared/ids';

interface WaveEvent {
	value: string;
	name: string;
	description: string;
}

/** The events of the Wave Webhooks Setup Guide. */
export const WAVE_EVENTS: WaveEvent[] = [
	{ value: 'checkout.paid', name: 'Checkout Paid', description: 'A checkout was paid' },
	{
		value: 'estimate.accepted',
		name: 'Estimate Accepted',
		description: 'The customer accepted an estimate',
	},
	{
		value: 'estimate.approved',
		name: 'Estimate Approved',
		description: 'An estimate was approved',
	},
	{ value: 'estimate.expired', name: 'Estimate Expired', description: 'An estimate expired' },
	{
		value: 'estimate.overpaid',
		name: 'Estimate Overpaid',
		description: 'An estimate was overpaid',
	},
	{ value: 'estimate.paid', name: 'Estimate Paid', description: 'An estimate was paid' },
	{
		value: 'estimate.partially_paid',
		name: 'Estimate Partially Paid',
		description: 'An estimate was partially paid',
	},
	{ value: 'estimate.reset', name: 'Estimate Reset', description: 'An estimate was reset' },
	{ value: 'estimate.sent', name: 'Estimate Sent', description: 'An estimate was sent' },
	{
		value: 'estimate.viewed',
		name: 'Estimate Viewed',
		description: 'The customer viewed an estimate',
	},
	{ value: 'invoice.approved', name: 'Invoice Approved', description: 'An invoice was approved' },
	{ value: 'invoice.overdue', name: 'Invoice Overdue', description: 'An invoice became overdue' },
	{ value: 'invoice.overpaid', name: 'Invoice Overpaid', description: 'An invoice was overpaid' },
	{ value: 'invoice.paid', name: 'Invoice Paid', description: 'An invoice was paid' },
	{
		value: 'invoice.partially_paid',
		name: 'Invoice Partially Paid',
		description: 'An invoice was partially paid',
	},
	{ value: 'invoice.sent', name: 'Invoice Sent', description: 'An invoice was sent' },
	{
		value: 'invoice.viewed',
		name: 'Invoice Viewed',
		description: 'The customer viewed an invoice',
	},
];

export const eventOptions: INodePropertyOptions[] = WAVE_EVENTS.map(
	({ name, value, description }) => ({
		name,
		value,
		description,
	}),
);

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const EVENTS_BY_COMPACT_NAME = new Map(
	WAVE_EVENTS.map((event) => [compact(event.value), event.value]),
);

/**
 * Returns the known event name for any spelling ("invoice.paid", "INVOICE_PAID", "invoicePaid"),
 * or the trimmed value when the event is not known.
 */
export function normalizeEventType(value: string): string {
	return EVENTS_BY_COMPACT_NAME.get(compact(value)) ?? value.trim();
}

const EVENT_TYPE_FIELDS = ['event_type', 'eventType', 'type', 'event', 'event_name', 'eventName'];

/** Finds the event type in a top-level field, or in the `type` of an `event` object. */
export function getEventType(body: IDataObject): string | undefined {
	for (const field of EVENT_TYPE_FIELDS) {
		const value = body[field];
		if (typeof value === 'string' && value.trim()) return normalizeEventType(value);
	}
	const event = body.event;
	if (event && typeof event === 'object' && !Array.isArray(event)) {
		const nested = getEventType(event as IDataObject);
		if (nested) return nested;
	}
	return undefined;
}

/** True when no events are selected, or when the event is one of the selected events. */
export function isEventSelected(eventType: string | undefined, selected: string[]): boolean {
	if (!selected.length) return true;
	return eventType !== undefined && selected.includes(eventType);
}

export type IdName = 'business' | 'invoice' | 'estimate' | 'customer' | 'checkout';
const ID_NAMES: IdName[] = ['business', 'invoice', 'estimate', 'customer', 'checkout'];

export type RawIds = Partial<Record<IdName, string>>;

function asId(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim()) return value.trim();
	if (typeof value === 'number') return String(value);
	return undefined;
}

/**
 * Finds the IDs at any depth. A field matches when it is named like "invoice_id" or "invoiceId",
 * or when it is the "id" of an object named "invoice". The match closest to the top wins.
 */
export function findIds(body: unknown): RawIds {
	const ids: RawIds = {};
	let level: Array<{ value: unknown; parentName?: IdName }> = [{ value: body }];
	while (level.length && ID_NAMES.some((name) => !ids[name])) {
		const next: typeof level = [];
		for (const { value, parentName } of level) {
			if (!value || typeof value !== 'object') continue;
			if (Array.isArray(value)) {
				for (const entry of value) next.push({ value: entry, parentName });
				continue;
			}
			for (const [key, child] of Object.entries(value as IDataObject)) {
				const compactKey = compact(key);
				const id = asId(child);
				if (id) {
					const name = ID_NAMES.find((candidate) => compactKey === `${candidate}id`);
					if (name && !ids[name]) ids[name] = id;
					if (compactKey === 'id' && parentName && !ids[parentName]) ids[parentName] = id;
				}
				const childName = ID_NAMES.find((candidate) => compactKey === candidate);
				next.push({ value: child, parentName: childName });
			}
		}
		level = next;
	}
	return ids;
}

const ID_TYPES: Record<Exclude<IdName, 'business'>, WaveIdType> = {
	invoice: 'Invoice',
	estimate: 'Estimate',
	customer: 'Customer',
	checkout: 'Checkout',
};

/**
 * Builds the Wave API IDs, for example base64("Business:{business};Invoice:{invoice}").
 * An ID that is already an API ID is kept.
 */
export function toApiIds(ids: RawIds): IDataObject {
	const apiIds: IDataObject = {};
	if (ids.business) apiIds.businessId = toBusinessId(ids.business);
	for (const [name, type] of Object.entries(ID_TYPES) as Array<
		[keyof typeof ID_TYPES, WaveIdType]
	>) {
		const value = ids[name];
		if (value) apiIds[`${name}Id`] = toWaveId(type, value, ids.business);
	}
	return apiIds;
}
