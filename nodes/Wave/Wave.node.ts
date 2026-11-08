import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import * as listSearch from './methods/listSearch';
import * as loadOptions from './methods/loadOptions';
import { resources } from './resources';
import { toExecutionData, toNodeError } from './shared/utils';

const resourceMap = new Map(resources.map((resource) => [resource.option.value, resource]));

export class Wave implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wave',
		name: 'wave',
		icon: { light: 'file:wave.svg', dark: 'file:wave.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with Wave accounting: customers, invoices, estimates, products and more',
		defaults: { name: 'Wave' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'waveApi',
				required: true,
				displayOptions: { show: { authentication: ['accessToken'] } },
			},
			{
				name: 'waveOAuth2Api',
				required: true,
				displayOptions: { show: { authentication: ['oAuth2'] } },
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Full Access Token', value: 'accessToken' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'accessToken',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: resources.map((resource) => resource.option),
				default: 'business',
			},
			...resources.flatMap((resource) => resource.description),
		],
	};

	methods = {
		listSearch,
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resourceName = this.getNodeParameter('resource', itemIndex) as string;
				const operationName = this.getNodeParameter('operation', itemIndex) as string;
				const handler = resourceMap.get(resourceName)?.operations[operationName];
				if (!handler) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operationName}" is not supported for "${resourceName}"`,
						{ itemIndex },
					);
				}
				const result = await handler.call(this, { itemIndex });
				returnData.push(...toExecutionData(result, itemIndex));
			} catch (error) {
				const nodeError = toNodeError(this.getNode(), error, itemIndex);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: nodeError.message }, pairedItem: { item: itemIndex } });
					continue;
				}
				throw nodeError;
			}
		}

		return [returnData];
	}
}
