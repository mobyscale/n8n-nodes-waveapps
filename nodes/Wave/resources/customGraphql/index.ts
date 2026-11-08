import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { showFor } from '../../shared/descriptions';
import { assertMutationSucceeded, waveRequest, type WaveMutationOutput } from '../../transport';
import type { OperationResult, ResourceModule } from '../types';

const RESOURCE = 'customGraphql';

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Execute',
				value: 'execute',
				description: 'Send a GraphQL query or mutation to the Wave API',
				action: 'Execute a query or mutation',
			},
		],
		default: 'execute',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: { rows: 10 },
		required: true,
		default: '',
		placeholder: 'query { user { firstName lastName } }',
		description:
			'The GraphQL query or mutation. Put values in Variables, not in the query text. See the <a href="https://developer.waveapps.com/">Wave developer portal</a>.',
		displayOptions: showFor(RESOURCE, ['execute']),
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'json',
		default: '{}',
		description: 'The GraphQL variables as a JSON object',
		displayOptions: showFor(RESOURCE, ['execute']),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['execute']),
		options: [
			{
				displayName: 'Return Mutation Output Only',
				name: 'returnMutationOutputOnly',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only the value of the first field in the response data. When that value has "didSucceed: false", the node fails with the input errors from Wave.',
			},
		],
	},
];

export function parseVariables(
	this: IExecuteFunctions,
	raw: unknown,
	itemIndex: number,
): IDataObject {
	let value = raw;
	if (typeof raw === 'string') {
		if (!raw.trim()) return {};
		try {
			value = JSON.parse(raw);
		} catch {
			throw new NodeOperationError(this.getNode(), 'Variables must be valid JSON', { itemIndex });
		}
	}
	if (value === null || value === undefined) return {};
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new NodeOperationError(this.getNode(), 'Variables must be a JSON object', { itemIndex });
	}
	return value as IDataObject;
}

/** Returns the value of the first field of the response data, as for a Wave mutation. */
export function unwrapFirstField(
	this: IExecuteFunctions,
	data: IDataObject,
	itemIndex: number,
): OperationResult {
	const [field] = Object.keys(data);
	if (!field) return {};
	const output = data[field];
	if (output !== null && typeof output === 'object' && !Array.isArray(output)) {
		if ('didSucceed' in output) {
			assertMutationSucceeded(this, output as unknown as WaveMutationOutput, field, { itemIndex });
		}
		return output as IDataObject;
	}
	if (
		Array.isArray(output) &&
		output.every((entry) => entry !== null && typeof entry === 'object')
	) {
		return output as IDataObject[];
	}
	return { [field]: output } as IDataObject;
}

export const customGraphqlResource: ResourceModule = {
	option: { name: 'Custom GraphQL', value: RESOURCE },
	description,
	operations: {
		async execute({ itemIndex }) {
			const query = String(this.getNodeParameter('query', itemIndex, '')).trim();
			if (!query) {
				throw new NodeOperationError(this.getNode(), 'Enter a GraphQL query', { itemIndex });
			}
			const variables = parseVariables.call(
				this,
				this.getNodeParameter('variables', itemIndex, '{}'),
				itemIndex,
			);
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
			const data = await waveRequest<IDataObject>(this, query, variables, { itemIndex });
			return options.returnMutationOutputOnly ? unwrapFirstField.call(this, data, itemIndex) : data;
		},
	},
};
