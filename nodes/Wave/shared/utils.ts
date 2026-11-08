import type {
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeParameterResourceLocator,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { toBusinessId, toWaveId, type WaveIdType } from './ids';

export function toExecutionData(
	data: IDataObject | IDataObject[] | INodeExecutionData[],
	itemIndex: number,
): INodeExecutionData[] {
	const entries = Array.isArray(data) ? data : [data];
	return entries.map((entry) => {
		const isExecutionData =
			typeof entry === 'object' &&
			entry !== null &&
			'json' in entry &&
			typeof entry.json === 'object';
		const executionData = (isExecutionData ? entry : { json: entry }) as INodeExecutionData;
		return { ...executionData, pairedItem: { item: itemIndex } };
	});
}

export function toNodeError(
	node: INode,
	error: unknown,
	itemIndex: number,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		if (error.context.itemIndex === undefined) error.context.itemIndex = itemIndex;
		return error;
	}
	return new NodeOperationError(node, error as Error, { itemIndex });
}

/** Reads a string, or the value of a resource locator, and fails when it is empty. */
export function getRequiredString(
	this: IExecuteFunctions,
	name: string,
	itemIndex: number,
): string {
	const raw = this.getNodeParameter(name, itemIndex, '', { extractValue: true }) as
		| string
		| INodeParameterResourceLocator;
	const value = String(typeof raw === 'object' && raw !== null ? raw.value : (raw ?? '')).trim();
	if (!value) {
		throw new NodeOperationError(this.getNode(), `The parameter "${name}" is required`, {
			itemIndex,
		});
	}
	return value;
}

export function getBusinessId(this: IExecuteFunctions, itemIndex: number): string {
	return toBusinessId(getRequiredString.call(this, 'businessId', itemIndex));
}

/**
 * Reads a resource ID parameter. A raw webhook ID of a documented type is converted to the API
 * ID with the business ID of the same item.
 */
export function getResourceId(
	this: IExecuteFunctions,
	name: string,
	itemIndex: number,
	type?: WaveIdType,
): string {
	const value = getRequiredString.call(this, name, itemIndex);
	if (!type) return value;
	const businessId = this.getNodeParameter('businessId', itemIndex, '', {
		extractValue: true,
	}) as string;
	return toWaveId(type, value, businessId || undefined);
}

/**
 * Removes undefined values, empty strings and empty objects so that optional fields the user
 * did not set are not sent to Wave (sending null clears a value on patch mutations).
 */
export function compactInput<T extends IDataObject>(input: T): T {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === '') continue;
		if (
			value !== null &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			Object.keys(compactInput(value as IDataObject)).length === 0
		) {
			continue;
		}
		result[key] =
			value !== null && typeof value === 'object' && !Array.isArray(value)
				? compactInput(value as IDataObject)
				: value;
	}
	return result as T;
}

/** Returns a resource locator value from a nested collection field. */
export function getLocatorValue(value: unknown): string | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'object' && 'value' in (value as IDataObject)) {
		const inner = (value as INodeParameterResourceLocator).value;
		return inner === '' || inner === undefined || inner === null ? undefined : String(inner);
	}
	return String(value);
}

/** Turns a date or date time value from a node parameter into an ISO 8601 string with a time zone. */
export function toDateTime(value: unknown): string | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}
