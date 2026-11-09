import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import {
	formatInputErrors,
	waveGetAll,
	waveMutation,
	waveRequest,
} from '../../nodes/Wave/transport';

const node = {
	id: '1',
	name: 'Wave',
	type: '@mobyscale/n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

function createContext(
	responses: unknown[],
	options: { authentication?: string; refresh?: () => Promise<unknown> } = {},
) {
	const request = vi.fn();
	for (const response of responses) {
		if (response instanceof Error) request.mockRejectedValueOnce(response);
		else request.mockResolvedValueOnce(response);
	}
	const refreshOAuth2Token = vi.fn(options.refresh ?? (async () => ({})));
	const context = {
		getInputData: () => [{ json: {} }],
		getNode: () => node,
		getNodeParameter: (name: string, _index: number, fallback: unknown) =>
			name === 'authentication' ? (options.authentication ?? 'accessToken') : fallback,
		helpers: { httpRequestWithAuthentication: request, refreshOAuth2Token },
	} as unknown as IExecuteFunctions;
	return { context, request, refreshOAuth2Token };
}

describe('waveRequest', () => {
	it('sends the query and variables and returns data', async () => {
		const { context, request } = createContext([{ data: { user: { id: 'u1' } } }]);
		const data = await waveRequest(context, 'query { user { id } }', { a: 1 });
		expect(data).toEqual({ user: { id: 'u1' } });
		expect(request).toHaveBeenCalledWith(
			'waveApi',
			expect.objectContaining({
				method: 'POST',
				url: 'https://gql.waveapps.com/graphql/public',
				body: { query: 'query { user { id } }', variables: { a: 1 } },
			}),
		);
	});

	it('turns GraphQL errors into a NodeApiError', async () => {
		const { context } = createContext([
			{
				data: { business: null },
				errors: [
					{
						message: "Business 'BAD_ID' could not be found.",
						path: ['business'],
						extensions: { code: 'NOT_FOUND', id: 'abc' },
					},
				],
			},
		]);
		const error = await waveRequest(context, 'query { business { id } }').catch((e) => e);
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.message).toContain('could not be found');
		expect(error.description).toContain('NOT_FOUND');
		expect(error.httpCode).toBe('404');
	});

	it('refreshes an OAuth2 token once when Wave reports UNAUTHENTICATED', async () => {
		const { context, request, refreshOAuth2Token } = createContext(
			[
				{
					data: { user: null },
					errors: [{ message: 'expired', extensions: { code: 'UNAUTHENTICATED' } }],
				},
				{ data: { user: { id: 'u1' } } },
			],
			{ authentication: 'oAuth2' },
		);
		const data = await waveRequest(context, 'query { user { id } }');
		expect(data).toEqual({ user: { id: 'u1' } });
		expect(refreshOAuth2Token).toHaveBeenCalledWith('waveOAuth2Api');
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('does not refresh for the access token credential', async () => {
		const { context, refreshOAuth2Token } = createContext([
			{ data: null, errors: [{ message: 'expired', extensions: { code: 'UNAUTHENTICATED' } }] },
		]);
		await expect(waveRequest(context, 'query { user { id } }')).rejects.toThrow('expired');
		expect(refreshOAuth2Token).not.toHaveBeenCalled();
	});

	it('retries rate limited requests', async () => {
		vi.useFakeTimers();
		const rateLimited = Object.assign(new Error('Too many requests'), { statusCode: 429 });
		const { context, request } = createContext([rateLimited, { data: { ok: true } }]);
		const promise = waveRequest(context, 'query { _ }');
		await vi.runAllTimersAsync();
		await expect(promise).resolves.toEqual({ ok: true });
		expect(request).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});
});

describe('waveMutation', () => {
	it('returns the output when the mutation succeeds', async () => {
		const { context } = createContext([
			{ data: { customerCreate: { didSucceed: true, inputErrors: [], customer: { id: 'c1' } } } },
		]);
		const output = await waveMutation(context, 'mutation', 'customerCreate', { name: 'A' });
		expect(output).toMatchObject({ customer: { id: 'c1' } });
	});

	it('turns input errors into a NodeApiError', async () => {
		const { context } = createContext([
			{
				data: {
					customerCreate: {
						didSucceed: false,
						inputErrors: [
							{ code: 'REQUIRED', message: 'This field is required.', path: ['input', 'name'] },
						],
					},
				},
			},
		]);
		const error = await waveMutation(context, 'mutation', 'customerCreate', {}).catch((e) => e);
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.message).toContain('This field is required.');
		expect(error.description).toBe('name: This field is required. (REQUIRED)');
	});

	it('formats input errors without a path', () => {
		expect(formatInputErrors([{ message: 'Bad', code: null, path: null }])).toBe('Bad');
	});
});

describe('waveGetAll', () => {
	const page = (currentPage: number, totalPages: number, ids: string[]) => ({
		data: {
			items: {
				pageInfo: { currentPage, totalPages },
				edges: ids.map((id) => ({ node: { id } })),
			},
		},
	});

	it('reads all pages', async () => {
		const { context, request } = createContext([page(1, 2, ['a', 'b']), page(2, 2, ['c'])]);
		const nodes = await waveGetAll(context, 'query', {}, (data: { items: never }) => data.items);
		expect(nodes).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
		expect(request.mock.calls[1][1].body.variables).toMatchObject({ page: 2 });
	});

	it('stops at the limit and uses it as the page size', async () => {
		const { context, request } = createContext([page(1, 5, ['a', 'b'])]);
		const nodes = await waveGetAll(context, 'query', {}, (data: { items: never }) => data.items, {
			limit: 2,
		});
		expect(nodes).toHaveLength(2);
		expect(request).toHaveBeenCalledTimes(1);
		expect(request.mock.calls[0][1].body.variables).toMatchObject({ page: 1, pageSize: 2 });
	});
});
