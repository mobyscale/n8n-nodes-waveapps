import type { IDataObject } from 'n8n-workflow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Wave } from '../../nodes/Wave/Wave.node';
import {
	Cleanup,
	createExecuteContext,
	getTestBusinessId,
	graphql,
	hasConfig,
	rl,
	runNode,
	uniqueName,
} from './harness';

const daysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

async function mutate(mutation: string, field: string, input: IDataObject) {
	const data = await graphql<Record<string, { didSucceed: boolean }>>(
		`mutation($input: ${mutation}!) { ${field}(input: $input) { didSucceed } }`,
		{ input },
	);
	if (!data[field].didSucceed) throw new Error(`${field} failed`);
}

describe.skipIf(!hasConfig)('invoice and estimate conveniences', () => {
	const cleanup = new Cleanup();
	let businessId: string;
	let customerId: string;
	let productId: string;
	let productName: string;
	let incomeAccountId: string;
	let paymentAccountId: string;
	let userEmail: string;
	let emailSendEnabled: boolean;

	const business = () => ({ businessId: rl(businessId) });
	const baseInvoice = () => ({
		resource: 'invoice',
		operation: 'create',
		...business(),
		customer: rl(customerId),
	});
	const dates = {
		invoiceDate: `${daysFromNow(1)}T00:00:00.000Z`,
		dueDate: `${daysFromNow(31)}T00:00:00.000Z`,
	};
	const line = { description: 'Test work', quantity: 1, unitPrice: '40' };

	const trackInvoice = (id: string) =>
		cleanup.add(`delete invoice ${id}`, async () => {
			try {
				await mutate('InvoiceDeleteInput', 'invoiceDelete', { invoiceId: id });
			} catch {
				// A test already deleted it.
			}
		});
	const trackEstimate = (id: string) =>
		cleanup.add(`delete estimate ${id}`, () =>
			mutate('EstimateDeleteInput', 'estimateDelete', { estimateId: id }),
		);
	const trackProduct = (id: string) =>
		cleanup.add(`archive product ${id}`, () =>
			mutate('ProductArchiveInput', 'productArchive', { id }),
		);

	async function createApprovedInvoice(extra: IDataObject = {}) {
		const [invoice] = await runNode({
			...baseInvoice(),
			items: { itemValues: [{ product: rl(productId), ...line }] },
			additionalFields: dates,
			afterCreate: 'approve',
			...extra,
		});
		trackInvoice(invoice.id as string);
		return invoice;
	}

	beforeAll(async () => {
		businessId = await getTestBusinessId();
		const accounts = await graphql<{
			business: {
				income: { edges: Array<{ node: { id: string } }> };
				bank: { edges: Array<{ node: { id: string } }> };
			};
		}>(
			`
				query ($businessId: ID!) {
					business(id: $businessId) {
						income: accounts(page: 1, pageSize: 1, subtypes: [INCOME], isArchived: false) {
							edges {
								node {
									id
								}
							}
						}
						bank: accounts(page: 1, pageSize: 1, subtypes: [CASH_AND_BANK], isArchived: false) {
							edges {
								node {
									id
								}
							}
						}
					}
				}
			`,
			{ businessId },
		);
		incomeAccountId = accounts.business.income.edges[0].node.id;
		paymentAccountId = accounts.business.bank.edges[0].node.id;

		const user = await graphql<{ user: { defaultEmail: string } }>(
			'query { user { defaultEmail } }',
		);
		userEmail = user.user.defaultEmail;
		const settings = await graphql<{ business: { emailSendEnabled: boolean } }>(
			'query($id: ID!) { business(id: $id) { emailSendEnabled } }',
			{ id: businessId },
		);
		emailSendEnabled = settings.business.emailSendEnabled;

		// The customer email is the Wave user address, so no email leaves the test account.
		const customer = await graphql<{ customerCreate: { customer: { id: string } } }>(
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
			{ input: { businessId, name: uniqueName('conveniences customer'), email: userEmail } },
		);
		customerId = customer.customerCreate.customer.id;
		cleanup.add('delete customer', () =>
			mutate('CustomerDeleteInput', 'customerDelete', { id: customerId }),
		);

		productName = uniqueName('conveniences product');
		const product = await graphql<{ productCreate: { product: { id: string } } }>(
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
			{ input: { businessId, name: productName, unitPrice: '50', incomeAccountId } },
		);
		productId = product.productCreate.product.id;
		trackProduct(productId);
	});

	afterAll(async () => {
		await cleanup.run();
	});

	describe('Match Products By Name', () => {
		it('uses a matching product and creates a missing one for an invoice', async () => {
			const newName = uniqueName('conveniences new product');
			const [invoice] = await runNode({
				...baseInvoice(),
				matchProductsByName: true,
				defaultIncomeAccount: rl(incomeAccountId),
				items: {
					itemValues: [
						{ productName: `  ${productName.toUpperCase()} `, ...line },
						{ productName: newName, quantity: 2, unitPrice: '15' },
						{ productName: newName.toLowerCase(), quantity: 1, unitPrice: '15' },
					],
				},
				additionalFields: dates,
			});
			trackInvoice(invoice.id as string);

			const items = invoice.items as Array<{ product: { id: string; name: string } }>;
			expect(items).toHaveLength(3);
			expect(items[0].product.id).toBe(productId);
			expect(items[1].product.name).toBe(newName);
			expect(items[2].product.id).toBe(items[1].product.id);
			trackProduct(items[1].product.id);

			const [created] = await runNode({
				resource: 'product',
				operation: 'get',
				...business(),
				productId: rl(items[1].product.id),
			});
			expect(created).toMatchObject({
				name: newName,
				unitPrice: '15',
				isArchived: false,
				incomeAccount: { id: incomeAccountId },
			});
		});

		it('uses a matching product and creates a missing one for an estimate', async () => {
			const newName = uniqueName('conveniences estimate product');
			const [estimate] = await runNode({
				resource: 'estimate',
				operation: 'create',
				...business(),
				customerId: rl(customerId),
				matchProductsByName: true,
				defaultIncomeAccount: rl(incomeAccountId),
				items: {
					itemValues: [
						{ productName: productName.toLowerCase(), quantity: 1 },
						{ productName: newName, quantity: 1, unitPrice: '9' },
					],
				},
				additionalFields: {},
			});
			trackEstimate(estimate.id as string);
			const items = estimate.items as Array<{ product: { id: string; name: string } }>;
			expect(items[0].product.id).toBe(productId);
			expect(items[1].product.name).toBe(newName);
			trackProduct(items[1].product.id);
		});
	});

	describe('After Create', () => {
		it('approves and marks an invoice as sent', async () => {
			const [invoice] = await runNode({
				...baseInvoice(),
				items: { itemValues: [{ product: rl(productId), ...line }] },
				additionalFields: dates,
				afterCreate: 'approveMarkSent',
			});
			trackInvoice(invoice.id as string);
			expect(invoice.status).not.toBe('DRAFT');
			expect(invoice.lastSentVia).toBe('MARKED_SENT');
			expect(invoice.lastSentAt).toEqual(expect.any(String));
		});

		it('approves and marks an estimate as sent', async () => {
			const [estimate] = await runNode({
				resource: 'estimate',
				operation: 'create',
				...business(),
				customerId: rl(customerId),
				items: { itemValues: [{ product: rl(productId), ...line }] },
				additionalFields: {},
				afterCreate: 'approveMarkSent',
			});
			trackEstimate(estimate.id as string);
			expect(estimate.status).not.toBe('DRAFT');
			expect(estimate.lastSentVia).toBe('MARKED_SENT');
		});

		it('sends the invoice to the customer, or names the created ID when Wave refuses', async () => {
			const send = runNode({
				...baseInvoice(),
				items: { itemValues: [{ product: rl(productId), ...line }] },
				additionalFields: { ...dates, invoiceNumber: `N8T${Date.now()}` },
				afterCreate: 'approveSend',
				afterCreateSendOptions: { subject: 'n8n test invoice' },
			});
			if (emailSendEnabled) {
				const [invoice] = await send;
				trackInvoice(invoice.id as string);
				return;
			}
			await expect(send).rejects.toThrow(/invoice was created \(ID .+\).*not authorized/is);
			// The invoice exists, so the next lines find it for cleanup.
			const list = await runNode({
				resource: 'invoice',
				operation: 'getAll',
				...business(),
				returnAll: false,
				limit: 5,
				sort: 'CREATED_AT_DESC',
				filters: { customer: rl(customerId) },
			});
			for (const entry of list) trackInvoice(entry.id as string);
		});
	});

	describe('Skip If Invoice Number Exists', () => {
		it('returns the existing invoice and creates no second one', async () => {
			const invoiceNumber = `N8T${Date.now()}`;
			const params = {
				...baseInvoice(),
				items: { itemValues: [{ product: rl(productId), ...line }] },
			};
			const [first] = await runNode({ ...params, additionalFields: { ...dates, invoiceNumber } });
			trackInvoice(first.id as string);

			const [again] = await runNode({
				...params,
				additionalFields: { ...dates, invoiceNumber, skipIfInvoiceNumberExists: true },
				afterCreate: 'approve',
			});
			expect(again.id).toBe(first.id);
			expect(again.status).toBe('DRAFT');

			const matches = await runNode({
				resource: 'invoice',
				operation: 'getAll',
				...business(),
				returnAll: true,
				sort: 'CREATED_AT_DESC',
				filters: { customer: rl(customerId), invoiceNumber },
			});
			expect(matches).toHaveLength(1);
		});

		it('does nothing without an invoice number', async () => {
			const [invoice] = await runNode({
				...baseInvoice(),
				items: { itemValues: [{ product: rl(productId), ...line }] },
				additionalFields: { ...dates, skipIfInvoiceNumberExists: true },
			});
			trackInvoice(invoice.id as string);
			expect(invoice.id).toEqual(expect.any(String));
		});
	});

	describe('Invoice Download PDF', () => {
		it('downloads the invoice as a PDF', async () => {
			const invoice = await createApprovedInvoice();
			const context = createExecuteContext({
				resource: 'invoice',
				operation: 'downloadPdf',
				...business(),
				invoiceId: rl(invoice.id as string),
				binaryPropertyName: 'pdf',
			});
			context.helpers = {
				...context.helpers,
				httpRequest: async (options: { url: string }) => {
					const response = await fetch(options.url);
					if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
					return await response.arrayBuffer();
				},
				prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType: string) => ({
					data: buffer.toString('base64'),
					fileName,
					mimeType,
				}),
			} as never;
			const [output] = await new Wave().execute.call(context);
			expect(output[0].json).toMatchObject({ invoiceId: invoice.id });
			const binary = output[0].binary?.pdf;
			expect(binary?.mimeType).toBe('application/pdf');
			expect(
				Buffer.from(binary?.data ?? '', 'base64')
					.subarray(0, 4)
					.toString(),
			).toBe('%PDF');
		});
	});

	describe('Record Manual Payment', () => {
		const payParams = (invoiceId: string, extra: IDataObject = {}) => ({
			resource: 'invoicePayment',
			operation: 'create',
			...business(),
			invoiceId: rl(invoiceId),
			paymentAccountId: rl(paymentAccountId),
			amountType: 'fullBalance',
			paymentDate: `${daysFromNow(1)}T00:00:00.000Z`,
			paymentMethod: 'CASH',
			exchangeRate: '1',
			additionalFields: {},
			...extra,
		});
		const amountDue = async (invoiceId: string) => {
			const [invoice] = await runNode({
				resource: 'invoice',
				operation: 'get',
				...business(),
				invoiceId: rl(invoiceId),
			});
			return (invoice.amountDue as IDataObject).value;
		};
		const trackPayment = (id: string) =>
			cleanup.add(`delete payment ${id}`, () =>
				mutate('InvoicePaymentDeleteInput', 'invoicePaymentDelete', { id }),
			);

		it('pays an approved invoice in full', async () => {
			const invoice = await createApprovedInvoice();
			expect(await amountDue(invoice.id as string)).toBe('40.00');
			const [payment] = await runNode(payParams(invoice.id as string));
			trackPayment(payment.id as string);
			expect(Number(payment.amount)).toBe(40);
			expect(Number(await amountDue(invoice.id as string))).toBe(0);

			await expect(runNode(payParams(invoice.id as string))).rejects.toThrow(/no amount due/);
		});

		it('names the payment ID when the receipt cannot be sent', async () => {
			const invoice = await createApprovedInvoice();
			const run = runNode(
				payParams(invoice.id as string, {
					sendReceiptAfterPayment: true,
					receiptTo: userEmail,
					receiptOptions: { subject: 'n8n test receipt' },
				}),
			);
			if (emailSendEnabled) {
				const [payment] = await run;
				trackPayment(payment.id as string);
				return;
			}
			await expect(run).rejects.toThrow(/payment was recorded \(ID .+\).*not authorized/is);
			const [current] = await runNode({
				resource: 'invoice',
				operation: 'get',
				...business(),
				invoiceId: rl(invoice.id as string),
			});
			for (const payment of current.payments as IDataObject[]) trackPayment(payment.id as string);
		});
	});
});
