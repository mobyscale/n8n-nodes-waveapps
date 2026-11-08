import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

export interface OperationContext {
	itemIndex: number;
}

export type OperationResult = IDataObject | IDataObject[] | INodeExecutionData[];

export type OperationHandler = (
	this: IExecuteFunctions,
	context: OperationContext,
) => Promise<OperationResult>;

export interface BatchOperationContext {
	items: INodeExecutionData[];
}

/**
 * Gets all input items in one call, for operations that send one request for many items.
 * The handler sets pairedItem on each output item and handles continueOnFail itself.
 */
export type BatchOperationHandler = (
	this: IExecuteFunctions,
	context: BatchOperationContext,
) => Promise<INodeExecutionData[]>;

export interface ResourceModule {
	option: INodePropertyOptions;
	/** The first entry must be the resource's "operation" property. */
	description: INodeProperties[];
	operations: Record<string, OperationHandler>;
	batchOperations?: Record<string, BatchOperationHandler>;
}
