import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { waveRequest } from '../transport';
import { getSelectedBusinessId, matchesFilter } from './searchHelpers';

interface InvoiceWithPayments {
	currency: { code: string };
	payments: Array<{
		id: string;
		amount: string | null;
		paymentDate: string | null;
		paymentMethod: string | null;
	}> | null;
}

/** The node has no payment list of its own, so it lists the payments of the selected invoice. */
function getSelectedInvoiceId(ctx: ILoadOptionsFunctions): string {
	for (const name of ['invoiceId', 'listInvoiceId']) {
		try {
			const value = ctx.getCurrentNodeParameter(name, { extractValue: true });
			if (typeof value === 'string' && value.trim()) return value.trim();
		} catch {
			continue;
		}
	}
	return '';
}

export async function searchInvoicePayments(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const invoiceId = getSelectedInvoiceId(this);
	if (!invoiceId) return { results: [] };
	const data = await waveRequest<{ business: { invoice: InvoiceWithPayments | null } | null }>(
		this,
		`query($businessId: ID!, $invoiceId: ID!) {
			business(id: $businessId) {
				invoice(id: $invoiceId) {
					currency { code }
					payments { id amount paymentDate paymentMethod }
				}
			}
		}`,
		{ businessId: getSelectedBusinessId(this), invoiceId },
	);
	const invoice = data.business?.invoice;
	const results = (invoice?.payments ?? [])
		.map((payment) => ({
			name: `${payment.paymentDate ?? ''} ${payment.amount ?? ''} ${invoice?.currency.code ?? ''} (${payment.paymentMethod ?? ''})`.trim(),
			value: payment.id,
		}))
		.filter((item) => matchesFilter(item.name, filter));
	return { results };
}
