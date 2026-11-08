import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class WaveWebhookApi implements ICredentialType {
	name = 'waveWebhookApi';

	displayName = 'Wave Webhook Secret API';

	icon: Icon = { light: 'file:icons/wave.svg', dark: 'file:icons/wave.dark.svg' };

	documentationUrl =
		'https://github.com/octanesoftware/n8n-nodes-waveapps/blob/main/docs/wave-webhook-trigger.md';

	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Secret',
			name: 'secret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'The signing secret of the webhook endpoint. Copy it from the Wave dashboard (Tools > Webhooks).',
		},
	];
}
