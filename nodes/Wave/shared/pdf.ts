import type { IBinaryData, IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { getCredentialType } from '../transport';

function isWaveHost(url: string): boolean {
	try {
		const host = new URL(url).hostname;
		return host === 'waveapps.com' || host.endsWith('.waveapps.com');
	} catch {
		return false;
	}
}

async function fetchPdf(ctx: IExecuteFunctions, url: string, authenticated: boolean) {
	const options = { method: 'GET' as const, url, encoding: 'arraybuffer' as const, json: false };
	return (await (authenticated
		? ctx.helpers.httpRequestWithAuthentication.call(ctx, getCredentialType(ctx), options)
		: ctx.helpers.httpRequest(options))) as ArrayBuffer;
}

/**
 * Downloads a PDF that Wave made, for example the `pdfUrl` of an invoice or estimate. The URL
 * can be public. When the plain download fails for a Wave URL, the request is sent again with
 * the credentials of the node.
 */
export async function downloadPdf(
	ctx: IExecuteFunctions,
	url: string,
	fileName: string,
): Promise<IBinaryData> {
	let content: ArrayBuffer;
	try {
		content = await fetchPdf(ctx, url, false);
	} catch (error) {
		if (!isWaveHost(url)) throw new NodeApiError(ctx.getNode(), error as JsonObject);
		content = await fetchPdf(ctx, url, true);
	}
	return await ctx.helpers.prepareBinaryData(Buffer.from(content), fileName, 'application/pdf');
}
