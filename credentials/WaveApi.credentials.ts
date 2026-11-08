import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WaveApi implements ICredentialType {
	name = 'waveApi';

	displayName = 'Wave API';

	icon: Icon = { light: 'file:../nodes/Wave/wave.svg', dark: 'file:../nodes/Wave/wave.dark.svg' };

	documentationUrl =
		'https://github.com/octanesoftware/n8n-nodes-waveapps/blob/main/docs/credentials.md';

	properties: INodeProperties[] = [
		{
			displayName: 'Full Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'A full access token from the Wave developer portal (Manage Applications). It gives access to all businesses of the Wave user that made it.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	// Wave returns authentication errors with HTTP status 200, so the rule checks the body.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://gql.waveapps.com',
			url: '/graphql/public',
			method: 'POST',
			body: { query: 'query { user { id } }' },
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errors[0].extensions.code',
					value: 'UNAUTHENTICATED',
					message: 'The access token is not valid or has expired',
				},
			},
		],
	};
}
