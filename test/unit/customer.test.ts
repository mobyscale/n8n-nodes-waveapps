import type { IDataObject, IExecuteFunctions, INodeParameterResourceLocator } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { Wave } from '../../nodes/Wave/Wave.node';

const node = {
	id: '1',
	name: 'Wave',
	type: 'n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

const BUSINESS = 'QnVzaW5lc3M6YQ==';

function createContext(parameters: IDataObject, responses: unknown[]) {
	const request = vi.fn();
	for (const response of responses) request.mockResolvedValueOnce(response);
	const all: IDataObject = {
		authentication: 'accessToken',
		resource: 'customer',
		operation: 'upsert',
		businessId: { __rl: true, mode: 'id', value: BUSINESS },
		matchBy: 'email',
		additionalFields: {},
		...parameters,
	};
	const context = {
		getInputData: () => [{ json: {} }],
		getNode: () => node,
		continueOnFail: () => false,
		getNodeParameter: (
			name: string,
			_index: number,
			fallback?: unknown,
			options?: { extractValue?: boolean },
		) => {
			const value = name in all ? all[name] : fallback;
			if (options?.extractValue && value && typeof value === 'object' && '__rl' in value) {
				return (value as INodeParameterResourceLocator).value;
			}
			return value;
		},
		helpers: { httpRequestWithAuthentication: request },
	} as unknown as IExecuteFunctions;
	return { context, request };
}

const page = (nodes: IDataObject[]) => ({
	data: {
		business: {
			customers: {
				pageInfo: { currentPage: 1, totalPages: 1, totalCount: nodes.length },
				edges: nodes.map((n) => ({ node: n })),
			},
		},
	},
});
const created = { data: { customerCreate: { didSucceed: true, customer: { id: 'new' } } } };
const patched = { data: { customerPatch: { didSucceed: true, customer: { id: 'c1' } } } };

const variablesOf = (request: ReturnType<typeof vi.fn>, call: number) =>
	(request.mock.calls[call][1] as { body: { variables: IDataObject } }).body.variables;

async function run(context: IExecuteFunctions) {
	const [output] = await new Wave().execute.call(context);
	return output.map((item) => item.json);
}

describe('customer create or update', () => {
	it('creates the customer when none matches by email', async () => {
		const { context, request } = createContext(
			{ name: 'Ada', additionalFields: { email: ' ada@example.com ', phone: '' } },
			[page([]), created],
		);
		expect(await run(context)).toEqual([{ id: 'new' }]);
		expect(variablesOf(request, 0)).toMatchObject({ email: 'ada@example.com' });
		expect(variablesOf(request, 1).input).toEqual({
			businessId: BUSINESS,
			name: 'Ada',
			email: ' ada@example.com ',
		});
	});

	it('patches the one match and does not send empty fields', async () => {
		const { context, request } = createContext(
			{ name: 'Ada', additionalFields: { email: 'ada@example.com', phone: '', mobile: '555' } },
			[page([{ id: 'c1', name: 'Old', displayId: null }]), patched],
		);
		expect(await run(context)).toEqual([{ id: 'c1' }]);
		expect(variablesOf(request, 1).input).toEqual({
			id: 'c1',
			name: 'Ada',
			email: 'ada@example.com',
			mobile: '555',
		});
	});

	it('fails with the IDs when many customers match', async () => {
		const { context } = createContext(
			{ name: 'Ada', additionalFields: { email: 'a@example.com' } },
			[page([{ id: 'c1' }, { id: 'c2' }])],
		);
		await expect(run(context)).rejects.toThrow('Matching IDs: c1, c2');
	});

	it('fails when the match value is empty', async () => {
		const email = createContext({ name: 'Ada' }, []);
		await expect(run(email.context)).rejects.toThrow('Set the Email');
		expect(email.request).not.toHaveBeenCalled();
		const displayId = createContext({ name: 'Ada', matchBy: 'displayId' }, []);
		await expect(run(displayId.context)).rejects.toThrow('Set the Display ID');
	});

	it('matches the name without case and outer spaces by scanning', async () => {
		const customers = [
			{ id: 'c0', name: 'Other', displayId: null },
			{ id: 'c1', name: '  ADA  ', displayId: null },
		];
		const { context, request } = createContext({ name: ' ada ', matchBy: 'name' }, [
			page(customers),
			patched,
		]);
		await run(context);
		expect(variablesOf(request, 0).email).toBeNull();
		expect(variablesOf(request, 1).input).toMatchObject({ id: 'c1' });
	});

	it('matches the display ID exactly', async () => {
		const customers = [
			{ id: 'c0', name: 'A', displayId: 'x-1' },
			{ id: 'c1', name: 'B', displayId: 'X-1' },
		];
		const { context, request } = createContext(
			{ name: 'New', matchBy: 'displayId', additionalFields: { displayId: 'X-1' } },
			[page(customers), patched],
		);
		await run(context);
		expect(variablesOf(request, 1).input).toMatchObject({ id: 'c1', displayId: 'X-1' });

		const none = createContext(
			{ name: 'New', matchBy: 'displayId', additionalFields: { displayId: 'X-2' } },
			[page(customers), created],
		);
		expect(await run(none.context)).toEqual([{ id: 'new' }]);
	});
});
