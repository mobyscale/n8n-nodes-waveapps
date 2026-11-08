import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { showFor } from './descriptions';

export type AfterCreateAction = 'draft' | 'approve' | 'approveMarkSent' | 'approveSend';
export type AfterCreateStep = 'approve' | 'markSent' | 'send';

const STEPS: Record<AfterCreateAction, AfterCreateStep[]> = {
	draft: [],
	approve: ['approve'],
	approveMarkSent: ['approve', 'markSent'],
	approveSend: ['approve', 'send'],
};

const STEP_NAMES: Record<AfterCreateStep, string> = {
	approve: 'Approve',
	markSent: 'Mark Sent',
	send: 'Send',
};

export function afterCreateSteps(action: unknown): AfterCreateStep[] {
	return STEPS[action as AfterCreateAction] ?? [];
}

/**
 * The "After Create" option and the send fields that belong to it. The fields are at the top
 * level so that they can depend on the option.
 */
export function afterCreateFields(
	resource: string,
	label: 'invoice' | 'estimate',
	sendOptions: INodeProperties[],
): INodeProperties[] {
	const onCreate = showFor(resource, ['create']);
	return [
		{
			displayName: 'After Create',
			name: 'afterCreate',
			type: 'options',
			default: 'draft',
			description: `What to do with the ${label} after Wave creates it. Wave rejects Mark Sent and Send on a draft, so these steps approve first.`,
			displayOptions: onCreate,
			options: [
				{
					name: 'Approve',
					value: 'approve',
					description: `Approve the ${label}`,
				},
				{
					name: 'Approve and Mark Sent',
					value: 'approveMarkSent',
					description: `Approve the ${label}, then mark it as sent without an email`,
				},
				{
					name: 'Approve and Send',
					value: 'approveSend',
					description: `Approve the ${label}, then send it by email`,
				},
				{
					name: 'Leave as Draft',
					value: 'draft',
					description: `Keep the ${label} as Wave creates it`,
				},
			],
		},
		{
			displayName: 'Send To',
			name: 'afterCreateTo',
			type: 'string',
			default: '',
			placeholder: 'e.g. name@example.com, other@example.com',
			description: `Email addresses that receive the ${label}. Separate many addresses with commas. Leave empty to use the email address of the customer.`,
			displayOptions: showFor(resource, ['create'], { afterCreate: ['approveSend'] }),
		},
		{
			displayName: 'Send Options',
			name: 'afterCreateSendOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: showFor(resource, ['create'], { afterCreate: ['approveSend'] }),
			options: sendOptions,
		},
	];
}

export interface AfterCreateRun {
	label: 'Invoice' | 'Estimate';
	id: string;
	action: unknown;
	/** Runs one step. A step that is not in the map is not allowed for the resource. */
	run: (step: AfterCreateStep) => Promise<unknown>;
	/** Reads the record again after the last step. */
	reload: () => Promise<IDataObject>;
}

/**
 * Runs the steps of "After Create" in order and returns the record as Wave has it at the end.
 * An error names the created record, so that the user does not create it a second time.
 */
export async function runAfterCreate(
	ctx: IExecuteFunctions,
	itemIndex: number,
	created: IDataObject,
	options: AfterCreateRun,
): Promise<IDataObject> {
	const steps = afterCreateSteps(options.action);
	if (steps.length === 0) return created;

	const lower = options.label.toLowerCase();
	for (const step of steps) {
		try {
			await options.run(step);
		} catch (error) {
			const cause = error as Error & { description?: string | null };
			throw new NodeOperationError(
				ctx.getNode(),
				`The ${lower} was created (ID ${options.id}), but the step "${STEP_NAMES[step]}" failed: ${cause.message}. Do not create the ${lower} again.`,
				{ itemIndex, description: cause.description ?? undefined },
			);
		}
	}
	try {
		return await options.reload();
	} catch (error) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The ${lower} was created (ID ${options.id}) and the steps finished, but reading it again failed: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}
