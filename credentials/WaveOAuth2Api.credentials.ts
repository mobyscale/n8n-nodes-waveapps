import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

const DEFAULT_SCOPES = [
	'account:*',
	'business:*',
	'customer:*',
	'estimate:*',
	'invoice:*',
	'product:*',
	'sales_tax:*',
	'transaction:*',
	'user:*',
	'vendor:*',
	'checkout:*',
].join(' ');

export class WaveOAuth2Api implements ICredentialType {
	name = 'waveOAuth2Api';

	displayName = 'Wave OAuth2 API';

	icon: Icon = { light: 'file:../nodes/Wave/wave.svg', dark: 'file:../nodes/Wave/wave.dark.svg' };

	extends = ['oAuth2Api'];

	documentationUrl =
		'https://github.com/mobyscale/n8n-nodes-waveapps/blob/main/docs/credentials.md';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://api.waveapps.com/oauth2/authorize/',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://api.waveapps.com/oauth2/token/',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: DEFAULT_SCOPES,
			description:
				'Space-separated Wave OAuth scopes. The default gives full access. Webhook events are only sent for the scopes that the user grants.',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
