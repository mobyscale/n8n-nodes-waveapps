import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { compactInput } from '../../shared/utils';
import { waveGetAll, waveMutation, waveRequest, type WaveConnection } from '../../transport';
import { INVOICE_FIELDS } from './fields';

type InvoiceOutput = { invoice: IDataObject | null; didSucceed: boolean };

/** The invoice mutations that the Invoice operations and "After Create" share. */
async function invoiceMutation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	field: string,
	inputType: string,
	input: IDataObject,
): Promise<IDataObject> {
	const output = await waveMutation<InvoiceOutput>(
		ctx,
		`mutation($input: ${inputType}!) {
			${field}(input: $input) {
				didSucceed
				inputErrors { code message path }
				invoice { ${INVOICE_FIELDS} }
			}
		}`,
		field,
		input,
		{ itemIndex },
	);
	return output.invoice ?? {};
}

export function approveInvoice(
	ctx: IExecuteFunctions,
	itemIndex: number,
	invoiceId: string,
): Promise<IDataObject> {
	return invoiceMutation(ctx, itemIndex, 'invoiceApprove', 'InvoiceApproveInput', { invoiceId });
}

export function markInvoiceSent(
	ctx: IExecuteFunctions,
	itemIndex: number,
	input: { invoiceId: string; sendMethod?: string; sentAt?: string },
): Promise<IDataObject> {
	return invoiceMutation(
		ctx,
		itemIndex,
		'invoiceMarkSent',
		'InvoiceMarkSentInput',
		compactInput(input),
	);
}

export function sendInvoice(
	ctx: IExecuteFunctions,
	itemIndex: number,
	input: IDataObject,
): Promise<IDataObject> {
	return invoiceMutation(ctx, itemIndex, 'invoiceSend', 'InvoiceSendInput', compactInput(input));
}

/** The invoiceNumber filter of Wave matches a part of the number, so the exact match is checked here. */
export async function findInvoiceIdByNumber(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
	invoiceNumber: string,
): Promise<string | undefined> {
	const matches = await waveGetAll<
		{ id: string; invoiceNumber: string },
		{ business: { invoices: WaveConnection<{ id: string; invoiceNumber: string }> } | null }
	>(
		ctx,
		`query($businessId: ID!, $page: Int!, $pageSize: Int!, $invoiceNumber: String) {
			business(id: $businessId) {
				invoices(page: $page, pageSize: $pageSize, invoiceNumber: $invoiceNumber) {
					pageInfo { currentPage totalPages totalCount }
					edges { node { id invoiceNumber } }
				}
			}
		}`,
		{ businessId, invoiceNumber },
		(data) => data.business?.invoices,
		{ itemIndex },
	);
	return matches.find((invoice) => invoice.invoiceNumber === invoiceNumber)?.id;
}

export async function getInvoice(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
	invoiceId: string,
): Promise<IDataObject> {
	const data = await waveRequest<{ business: { invoice: IDataObject | null } | null }>(
		ctx,
		`query($businessId: ID!, $invoiceId: ID!) {
			business(id: $businessId) {
				invoice(id: $invoiceId) { ${INVOICE_FIELDS} }
			}
		}`,
		{ businessId, invoiceId },
		{ itemIndex },
	);
	return data.business?.invoice ?? {};
}
