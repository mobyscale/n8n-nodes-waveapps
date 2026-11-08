import { afterEach, describe, expect, it } from 'vitest';

import { Cleanup, getTestBusinessId, graphql, hasConfig, runNode, uniqueName } from './harness';

const CUSTOMER_CREATE = `mutation($input: CustomerCreateInput!) {
	customerCreate(input: $input) {
		didSucceed
		inputErrors { code message path }
		customer { id name }
	}
}`;

describe.skipIf(!hasConfig)('custom GraphQL', () => {
	const cleanup = new Cleanup();

	afterEach(async () => {
		await cleanup.run();
	});

	it('runs a query with variables', async () => {
		const businessId = await getTestBusinessId();
		const [result] = await runNode({
			resource: 'customGraphql',
			operation: 'execute',
			query: 'query($id: ID!) { business(id: $id) { id name } }',
			variables: JSON.stringify({ id: businessId }),
			options: {},
		});
		expect(result.business).toMatchObject({ id: businessId, name: expect.any(String) });
	});

	it('creates and deletes a customer and returns the mutation output only', async () => {
		const businessId = await getTestBusinessId();
		const name = uniqueName('graphql customer');
		const [created] = await runNode({
			resource: 'customGraphql',
			operation: 'execute',
			query: CUSTOMER_CREATE,
			variables: JSON.stringify({ input: { businessId, name } }),
			options: { returnMutationOutputOnly: true },
		});
		expect(created.didSucceed).toBe(true);
		const customer = created.customer as { id: string; name: string };
		expect(customer.name).toBe(name);
		let deletedByTest = false;
		cleanup.add('delete customer', async () => {
			if (deletedByTest) return;
			await graphql(
				'mutation($input: CustomerDeleteInput!) { customerDelete(input: $input) { didSucceed } }',
				{ input: { id: customer.id } },
			);
		});

		const [deleted] = await runNode({
			resource: 'customGraphql',
			operation: 'execute',
			query: `mutation($input: CustomerDeleteInput!) {
				customerDelete(input: $input) { didSucceed inputErrors { code message path } }
			}`,
			variables: { input: { id: customer.id } },
			options: {},
		});
		expect(deleted).toMatchObject({ customerDelete: { didSucceed: true } });
		deletedByTest = true;
	});

	it('fails when the mutation output has didSucceed false', async () => {
		const businessId = await getTestBusinessId();
		await expect(
			runNode({
				resource: 'customGraphql',
				operation: 'execute',
				query: CUSTOMER_CREATE,
				variables: JSON.stringify({ input: { businessId, name: '' } }),
				options: { returnMutationOutputOnly: true },
			}),
		).rejects.toThrow('Wave rejected the request');
	});
});
