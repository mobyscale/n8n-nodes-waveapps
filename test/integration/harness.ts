import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INode,
	INodeExecutionData,
	INodeParameterResourceLocator,
} from 'n8n-workflow';
import { inject } from 'vitest';

import { Wave } from '../../nodes/Wave/Wave.node';
import { waveRequest } from '../../nodes/Wave/transport';

export interface IntegrationConfig {
	accessToken: string;
	/** The business that tests create records in. When empty, the first non-personal business. */
	businessId: string;
}

declare module 'vitest' {
	export interface ProvidedContext {
		integration: IntegrationConfig | null;
	}
}

export const config = inject('integration');
export const hasConfig = config !== null;

/** A prefix for every record that tests create, so leftovers are easy to find. */
export const TEST_PREFIX = 'n8n-test';

export function uniqueName(label: string): string {
	return `${TEST_PREFIX} ${label} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const node: INode = {
	id: 'integration',
	name: 'Wave',
	type: 'n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

async function httpRequestWithAuthentication(
	_credentialType: string,
	options: IHttpRequestOptions,
): Promise<unknown> {
	if (!config) throw new Error('Integration configuration is missing');
	const response = await fetch(options.url, {
		method: options.method ?? 'GET',
		headers: {
			Authorization: `Bearer ${config.accessToken}`,
			'Content-Type': 'application/json',
		},
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});
	const text = await response.text();
	if (!response.ok) {
		const error = new Error(`Request failed with status ${response.status}: ${text}`) as Error & {
			statusCode: number;
		};
		error.statusCode = response.status;
		throw error;
	}
	return JSON.parse(text);
}

function getParameter(
	parameters: IDataObject,
	name: string,
	fallback: unknown,
	extractValue: boolean,
) {
	const value = name in parameters ? parameters[name] : fallback;
	if (extractValue && value && typeof value === 'object' && '__rl' in (value as IDataObject)) {
		return (value as INodeParameterResourceLocator).value;
	}
	return value;
}

/** A resource locator value as the node UI produces it. */
export function rl(value: string, mode = 'id'): INodeParameterResourceLocator {
	return { __rl: true, mode, value };
}

const helpers = { httpRequestWithAuthentication };

/** A minimal n8n execution context. Parameters use the same shape as the node UI produces. */
export function createExecuteContext(
	parameters: IDataObject,
	items: INodeExecutionData[] = [{ json: {} }],
): IExecuteFunctions {
	const allParameters: IDataObject = { authentication: 'accessToken', ...parameters };
	return {
		getInputData: () => items,
		getNode: () => node,
		continueOnFail: () => false,
		getNodeParameter: (
			name: string,
			_itemIndex: number,
			fallback?: unknown,
			options?: { extractValue?: boolean },
		) => getParameter(allParameters, name, fallback, options?.extractValue ?? false),
		helpers,
	} as unknown as IExecuteFunctions;
}

export function createLoadOptionsContext(parameters: IDataObject = {}): ILoadOptionsFunctions {
	const allParameters: IDataObject = { authentication: 'accessToken', ...parameters };
	return {
		getNode: () => node,
		getNodeParameter: (name: string, fallback?: unknown) =>
			getParameter(allParameters, name, fallback, false),
		getCurrentNodeParameter: (name: string, options?: { extractValue?: boolean }) =>
			getParameter(allParameters, name, undefined, options?.extractValue ?? false),
		getCurrentNodeParameters: () => allParameters,
		helpers,
	} as unknown as ILoadOptionsFunctions;
}

/** Runs the Wave node with the given parameters and returns the JSON of the output items. */
export async function runNode(
	parameters: IDataObject,
	items?: INodeExecutionData[],
): Promise<IDataObject[]> {
	const context = createExecuteContext(parameters, items);
	const [output] = await new Wave().execute.call(context);
	return output.map((item) => item.json);
}

/** Sends a GraphQL operation directly, for test setup and cleanup. */
export async function graphql<T = IDataObject>(query: string, variables: IDataObject = {}) {
	return await waveRequest<T>(createExecuteContext({}), query, variables);
}

let testBusinessId: string | undefined;

/** The business that tests use. */
export async function getTestBusinessId(): Promise<string> {
	if (testBusinessId) return testBusinessId;
	if (config?.businessId) {
		testBusinessId = config.businessId;
		return testBusinessId;
	}
	const data = await graphql<{
		businesses: { edges: Array<{ node: { id: string; isPersonal: boolean } }> };
	}>('query { businesses(page: 1, pageSize: 50) { edges { node { id isPersonal } } } }');
	const business = data.businesses.edges.find((edge) => !edge.node.isPersonal);
	if (!business) throw new Error('The Wave account has no non-personal business for tests');
	testBusinessId = business.node.id;
	return testBusinessId;
}

/** Cleanup steps that run in reverse order, even when a step fails. */
export class Cleanup {
	private readonly steps: Array<{ label: string; run: () => Promise<unknown> }> = [];

	add(label: string, run: () => Promise<unknown>): void {
		this.steps.push({ label, run });
	}

	async run(): Promise<void> {
		const failures: string[] = [];
		for (const step of this.steps.reverse()) {
			try {
				await step.run();
			} catch (error) {
				failures.push(`${step.label}: ${(error as Error).message}`);
			}
		}
		this.steps.length = 0;
		if (failures.length) throw new Error(`Cleanup failed:\n${failures.join('\n')}`);
	}
}
