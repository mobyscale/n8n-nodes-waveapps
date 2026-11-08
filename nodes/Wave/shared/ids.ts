/**
 * Wave API IDs are Base64 strings of "Business:{uuid}" or "Business:{uuid};{Type}:{id}".
 * Webhook payloads and Wave web app URLs use the raw UUIDs, so these helpers convert between
 * the two forms.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only the types that Wave documents for raw webhook IDs. Other types use other layouts
// (account IDs are "Account:{id};Business:{uuid}"), so they are not built from raw IDs.
export type WaveIdType = 'Checkout' | 'Customer' | 'Estimate' | 'Invoice';

export function isUuid(value: string): boolean {
	return UUID_PATTERN.test(value.trim());
}

function encodeBase64(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64');
}

function decodeBase64(value: string): string | undefined {
	try {
		const decoded = Buffer.from(value, 'base64').toString('utf8');
		return /^[A-Za-z]+:/.test(decoded) ? decoded : undefined;
	} catch {
		return undefined;
	}
}

/** Returns the parts of a Wave API ID, for example { Business: "uuid", Invoice: "id" }. */
export function decodeWaveId(id: string): Record<string, string> | undefined {
	const decoded = decodeBase64(id.trim());
	if (!decoded) return undefined;
	const parts: Record<string, string> = {};
	for (const segment of decoded.split(';')) {
		const separator = segment.indexOf(':');
		if (separator <= 0) return undefined;
		parts[segment.slice(0, separator)] = segment.slice(separator + 1);
	}
	return parts;
}

/** Accepts a Wave business API ID or a raw business UUID and returns the API ID. */
export function toBusinessId(value: string): string {
	const input = value.trim();
	return isUuid(input) ? encodeBase64(`Business:${input}`) : input;
}

/** Returns the raw business UUID of a business API ID or of any ID that includes a business. */
export function getBusinessUuid(businessId: string): string | undefined {
	const input = businessId.trim();
	if (isUuid(input)) return input;
	return decodeWaveId(input)?.Business;
}

/**
 * Accepts a Wave API ID or a raw ID (as sent in webhook payloads) and returns the API ID.
 * A raw ID needs the business ID, because Wave includes the business in each resource ID.
 */
export function toWaveId(type: WaveIdType, value: string, businessId?: string): string {
	const input = value.trim();
	if (!input || decodeWaveId(input)) return input;
	const businessUuid = businessId ? getBusinessUuid(businessId) : undefined;
	if (!businessUuid) return input;
	return encodeBase64(`Business:${businessUuid};${type}:${input}`);
}
