import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../shared/descriptions';
import { waveRequest } from '../../transport';
import type { ResourceModule } from '../types';

const RESOURCE = 'user';

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Get Current',
				value: 'getCurrent',
				description: 'Get the Wave user of the credential',
				action: 'Get the current user',
			},
			{
				name: 'Get OAuth Application',
				value: 'getOAuthApplication',
				description: 'Get the OAuth application that the credential belongs to',
				action: 'Get the connected application',
			},
		],
		default: 'getCurrent',
	},
];

export const userResource: ResourceModule = {
	option: { name: 'User', value: RESOURCE },
	description,
	operations: {
		async getCurrent({ itemIndex }) {
			const data = await waveRequest<{ user: IDataObject | null }>(
				this,
				'query { user { id defaultEmail firstName lastName createdAt modifiedAt } }',
				{},
				{ itemIndex },
			);
			return data.user ?? {};
		},
		async getOAuthApplication({ itemIndex }) {
			const data = await waveRequest<{ oAuthApplication: IDataObject | null }>(
				this,
				'query { oAuthApplication { id name description clientId logoUrl extraData createdAt modifiedAt } }',
				{},
				{ itemIndex },
			);
			return data.oAuthApplication ?? {};
		},
	},
};
