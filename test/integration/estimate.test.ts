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

const cleanup = new Cleanup();

/** Runs a step that works only on some Wave plans. Only a Wave API rejection is accepted. */
async function expectOkOrForbidden(
	run: () => Promise<void>,
	allowed = /not authorized/,
): Promise<void> {
	try {
		await run();
	} catch (error) {
		const { name, message } = error as Error;
		expect(name === 'NodeApiError' ? message : `unexpected ${name}: ${message}`).toMatch(allowed);
	}
}

describe.skipIf(!hasConfig)('estimate and estimate deposit', () => {
	let businessId: string;
	let customerId: string;
	let productId: string;
	let paymentAccountId: string | undefined;
	let ownEmail: string;
	let estimateId: string;
	let estimateNumber: string;

	const estimate = (parameters: IDataObject) =>
		runNode({
			resource: 'estimate',
			businessId: rl(businessId),
			estimateId: rl(estimateId),
			...parameters,
		});

	const track = (id: string) =>
		cleanup.add(`delete estimate ${id}`, async () => {
			await graphql(
				`
					mutation ($input: EstimateDeleteInput!) {
						estimateDelete(input: $input) {
							didSucceed
						}
					}
				`,
				{ input: { estimateId: id } },
			);
		});

	beforeAll(async () => {
		businessId = await getTestBusinessId();

		const user = await graphql<{ user: { defaultEmail: string } }>(
			'query { user { defaultEmail } }',
		);
		ownEmail = user.user.defaultEmail;
		expect(ownEmail).toBeTruthy();

		const accounts = await graphql<{
			business: {
				income: { edges: Array<{ node: { id: string } }> };
				bank: { edges: Array<{ node: { id: string } }> };
			};
		}>(
			`
				query ($businessId: ID!) {
					business(id: $businessId) {
						income: accounts(page: 1, pageSize: 1, types: [INCOME], isArchived: false) {
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
		const incomeAccountId = accounts.business.income.edges[0].node.id;
		paymentAccountId = accounts.business.bank.edges[0]?.node.id;

		// The customer email is the Wave user's own address, so emails that Wave sends to the customer
		// never leave the test account.
		const customer = await graphql<{
			customerCreate: { didSucceed: boolean; customer: { id: string } };
		}>(
			`
				mutation ($input: CustomerCreateInput!) {
					customerCreate(input: $input) {
						didSucceed
						inputErrors {
							message
						}
						customer {
							id
						}
					}
				}
			`,
			{ input: { businessId, name: uniqueName('estimate customer'), email: ownEmail } },
		);
		customerId = customer.customerCreate.customer.id;
		cleanup.add('delete customer', async () => {
			await graphql(
				`
					mutation ($input: CustomerDeleteInput!) {
						customerDelete(input: $input) {
							didSucceed
						}
					}
				`,
				{ input: { id: customerId } },
			);
		});

		const product = await graphql<{
			productCreate: { didSucceed: boolean; product: { id: string } };
		}>(
			`
				mutation ($input: ProductCreateInput!) {
					productCreate(input: $input) {
						didSucceed
						inputErrors {
							message
						}
						product {
							id
						}
					}
				}
			`,
			{
				input: {
					businessId,
					name: uniqueName('estimate product'),
					unitPrice: '25.00',
					incomeAccountId,
				},
			},
		);
		productId = product.productCreate.product.id;
		cleanup.add('archive product', async () => {
			await graphql(
				`
					mutation ($input: ProductArchiveInput!) {
						productArchive(input: $input) {
							didSucceed
						}
					}
				`,
				{ input: { id: productId } },
			);
		});
	});

	afterAll(async () => {
		await cleanup.run();
	});

	it('creates an estimate with items and a discount', async () => {
		const [created] = await runNode({
			resource: 'estimate',
			operation: 'create',
			businessId: rl(businessId),
			customerId: rl(customerId),
			items: {
				itemValues: [
					{ product: rl(productId), description: 'First item', quantity: 2, unitPrice: '30' },
					{ product: rl(productId), quantity: 1, unitPrice: '' },
				],
			},
			additionalFields: {
				title: 'n8n test quote',
				memo: 'Created by the integration test',
				poNumber: 'PO-TEST',
				dontCarryOverNotesToInvoice: true,
				discounts: {
					discountValues: [{ discountType: 'PERCENTAGE', name: 'Promo', percentage: 10 }],
				},
			},
		});
		estimateId = created.id as string;
		track(estimateId);
		estimateNumber = created.estimateNumber as string;
		expect(created).toMatchObject({
			status: 'DRAFT',
			title: 'n8n test quote',
			poNumber: 'PO-TEST',
			depositStatus: 'DISABLED',
			dontCarryOverNotesToInvoice: true,
		});
		const items = created.items as Array<{ description: string; unitPrice: string }>;
		expect(items).toHaveLength(2);
		expect(Number(items[0].unitPrice)).toBe(30);
		expect(Number(items[1].unitPrice)).toBe(25);
		expect((created.discounts as unknown[]).length).toBe(1);
	});

	it('sends the deposit settings or reports the missing Wave entitlement', async () => {
		const parameters = {
			resource: 'estimate',
			operation: 'create',
			businessId: rl(businessId),
			customerId: rl(customerId),
			items: { itemValues: [{ product: rl(productId), quantity: 1, unitPrice: '10' }] },
			additionalFields: {
				depositStatus: 'ENABLED_OPTIONAL',
				depositUnit: 'PERCENTAGE',
				depositValue: 10,
			},
		};
		try {
			const [created] = await runNode(parameters);
			track(created.id as string);
			expect(created).toMatchObject({
				depositStatus: 'ENABLED_OPTIONAL',
				depositUnit: 'PERCENTAGE',
			});
		} catch (error) {
			// Deposits need a Wave plan with online payments.
			expect((error as Error).message).toContain('entitlement');
		}
	});

	it('gets the estimate with embedded data', async () => {
		const [plain] = await estimate({ operation: 'get' });
		expect(plain.id).toBe(estimateId);
		expect(plain.customer).toMatchObject({ id: customerId });

		const [embedded] = await estimate({
			operation: 'get',
			options: { embedAttachments: true, embedHistory: true, embedDepositPayments: true },
		});
		expect(embedded.id).toBe(estimateId);
		expect(embedded).toHaveProperty('payments');
	});

	it('gets many estimates with filters and a sort', async () => {
		const found = await runNode({
			resource: 'estimate',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: true,
			sort: 'ESTIMATE_NUMBER_ASC',
			filters: { customerId: rl(customerId), estimateNumber, status: 'DRAFT' },
		});
		expect(found.map((entry) => entry.id)).toContain(estimateId);

		const limited = await runNode({
			resource: 'estimate',
			operation: 'getAll',
			businessId: rl(businessId),
			returnAll: false,
			limit: 1,
			sort: 'CREATED_AT_DESC',
			filters: {
				currency: 'USD',
				estimateDateStart: '2000-01-01',
				estimateDateEnd: '2100-01-01',
				modifiedAtAfter: '2000-01-01T00:00:00Z',
				modifiedAtBefore: '2100-01-01T00:00:00Z',
			},
		});
		expect(limited.length).toBeLessThanOrEqual(1);
	});

	it('updates the estimate and replaces its items', async () => {
		const [updated] = await estimate({
			operation: 'update',
			updateFields: {
				memo: 'Updated memo',
				title: 'n8n test quote 2',
				items: { itemValues: [{ product: rl(productId), quantity: 3, unitPrice: '10' }] },
			},
		});
		expect(updated).toMatchObject({ memo: 'Updated memo', title: 'n8n test quote 2' });
		expect(updated.items as unknown[]).toHaveLength(1);
		// Fields that the user did not set keep their values.
		expect(updated).toMatchObject({ poNumber: 'PO-TEST', dontCarryOverNotesToInvoice: true });
	});

	it('clones and deletes an estimate', async () => {
		const [clone] = await estimate({ operation: 'clone' });
		expect(clone.id).not.toBe(estimateId);
		const cloneId = clone.id as string;
		const [deleted] = await runNode({
			resource: 'estimate',
			operation: 'delete',
			businessId: rl(businessId),
			estimateId: rl(cloneId),
		});
		expect(deleted).toEqual({ success: true, id: cloneId });
	});

	it('approves an estimate and marks it as sent', async () => {
		const [approved] = await estimate({ operation: 'approve' });
		expect(approved.status).toBe('APPROVED');

		const [sent] = await estimate({
			operation: 'markSent',
			sendMethod: 'MARKED_SENT',
			sentAt: '2026-01-01T10:00:00Z',
		});
		expect(sent).toMatchObject({ status: 'SENT', lastSentVia: 'MARKED_SENT' });
	});

	it('handles acceptance when the Wave plan allows it', async () => {
		// Wave answers FORBIDDEN when the business has no estimate acceptance feature.
		await expectOkOrForbidden(async () => {
			const [accepted] = await estimate({ operation: 'markAccepted' });
			expect(accepted.status).toBe('ACCEPTED');
			const [reset] = await estimate({ operation: 'resetAcceptance' });
			expect(reset.status).not.toBe('ACCEPTED');
		});
		await expectOkOrForbidden(async () => {
			await estimate({ operation: 'resetAcceptance' });
		}, /payments can't be reset|not authorized/);
	});

	it('generates the PDF and downloads it', async () => {
		const [generated] = await estimate({ operation: 'generatePdf' });
		expect(generated.pdfUrl).toEqual(expect.stringMatching(/^https:\/\//));

		const context = createExecuteContext({
			resource: 'estimate',
			operation: 'generatePdf',
			businessId: rl(businessId),
			estimateId: rl(estimateId),
			downloadPdf: true,
			binaryPropertyName: 'pdf',
		});
		context.helpers = {
			...context.helpers,
			httpRequest: async (options: { url: string }) =>
				await (await fetch(options.url)).arrayBuffer(),
			prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType: string) => ({
				data: buffer.toString('base64'),
				fileName,
				mimeType,
			}),
		} as never;
		const [output] = await new Wave().execute.call(context);
		const binary = output[0].binary?.pdf;
		expect(binary?.mimeType).toBe('application/pdf');
		expect(
			Buffer.from(binary?.data ?? '', 'base64')
				.subarray(0, 4)
				.toString(),
		).toBe('%PDF');
	});

	it('sends the estimate and the acceptance email to the Wave user only', async () => {
		// Wave answers FORBIDDEN when email sending is not enabled for the business.
		await expectOkOrForbidden(async () => {
			const [sent] = await estimate({
				operation: 'send',
				to: ownEmail,
				sendOptions: { subject: 'n8n test estimate', message: 'Test message', attachPDF: true },
			});
			expect(sent.id).toBe(estimateId);
		});
		await expectOkOrForbidden(async () => {
			const [accepted] = await estimate({ operation: 'sendAcceptanceEmail' });
			expect(accepted.id).toBe(estimateId);
		});
	});

	it('records, gets, updates, sends and deletes a deposit', async () => {
		let created: IDataObject;
		try {
			[created] = await runNode({
				resource: 'estimateDeposit',
				operation: 'create',
				businessId: rl(businessId),
				estimateId: rl(estimateId),
				paymentDate: '2026-01-15T00:00:00',
				amount: 5,
				paymentMethod: 'CASH',
				additionalFields: {
					memo: 'Test deposit',
					...(paymentAccountId ? { paymentAccountId: rl(paymentAccountId) } : {}),
				},
			});
		} catch (error) {
			// Wave only turns deposits on for plans with online payments. The test account has none,
			// so the request must reach Wave and Wave must reject it for that reason.
			expect((error as Error).message).toContain('is disabled on this estimate');
			return;
		}
		const paymentId = created.id as string;
		expect(created).toMatchObject({
			memo: 'Test deposit',
			paymentMethod: 'CASH',
			paymentProvider: 'MANUAL',
		});
		expect(Number(created.amount)).toBe(5);

		const [fetched] = await runNode({
			resource: 'estimateDeposit',
			operation: 'get',
			businessId: rl(businessId),
			estimatePaymentId: paymentId,
		});
		expect(fetched.id).toBe(paymentId);

		const [updated] = await runNode({
			resource: 'estimateDeposit',
			operation: 'update',
			businessId: rl(businessId),
			estimateId: rl(estimateId),
			estimatePaymentId: paymentId,
			updateFields: { amount: 6, memo: 'Changed deposit', paymentMethod: 'CHEQUE' },
		});
		expect(updated).toMatchObject({ memo: 'Changed deposit', paymentMethod: 'CHEQUE' });
		expect(Number(updated.amount)).toBe(6);

		const [embedded] = await estimate({
			operation: 'get',
			options: { embedDepositPayments: true },
		});
		expect((embedded.payments as Array<{ id: string }>).map((payment) => payment.id)).toContain(
			paymentId,
		);

		const [receipt] = await runNode({
			resource: 'estimateDeposit',
			operation: 'sendReceipt',
			businessId: rl(businessId),
			estimateId: rl(estimateId),
			estimatePaymentId: paymentId,
			to: ownEmail,
			options: { subject: 'n8n test receipt' },
		});
		expect(receipt).toMatchObject({ success: true, estimatePaymentId: paymentId });

		const [deleted] = await runNode({
			resource: 'estimateDeposit',
			operation: 'delete',
			estimatePaymentId: paymentId,
		});
		expect(deleted).toEqual({ success: true, id: paymentId });
	});

	it('sends valid deposit operations to Wave and gets a rejection for an unknown deposit', async () => {
		const businessPart = Buffer.from(businessId, 'base64').toString('utf8');
		const fakeId = Buffer.from(`${businessPart};EstimatePayment:1`).toString('base64');
		const base = {
			resource: 'estimateDeposit',
			businessId: rl(businessId),
			estimateId: rl(estimateId),
			estimatePaymentId: fakeId,
		};
		const calls: IDataObject[] = [
			{ operation: 'get' },
			{ operation: 'update', updateFields: { amount: 1 } },
			{ operation: 'sendReceipt', to: ownEmail },
			{ operation: 'delete' },
		];
		for (const call of calls) {
			let message = '';
			try {
				const [result] = await runNode({ ...base, ...call });
				expect(call.operation).toBe('get');
				expect(result).toEqual({});
			} catch (error) {
				message =
					(error as Error).message + ((error as { description?: string }).description ?? '');
				expect(message).not.toContain('GRAPHQL_VALIDATION_FAILED');
			}
		}
	});

	it('converts an estimate to an invoice', async () => {
		const [converted] = await estimate({ operation: 'convertToInvoice' });
		const invoiceId = converted.invoiceId as string;
		expect(converted).toMatchObject({ success: true, estimateId });
		expect(invoiceId).toEqual(expect.any(String));
		cleanup.add('delete invoice', async () => {
			await graphql(
				`
					mutation ($input: InvoiceDeleteInput!) {
						invoiceDelete(input: $input) {
							didSucceed
						}
					}
				`,
				{ input: { invoiceId } },
			);
		});

		const [after] = await estimate({ operation: 'get' });
		expect(after.status).toBe('CONVERTED');
	});
});
