import type { IDataObject } from 'n8n-workflow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as listSearch from '../../nodes/Wave/methods/listSearch';
import {
	Cleanup,
	createLoadOptionsContext,
	getTestBusinessId,
	graphql,
	hasConfig,
	rl,
	runNode,
	uniqueName,
} from './harness';

// Dates in the future keep an unpaid invoice at SAVED instead of OVERDUE.
const daysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const INVOICE_DATE = daysFromNow(1);
const DUE_DATE = daysFromNow(31);

const MUTATION_OUTPUT = 'didSucceed inputErrors { code message path }';

async function mutate(mutation: string, field: string, input: IDataObject) {
	const data = await graphql<Record<string, IDataObject & { didSucceed: boolean }>>(
		`mutation($input: ${mutation}!) { ${field}(input: $input) { ${MUTATION_OUTPUT} } }`,
		{ input },
	);
	if (!data[field].didSucceed) throw new Error(`${field} failed`);
}

async function findAccount(businessId: string, types: string[], subtypes?: string[]) {
	const data = await graphql<{
		business: { accounts: { edges: Array<{ node: { id: string } }> } };
	}>(
		`
			query ($businessId: ID!, $types: [AccountTypeValue!], $subtypes: [AccountSubtypeValue!]) {
				business(id: $businessId) {
					accounts(page: 1, pageSize: 5, types: $types, subtypes: $subtypes, isArchived: false) {
						edges {
							node {
								id
							}
						}
					}
				}
			}
		`,
		{ businessId, types, subtypes: subtypes ?? null },
	);
	const [edge] = data.business.accounts.edges;
	if (!edge) throw new Error(`No account found for ${types.join()} ${subtypes?.join() ?? ''}`);
	return edge.node.id;
}

describe.skipIf(!hasConfig)('invoice', () => {
	const cleanup = new Cleanup();
	let businessId: string;
	let customerId: string;
	let productId: string;
	let salesTaxId: string;
	let paymentAccountId: string;
	let userEmail: string;
	let emailSendEnabled: boolean;
	let invoiceId: string;
	let cloneId: string;
	let paymentId: string;
	let items: IDataObject;

	const business = () => ({ businessId: rl(businessId) });
	const invoiceParams = (id = invoiceId) => ({
		resource: 'invoice',
		...business(),
		invoiceId: rl(id),
	});

	async function deleteInvoice(id: string) {
		await mutate('InvoiceDeleteInput', 'invoiceDelete', { invoiceId: id });
	}

	beforeAll(async () => {
		businessId = await getTestBusinessId();
		const incomeAccountId = await findAccount(businessId, ['INCOME'], ['INCOME']);
		paymentAccountId = await findAccount(businessId, ['ASSET'], ['CASH_AND_BANK']);

		const user = await graphql<{ user: { defaultEmail: string } }>(
			'query { user { defaultEmail } }',
		);
		userEmail = user.user.defaultEmail;
		const settings = await graphql<{ business: { emailSendEnabled: boolean } }>(
			'query($id: ID!) { business(id: $id) { emailSendEnabled } }',
			{ id: businessId },
		);
		emailSendEnabled = settings.business.emailSendEnabled;

		const customer = await graphql<{
			customerCreate: { didSucceed: boolean; customer: { id: string } };
		}>(
			`
				mutation ($input: CustomerCreateInput!) {
					customerCreate(input: $input) {
						didSucceed
						customer {
							id
						}
					}
				}
			`,
			{ input: { businessId, name: uniqueName('invoice customer'), email: userEmail } },
		);
		customerId = customer.customerCreate.customer.id;
		cleanup.add('delete customer', () =>
			mutate('CustomerDeleteInput', 'customerDelete', { id: customerId }),
		);

		const tax = await graphql<{
			salesTaxCreate: { didSucceed: boolean; salesTax: { id: string } };
		}>(
			`
				mutation ($input: SalesTaxCreateInput!) {
					salesTaxCreate(input: $input) {
						didSucceed
						salesTax {
							id
						}
					}
				}
			`,
			{
				input: {
					businessId,
					name: uniqueName('invoice tax'),
					abbreviation: `T${Math.floor(Math.random() * 100000)}`,
					rate: '0.1',
				},
			},
		);
		salesTaxId = tax.salesTaxCreate.salesTax.id;
		cleanup.add('archive sales tax', () =>
			mutate('SalesTaxArchiveInput', 'salesTaxArchive', { id: salesTaxId }),
		);

		const product = await graphql<{
			productCreate: { didSucceed: boolean; product: { id: string } };
		}>(
			`
				mutation ($input: ProductCreateInput!) {
					productCreate(input: $input) {
						didSucceed
						product {
							id
						}
					}
				}
			`,
			{
				input: {
					businessId,
					name: uniqueName('invoice product'),
					unitPrice: '50',
					incomeAccountId,
				},
			},
		);
		productId = product.productCreate.product.id;
		cleanup.add('archive product', () =>
			mutate('ProductArchiveInput', 'productArchive', { id: productId }),
		);

		items = {
			itemValues: [
				{
					product: rl(productId),
					description: 'Test work',
					quantity: 2,
					unitPrice: '100',
					taxes: { taxValues: [{ salesTax: rl(salesTaxId) }] },
				},
			],
		};
	});

	afterAll(async () => {
		await cleanup.run();
	});

	it('creates an invoice with items, taxes and a discount', async () => {
		const [invoice] = await runNode({
			resource: 'invoice',
			operation: 'create',
			...business(),
			customer: rl(customerId),
			items,
			additionalFields: {
				status: 'SAVED',
				title: 'n8n test invoice',
				poNumber: 'PO-1',
				invoiceDate: `${INVOICE_DATE}T00:00:00.000Z`,
				dueDate: `${DUE_DATE}T00:00:00.000Z`,
				memo: 'Memo text',
				discounts: {
					discountValues: { discountType: 'PERCENTAGE', name: 'Early', percentage: 10 },
				},
			},
		});
		invoiceId = invoice.id as string;
		cleanup.add('delete invoice', async () => {
			try {
				await deleteInvoice(invoiceId);
			} catch {
				// A test already deleted it.
			}
		});
		expect(invoice).toMatchObject({
			status: 'SAVED',
			title: 'n8n test invoice',
			poNumber: 'PO-1',
			invoiceDate: INVOICE_DATE,
			dueDate: DUE_DATE,
			customer: { id: customerId },
			pdfUrl: expect.any(String),
			viewUrl: expect.any(String),
		});
		const [item] = invoice.items as IDataObject[];
		expect(item).toMatchObject({
			description: 'Test work',
			quantity: '2',
			product: { id: productId },
			taxes: [{ salesTax: { id: salesTaxId } }],
		});
		expect((invoice.discounts as IDataObject[])[0]).toMatchObject({ percentage: '10' });
		expect((invoice.total as IDataObject).value).toEqual(expect.any(String));
	});

	it('gets the invoice and lists it with filters', async () => {
		const [invoice] = await runNode({ ...invoiceParams(), operation: 'get' });
		expect(invoice.id).toBe(invoiceId);

		const invoices = await runNode({
			resource: 'invoice',
			operation: 'getAll',
			...business(),
			returnAll: true,
			sort: 'INVOICE_DATE_DESC',
			filters: {
				customer: rl(customerId),
				status: 'SAVED',
				invoiceDateStart: `${INVOICE_DATE}T00:00:00.000Z`,
				invoiceDateEnd: `${INVOICE_DATE}T00:00:00.000Z`,
				invoiceNumber: invoice.invoiceNumber,
			},
		});
		expect(invoices.map((entry) => entry.id)).toContain(invoiceId);

		const none = await runNode({
			resource: 'invoice',
			operation: 'getAll',
			...business(),
			returnAll: false,
			limit: 5,
			sort: 'CREATED_AT_DESC',
			filters: { customer: rl(customerId), status: 'PAID' },
		});
		expect(none).toHaveLength(0);

		const search = await listSearch.searchInvoices.call(
			createLoadOptionsContext({ businessId: rl(businessId) }),
		);
		expect(search.results.length).toBeGreaterThan(0);
	});

	it('updates the invoice', async () => {
		const [invoice] = await runNode({
			...invoiceParams(),
			operation: 'update',
			updateFields: {
				title: 'n8n test invoice updated',
				memo: 'New memo',
				items: {
					itemValues: [{ product: rl(productId), quantity: 3, unitPrice: '10' }],
				},
			},
		});
		expect(invoice.title).toBe('n8n test invoice updated');
		expect(invoice.memo).toBe('New memo');
		expect(invoice.items).toHaveLength(1);
		expect((invoice.items as IDataObject[])[0].quantity).toBe('3');
	});

	it('clones the invoice', async () => {
		const [clone] = await runNode({ ...invoiceParams(), operation: 'clone' });
		cloneId = clone.id as string;
		cleanup.add('delete cloned invoice', async () => {
			try {
				await deleteInvoice(cloneId);
			} catch {
				// A test already deleted it.
			}
		});
		expect(cloneId).not.toBe(invoiceId);
		expect(clone.customer).toMatchObject({ id: customerId });
	});

	it('approves and marks the invoice as sent', async () => {
		const [approved] = await runNode({ ...invoiceParams(), operation: 'approve' });
		expect(approved.status).not.toBe('DRAFT');

		const [sent] = await runNode({
			...invoiceParams(),
			operation: 'markSent',
			sendMethod: 'MARKED_SENT',
			sentAt: '',
		});
		expect(sent.lastSentVia).toBe('MARKED_SENT');
		expect(sent.lastSentAt).toEqual(expect.any(String));
	});

	it('sends the invoice only to the Wave user address', async () => {
		const send = runNode({
			...invoiceParams(),
			operation: 'send',
			to: userEmail,
			sendFields: { subject: 'n8n test invoice', message: 'Test message', attachPDF: true },
		});
		if (emailSendEnabled) {
			const [sent] = await send;
			expect(sent.id).toBe(invoiceId);
		} else {
			// Wave refuses to send when Business.emailSendEnabled is false.
			await expect(send).rejects.toThrow(/not authorized/i);
		}
	});

	it('records, reads, updates, receipts and deletes a payment', async () => {
		const [payment] = await runNode({
			resource: 'invoicePayment',
			operation: 'create',
			...business(),
			invoiceId: rl(invoiceId),
			paymentAccountId: rl(paymentAccountId),
			amount: 5,
			paymentDate: `${INVOICE_DATE}T00:00:00.000Z`,
			paymentMethod: 'CASH',
			exchangeRate: '1',
			additionalFields: { memo: 'n8n test payment' },
		});
		paymentId = payment.id as string;
		expect(payment).toMatchObject({
			amount: '5',
			paymentDate: INVOICE_DATE,
			memo: 'n8n test payment',
			invoice: { id: invoiceId },
		});

		const [invoice] = await runNode({ ...invoiceParams(), operation: 'get' });
		expect((invoice.payments as IDataObject[]).map((entry) => entry.id)).toContain(paymentId);

		const search = await listSearch.searchInvoicePayments.call(
			createLoadOptionsContext({ businessId: rl(businessId), listInvoiceId: rl(invoiceId) }),
		);
		expect(search.results.map((entry) => entry.value)).toContain(paymentId);

		const [fetched] = await runNode({
			resource: 'invoicePayment',
			operation: 'get',
			...business(),
			paymentId: rl(paymentId),
		});
		expect(fetched.id).toBe(paymentId);

		const [updated] = await runNode({
			resource: 'invoicePayment',
			operation: 'update',
			...business(),
			paymentId: rl(paymentId),
			updateFields: { amount: 7, memo: 'n8n test payment updated', paymentMethod: 'CHEQUE' },
		});
		expect(updated).toMatchObject({ amount: '7', memo: 'n8n test payment updated' });

		const sendReceipt = runNode({
			resource: 'invoicePayment',
			operation: 'sendReceipt',
			...business(),
			invoiceId: rl(invoiceId),
			paymentId: rl(paymentId),
			to: userEmail,
			sendFields: { subject: 'n8n test receipt' },
		});
		if (emailSendEnabled) {
			const [receipt] = await sendReceipt;
			expect(receipt.success).toBe(true);
		} else {
			await expect(sendReceipt).rejects.toThrow(/not authorized/i);
		}

		const [deleted] = await runNode({
			resource: 'invoicePayment',
			operation: 'delete',
			...business(),
			paymentId: rl(paymentId),
		});
		expect(deleted).toEqual({ success: true, id: paymentId });
	});

	it('deletes the invoices', async () => {
		for (const id of [invoiceId, cloneId]) {
			const [deleted] = await runNode({ ...invoiceParams(id), operation: 'delete' });
			expect(deleted).toEqual({ success: true, id });
		}
	});
});
