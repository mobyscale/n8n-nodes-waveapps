import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	businessLocator,
	paginationFields,
	resourceLocator,
	showFor,
	simplifyField,
} from '../../shared/descriptions';
import { PAGE_INFO_FIELDS } from '../../shared/fields';
import { compactInput, getBusinessId, getResourceId, toDate } from '../../shared/utils';
import {
	waveGetAll,
	waveMutation,
	waveRequest,
	type WaveConnection,
	type WaveMutationOutput,
} from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'salesTax';

export const SALES_TAX_FIELDS = `
	id
	name
	abbreviation
	description
	taxNumber
	showTaxNumberOnInvoices
	rate
	rates { effective rate }
	isCompound
	isRecoverable
	isArchived
	createdAt
	modifiedAt
`;

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Archive',
				value: 'archive',
				description: 'Archive a sales tax',
				action: 'Archive a sales tax',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a sales tax',
				action: 'Create a sales tax',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a sales tax',
				action: 'Get a sales tax',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many sales taxes',
				action: 'Get many sales taxes',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a sales tax',
				action: 'Update a sales tax',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'salesTaxId',
		displayName: 'Sales Tax',
		searchMethod: 'searchSalesTaxes',
		resourceLabel: 'sales tax',
		displayOptions: showFor(RESOURCE, ['get', 'update', 'archive']),
	}),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The name of the sales tax',
	},
	{
		displayName: 'Abbreviation',
		name: 'abbreviation',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor(RESOURCE, ['create']),
		description:
			'A short code for the sales tax. It has at most 10 characters and must be unique in the business.',
	},
	{
		displayName: 'Rate',
		name: 'rate',
		type: 'number',
		required: true,
		typeOptions: { numberPrecision: 6, minValue: 0 },
		default: 0,
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The tax rate as a decimal. For example, 0.15 is 15%.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the sales tax',
			},
			{
				displayName: 'Is Compound',
				name: 'isCompound',
				type: 'boolean',
				default: false,
				description:
					'Whether Wave calculates this tax on top of the subtotal and the other taxes (a stacked tax)',
			},
			{
				displayName: 'Is Recoverable',
				name: 'isRecoverable',
				type: 'boolean',
				default: false,
				description: 'Whether you can deduct the tax that you paid from the tax that you collected',
			},
			{
				displayName: 'Show Tax Number on Invoices',
				name: 'showTaxNumberOnInvoices',
				type: 'boolean',
				default: false,
				description: 'Whether to show the tax number beside the tax name on an invoice',
			},
			{
				displayName: 'Tax Number',
				name: 'taxNumber',
				type: 'string',
				default: '',
				description: 'The identification number from the tax authority',
			},
		],
	},
	...paginationFields(showFor(RESOURCE, ['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor(RESOURCE, ['getAll']),
		options: [
			{
				displayName: 'Is Archived',
				name: 'isArchived',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only archived sales taxes (true) or only active ones (false). Wave returns only active sales taxes when you do not set this filter.',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
				description: 'Return only sales taxes that changed after this date',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
				description: 'Return only sales taxes that changed before this date',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['update']),
		options: [
			{
				displayName: 'Abbreviation',
				name: 'abbreviation',
				type: 'string',
				default: '',
				description: 'A short code for the sales tax. It has at most 10 characters.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the sales tax',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the sales tax',
			},
			{
				displayName: 'Rate',
				name: 'rate',
				type: 'number',
				typeOptions: { numberPrecision: 6, minValue: 0 },
				default: 0,
				description:
					'The new tax rate as a decimal. For example, 0.15 is 15%. The rate applies from the effective date.',
			},
			{
				displayName: 'Rate Effective Date',
				name: 'rateEffective',
				type: 'dateTime',
				default: '',
				description:
					'The date from which the new rate applies. The default is today. Only used with Rate.',
			},
			{
				displayName: 'Show Tax Number on Invoices',
				name: 'showTaxNumberOnInvoices',
				type: 'boolean',
				default: false,
				description: 'Whether to show the tax number beside the tax name on an invoice',
			},
			{
				displayName: 'Tax Number',
				name: 'taxNumber',
				type: 'string',
				default: '',
				description: 'The identification number from the tax authority',
			},
		],
	},
];

type SalesTaxOutput = WaveMutationOutput & { salesTax: IDataObject | null };

/** Formats a date or date-time value as the YYYY-MM-DD date that Wave expects. */
export function toDateString(value: unknown, today: Date = new Date()): string {
	return toDate(value) ?? today.toISOString().slice(0, 10);
}

/**
 * Wave adds the rates of a patch to the rate history. The history of a new tax starts at
 * 0001-01-01, so it must not be sent again. Wave rejects a date that already has a rate.
 */
export function buildRateInput(
	effective: unknown,
	rate: string | number,
	today?: Date,
): Array<{ effective: string; rate: string }> {
	return [{ effective: toDateString(effective, today), rate: String(rate) }];
}

export const salesTaxResource: ResourceModule = {
	option: { name: 'Sales Tax', value: RESOURCE },
	description: [...description, simplifyField(RESOURCE, ['get', 'getAll'])],
	operations: {
		async create({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const input = compactInput({
				businessId,
				name: this.getNodeParameter('name', itemIndex) as string,
				abbreviation: this.getNodeParameter('abbreviation', itemIndex) as string,
				rate: String(this.getNodeParameter('rate', itemIndex)),
				...(this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject),
			});
			const output = await waveMutation<SalesTaxOutput>(
				this,
				`mutation($input: SalesTaxCreateInput!) {
					salesTaxCreate(input: $input) {
						didSucceed
						inputErrors { code message path }
						salesTax { ${SALES_TAX_FIELDS} }
					}
				}`,
				'salesTaxCreate',
				input,
				{ itemIndex },
			);
			return output.salesTax ?? {};
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const salesTaxId = getResourceId.call(this, 'salesTaxId', itemIndex);
			const data = await waveRequest<{ business: { salesTax: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $salesTaxId: ID!) {
					business(id: $businessId) { salesTax(id: $salesTaxId) { ${SALES_TAX_FIELDS} } }
				}`,
				{ businessId, salesTaxId },
				{ itemIndex },
			);
			return data.business?.salesTax ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			return await waveGetAll<
				IDataObject,
				{ business: { salesTaxes: WaveConnection<IDataObject> } | null }
			>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!, $isArchived: Boolean,
					$modifiedAtAfter: DateTime, $modifiedAtBefore: DateTime
				) {
					business(id: $businessId) {
						salesTaxes(
							page: $page, pageSize: $pageSize, isArchived: $isArchived,
							modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${SALES_TAX_FIELDS} } }
						}
					}
				}`,
				compactInput({
					businessId,
					// When the variable is left out, Wave returns only active sales taxes
					...('isArchived' in filters ? { isArchived: filters.isArchived } : {}),
					modifiedAtAfter: filters.modifiedAtAfter,
					modifiedAtBefore: filters.modifiedAtBefore,
				}),
				(data) => data.business?.salesTaxes,
				{ limit, itemIndex },
			);
		},
		async update({ itemIndex }) {
			const salesTaxId = getResourceId.call(this, 'salesTaxId', itemIndex);
			const { rate, rateEffective, ...fields } = this.getNodeParameter(
				'updateFields',
				itemIndex,
				{},
			) as IDataObject;
			const input: IDataObject = { id: salesTaxId, ...fields };
			if (rate !== undefined) {
				input.rates = buildRateInput(rateEffective, rate as number);
			}
			const output = await waveMutation<SalesTaxOutput>(
				this,
				`mutation($input: SalesTaxPatchInput!) {
					salesTaxPatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						salesTax { ${SALES_TAX_FIELDS} }
					}
				}`,
				'salesTaxPatch',
				compactInput(input),
				{ itemIndex },
			);
			return output.salesTax ?? {};
		},
		async archive({ itemIndex }) {
			const salesTaxId = getResourceId.call(this, 'salesTaxId', itemIndex);
			const output = await waveMutation<SalesTaxOutput>(
				this,
				`mutation($input: SalesTaxArchiveInput!) {
					salesTaxArchive(input: $input) {
						didSucceed
						inputErrors { code message path }
						salesTax { ${SALES_TAX_FIELDS} }
					}
				}`,
				'salesTaxArchive',
				{ id: salesTaxId },
				{ itemIndex },
			);
			return {
				success: true,
				id: salesTaxId,
				...(output.salesTax ? { salesTax: output.salesTax } : {}),
			};
		},
	},
};
