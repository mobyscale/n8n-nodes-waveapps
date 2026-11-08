import type {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IHookFunctions,
	INodeCredentialTestResult,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { eventOptions } from './payload';
import { handleWebhook } from './webhook';

export class WaveWebhookTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wave Webhook Trigger',
		name: 'waveWebhookTrigger',
		icon: { light: 'file:wave.svg', dark: 'file:wave.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].length ? $parameter["events"].join(", ") : "All events"}}',
		description:
			'Starts the workflow when Wave sends an invoice, estimate or checkout webhook event',
		defaults: { name: 'Wave Webhook Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'waveWebhookApi',
				required: true,
				testedBy: 'testWebhookSecret',
				displayOptions: { show: { verifySignature: [true] } },
			},
			{
				name: 'waveApi',
				required: true,
				displayOptions: { show: { fetchFullRecord: [true], authentication: ['accessToken'] } },
			},
			{
				name: 'waveOAuth2Api',
				required: true,
				displayOptions: { show: { fetchFullRecord: [true], authentication: ['oAuth2'] } },
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Wave cannot register webhooks through its API, so you register this node in the Wave dashboard: 1. Activate the workflow and copy the Production URL from "Webhook URLs" above. Wave must reach it over HTTPS. 2. In Wave, open Tools > Webhooks for your OAuth application, paste the URL and select the events. Wave allows one URL for each application. 3. Copy the signing secret into a "Wave Webhook Secret API" credential. Wave sends events only for businesses with an active Pro subscription that connected the application through OAuth2 with the scopes of the events.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to check the x-wave-signature header with the webhook secret. Requests with a signature that is not valid get HTTP 401 and do not start the workflow.',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: eventOptions,
				default: [],
				description:
					'The events that start the workflow. Leave empty for all events. Wave only sends the events that you select in the Wave dashboard.',
			},
			{
				displayName: 'Add API IDs',
				name: 'addApiIds',
				type: 'boolean',
				default: true,
				description:
					'Whether to add an "apiIds" object with the Wave API IDs of the business, invoice, estimate, customer and checkout. The Wave node can use these IDs directly.',
			},
			{
				displayName: 'Fetch Full Record',
				name: 'fetchFullRecord',
				type: 'boolean',
				default: false,
				description:
					'Whether to load the invoice or the estimate of the event through the Wave API and add it as "record". This needs a Wave API credential.',
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Full Access Token', value: 'accessToken' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'oAuth2',
				displayOptions: { show: { fetchFullRecord: [true] } },
			},
		],
	};

	methods = {
		credentialTest: {
			async testWebhookSecret(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				return testWebhookSecret(credential);
			},
		},
	};

	// Wave has no API to register webhooks. The user registers the URL in the Wave dashboard,
	// so there is nothing to check, create or delete.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return await handleWebhook.call(this);
	}
}

/** Wave has no endpoint to check a webhook secret, so the test only checks that it is set. */
export function testWebhookSecret(credential: ICredentialsDecrypted): INodeCredentialTestResult {
	const secret = credential.data?.secret;
	if (typeof secret !== 'string' || !secret.trim()) {
		return { status: 'Error', message: 'Enter the webhook secret from the Wave dashboard' };
	}
	return { status: 'OK', message: 'The secret is set. Wave events will show if it is correct.' };
}
