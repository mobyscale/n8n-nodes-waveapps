import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-wave-signature';
export const TIMESTAMP_HEADER = 'x-wave-timestamp';
/** Wave events with a timestamp further than this from now are rejected. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export interface ParsedSignature {
	timestamp?: string;
	signatures: string[];
}

/** Parses "t=<timestamp>,v1=<hex signature>". More than one v1 value is allowed. */
export function parseSignatureHeader(header: string | undefined): ParsedSignature {
	const result: ParsedSignature = { signatures: [] };
	for (const part of (header ?? '').split(',')) {
		const separator = part.indexOf('=');
		if (separator <= 0) continue;
		const key = part.slice(0, separator).trim();
		const value = part.slice(separator + 1).trim();
		if (!value) continue;
		if (key === 't') result.timestamp = value;
		else if (key === 'v1') result.signatures.push(value.toLowerCase());
	}
	return result;
}

/** Returns the timestamp in milliseconds. Wave sends seconds, but milliseconds are also accepted. */
export function parseTimestamp(value: string): number | undefined {
	if (/^\d+(\.\d+)?$/.test(value)) {
		const number = Number(value);
		return number > 1e11 ? number : number * 1000;
	}
	const date = Date.parse(value);
	return Number.isFinite(date) ? date : undefined;
}

export function computeSignature(secret: string, timestamp: string, rawBody: Buffer): string {
	return createHmac('sha256', Buffer.from(secret, 'utf8'))
		.update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBody]))
		.digest('hex');
}

function safeEqual(a: string, b: string): boolean {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	return left.length === right.length && timingSafeEqual(left, right);
}

export interface VerifyInput {
	rawBody: Buffer | string;
	signatureHeader?: string;
	timestampHeader?: string;
	secret: string;
	nowMs?: number;
	toleranceSeconds?: number;
}

export type VerifyResult = { valid: true } | { valid: false; reason: string };

/**
 * Checks the x-wave-signature header: the HMAC-SHA256 hex digest of "<timestamp>.<raw body>"
 * with the webhook secret as the key.
 */
export function verifyWaveSignature(input: VerifyInput): VerifyResult {
	if (!input.secret) return { valid: false, reason: 'The webhook secret is empty' };
	const parsed = parseSignatureHeader(input.signatureHeader);
	if (!parsed.signatures.length) {
		return { valid: false, reason: `The ${SIGNATURE_HEADER} header is missing or not valid` };
	}
	const timestamp = parsed.timestamp ?? input.timestampHeader?.trim();
	if (!timestamp) return { valid: false, reason: 'The signature timestamp is missing' };
	const timestampMs = parseTimestamp(timestamp);
	if (timestampMs === undefined) return { valid: false, reason: 'The timestamp is not valid' };
	const toleranceMs = (input.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS) * 1000;
	if (Math.abs((input.nowMs ?? Date.now()) - timestampMs) > toleranceMs) {
		return { valid: false, reason: 'The timestamp is too old or in the future' };
	}
	const body =
		typeof input.rawBody === 'string' ? Buffer.from(input.rawBody, 'utf8') : input.rawBody;
	const expected = computeSignature(input.secret, timestamp, body);
	const match = parsed.signatures.some((signature) => safeEqual(signature, expected));
	return match ? { valid: true } : { valid: false, reason: 'The signature does not match' };
}
