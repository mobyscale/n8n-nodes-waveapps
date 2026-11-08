import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as listSearch from '../Wave/methods/listSearch';
import * as loadOptions from '../Wave/methods/loadOptions';
import { businessLocator, SIMPLIFY_DESCRIPTION } from '../Wave/shared/descriptions';
import { toNodeError } from '../Wave/shared/utils';
import { pollWave } from './poll';
import { filterProperties, resourceOptions } from './resources';

export class WaveTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wave Trigger',
		name: 'waveTrigger',
		icon: { light: 'file:../Wave/wave.svg', dark: 'file:../Wave/wave.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"] + ": " + $parameter["resource"]}}',
		description:
			'Starts the workflow when Wave customers, estimates, invoices, products, sales taxes or vendors are created or updated',
		defaults: { name: 'Wave Trigger' },
		polling: true,
		inputs: [],
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
			businessLocator(),
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: resourceOptions,
				default: 'invoice',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Created',
						value: 'created',
						description: 'Trigger when a record is created',
					},
					{
						name: 'Created or Updated',
						value: 'createdOrUpdated',
						description: 'Trigger when a record is created or changed',
					},
					{
						name: 'Updated',
						value: 'updated',
						description: 'Trigger when an existing record is changed',
					},
				],
				default: 'createdOrUpdated',
			},
			...filterProperties,
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Simplify',
						name: 'simplify',
						type: 'boolean',
						default: false,
						description: SIMPLIFY_DESCRIPTION,
					},
				],
			},
		],
	};

	methods = {
		listSearch,
		loadOptions,
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		try {
			return await pollWave.call(this);
		} catch (error) {
			throw toNodeError(this.getNode(), error, 0);
		}
	}
}
