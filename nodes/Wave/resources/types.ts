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

export interface ResourceModule {
	option: INodePropertyOptions;
	/** The first entry must be the resource's "operation" property. */
	description: INodeProperties[];
	operations: Record<string, OperationHandler>;
}
