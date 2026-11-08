import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, sleep } from 'n8n-workflow';

export type WaveContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IPollFunctions
	| IHookFunctions
	| IWebhookFunctions;

export const WAVE_GRAPHQL_URL = 'https://gql.waveapps.com/graphql/public';
export const ACCESS_TOKEN_CREDENTIAL_TYPE = 'waveApi';
export const OAUTH2_CREDENTIAL_TYPE = 'waveOAuth2Api';

const RETRY_STATUS_CODES = new Set([429, 502, 503, 504]);
const MAX_RETRIES = 4;
const MAX_RETRY_DELAY_MS = 30_000;

export interface WaveGraphQLError {
	message: string;
	path?: Array<string | number>;
	extensions?: { code?: string; id?: string };
}

interface WaveGraphQLResponse<T> {
	data?: T | null;
	errors?: WaveGraphQLError[];
}

export interface WaveInputError {
	code?: string | null;
	message: string;
	path?: string[] | null;
}

export interface WaveMutationOutput {
	didSucceed: boolean;
	inputErrors?: WaveInputError[] | null;
}

export interface WaveRequestOptions {
	itemIndex?: number;
}

/** GraphQL error codes from Wave mapped to the HTTP code that n8n uses to word its error message. */
const ERROR_CODE_TO_HTTP: Record<string, string> = {
	UNAUTHENTICATED: '401',
	FORBIDDEN: '403',
	NOT_FOUND: '404',
	GRAPHQL_VALIDATION_FAILED: '400',
	BAD_USER_INPUT: '400',
	INTERNAL_SERVER_ERROR: '500',
};

function isExecuteContext(ctx: WaveContext): ctx is IExecuteFunctions {
	return 'getInputData' in ctx;
}

export function getCredentialType(ctx: WaveContext): string {
	let authentication: unknown;
	try {
		authentication = isExecuteContext(ctx)
			? ctx.getNodeParameter('authentication', 0, 'accessToken')
			: ctx.getNodeParameter('authentication', 'accessToken');
	} catch {
		authentication = 'accessToken';
	}
	return authentication === 'oAuth2' ? OAUTH2_CREDENTIAL_TYPE : ACCESS_TOKEN_CREDENTIAL_TYPE;
}

function getStatusCode(error: unknown): number | undefined {
	const candidate = error as {
		httpCode?: string;
		statusCode?: number;
		response?: { status?: number };
		cause?: { status?: number };
	};
	const code =
		candidate?.statusCode ??
		candidate?.response?.status ??
		candidate?.cause?.status ??
		Number(candidate?.httpCode);
	return Number.isFinite(code) ? Number(code) : undefined;
}

export function getRetryDelayMs(attempt: number): number {
	return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

async function postGraphQL<T>(
	ctx: WaveContext,
	credentialType: string,
	body: IDataObject,
): Promise<WaveGraphQLResponse<T>> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: WAVE_GRAPHQL_URL,
		body,
		json: true,
	};
	for (let attempt = 0; ; attempt++) {
		try {
			return (await ctx.helpers.httpRequestWithAuthentication.call(
				ctx,
				credentialType,
				options,
			)) as WaveGraphQLResponse<T>;
		} catch (error) {
			const status = getStatusCode(error);
			if (attempt >= MAX_RETRIES || status === undefined || !RETRY_STATUS_CODES.has(status)) {
				throw new NodeApiError(ctx.getNode(), error as JsonObject);
			}
			await sleep(getRetryDelayMs(attempt));
		}
	}
}

export function formatGraphQLErrors(errors: WaveGraphQLError[]): string {
	return errors
		.map((error) => {
			const details = [error.extensions?.code, error.extensions?.id && `id ${error.extensions.id}`]
				.filter(Boolean)
				.join(', ');
			const path = error.path?.length ? ` (at ${error.path.join('.')})` : '';
			return `${error.message}${path}${details ? ` [${details}]` : ''}`;
		})
		.join('\n');
}

/**
 * Sends a GraphQL operation to Wave. Wave reports most problems, including expired tokens,
 * in the `errors` list of an HTTP 200 response, so they are turned into node errors here.
 * n8n only refreshes OAuth2 tokens on an HTTP 401, so an UNAUTHENTICATED error with OAuth2
 * refreshes the token and sends the operation one more time.
 */
export async function waveRequest<T = IDataObject>(
	ctx: WaveContext,
	query: string,
	variables: IDataObject = {},
	options: WaveRequestOptions = {},
): Promise<T> {
	const credentialType = getCredentialType(ctx);
	const body: IDataObject = { query, variables };
	let response = await postGraphQL<T>(ctx, credentialType, body);

	if (
		credentialType === OAUTH2_CREDENTIAL_TYPE &&
		response.errors?.some((error) => error.extensions?.code === 'UNAUTHENTICATED') &&
		typeof ctx.helpers.refreshOAuth2Token === 'function'
	) {
		await ctx.helpers.refreshOAuth2Token.call(ctx, credentialType);
		response = await postGraphQL<T>(ctx, credentialType, body);
	}

	if (response.errors?.length) {
		const [first] = response.errors;
		throw new NodeApiError(ctx.getNode(), { errors: response.errors } as unknown as JsonObject, {
			message: first.message,
			description: formatGraphQLErrors(response.errors),
			httpCode: ERROR_CODE_TO_HTTP[first.extensions?.code ?? ''] ?? '500',
			itemIndex: options.itemIndex,
		});
	}
	if (!response.data) {
		throw new NodeApiError(ctx.getNode(), response as unknown as JsonObject, {
			message: 'Wave returned an empty response',
			itemIndex: options.itemIndex,
		});
	}
	return response.data;
}

export function formatInputErrors(inputErrors: WaveInputError[]): string {
	return inputErrors
		.map((error) => {
			const path = error.path?.filter((part) => part !== 'input').join('.');
			const code = error.code ? ` (${error.code})` : '';
			return `${path ? `${path}: ` : ''}${error.message}${code}`;
		})
		.join('\n');
}

/**
 * Sends a mutation and returns its output field. Wave reports validation problems as
 * `didSucceed: false` with `inputErrors`, which are turned into a node error.
 */
export async function waveMutation<T extends WaveMutationOutput>(
	ctx: WaveContext,
	mutation: string,
	field: string,
	input: IDataObject,
	options: WaveRequestOptions = {},
): Promise<T> {
	const data = await waveRequest<Record<string, T | null>>(ctx, mutation, { input }, options);
	const output = data[field];
	if (!output) {
		throw new NodeApiError(ctx.getNode(), data as unknown as JsonObject, {
			message: `Wave did not return a result for ${field}`,
			itemIndex: options.itemIndex,
		});
	}
	return assertMutationSucceeded(ctx, output, field, options);
}

/** Throws a node error with the input errors when a mutation output has `didSucceed: false`. */
export function assertMutationSucceeded<T extends WaveMutationOutput>(
	ctx: WaveContext,
	output: T,
	field: string,
	options: WaveRequestOptions = {},
): T {
	if (!output.didSucceed) {
		const inputErrors = output.inputErrors ?? [];
		throw new NodeApiError(ctx.getNode(), output as unknown as JsonObject, {
			message: inputErrors.length
				? `Wave rejected the request: ${inputErrors[0].message}`
				: `Wave could not complete ${field}`,
			description: formatInputErrors(inputErrors),
			httpCode: '400',
			itemIndex: options.itemIndex,
		});
	}
	return output;
}

export interface WaveConnection<TNode> {
	pageInfo: { currentPage: number; totalPages: number; totalCount?: number };
	edges: Array<{ node: TNode }>;
}

export interface WaveGetAllOptions extends WaveRequestOptions {
	/** Stop after this number of nodes. Undefined means all nodes. */
	limit?: number;
	pageSize?: number;
	/** The page to start from (1-based). */
	startPage?: number;
}

export const DEFAULT_PAGE_SIZE = 100;

/**
 * Reads a paged Wave connection. The query must declare `$page: Int!` and `$pageSize: Int!`,
 * and `getConnection` returns the connection object from the response data.
 */
export async function waveGetAll<TNode, TData = IDataObject>(
	ctx: WaveContext,
	query: string,
	variables: IDataObject,
	getConnection: (data: TData) => WaveConnection<TNode> | null | undefined,
	options: WaveGetAllOptions = {},
): Promise<TNode[]> {
	const { limit, itemIndex } = options;
	const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, limit ?? Infinity);
	const results: TNode[] = [];
	for (let page = options.startPage ?? 1; ; page++) {
		const data = await waveRequest<TData>(
			ctx,
			query,
			{ ...variables, page, pageSize },
			{ itemIndex },
		);
		const connection = getConnection(data);
		if (!connection) break;
		for (const edge of connection.edges) {
			results.push(edge.node);
			if (limit !== undefined && results.length >= limit) return results;
		}
		if (connection.pageInfo.currentPage >= connection.pageInfo.totalPages) break;
		if (connection.edges.length === 0) break;
	}
	return results;
}
