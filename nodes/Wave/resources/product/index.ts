import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	businessLocator,
	enumOptions,
	paginationFields,
	resourceLocator,
	showFor,
} from '../../shared/descriptions';
import { PAGE_INFO_FIELDS } from '../../shared/fields';
import { compactInput, getBusinessId, getLocatorValue, getResourceId } from '../../shared/utils';
import {
	waveGetAll,
	waveMutation,
	waveRequest,
	type WaveConnection,
	type WaveMutationOutput,
} from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'product';

export const PRODUCT_FIELDS = `
	id
	name
	description
	unitPrice
	isSold
	isBought
	isArchived
	incomeAccount { id name displayId }
	expenseAccount { id name displayId }
	defaultSalesTaxes { id name abbreviation rate }
	createdAt
	modifiedAt
`;

const incomeAccountField = resourceLocator({
	name: 'incomeAccountId',
	displayName: 'Income Account',
	searchMethod: 'searchIncomeAccounts',
	resourceLabel: 'income account',
	required: false,
	description: 'The income account of the product. Wave then marks the product as sold.',
});

const expenseAccountField = resourceLocator({
	name: 'expenseAccountId',
	displayName: 'Expense Account',
	searchMethod: 'searchExpenseAccounts',
	resourceLabel: 'expense account',
	required: false,
	description: 'The expense account of the product. Wave then marks the product as bought.',
});

const salesTaxesField: INodeProperties = {
	displayName: 'Default Sales Taxes',
	name: 'defaultSalesTaxes',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Sales Tax',
	default: {},
	description: 'The sales taxes that Wave adds to the product by default',
	options: [
		{
			displayName: 'Sales Tax',
			name: 'items',
			values: [
				resourceLocator({
					name: 'salesTaxId',
					displayName: 'Sales Tax',
					searchMethod: 'searchSalesTaxes',
					resourceLabel: 'sales tax',
				}),
			],
		},
	],
};

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
				description: 'Archive a product or service',
				action: 'Archive a product or service',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a product or service',
				action: 'Create a product or service',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a product or service',
				action: 'Get a product or service',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many products and services',
				action: 'Get many products and services',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a product or service',
				action: 'Update a product or service',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'productId',
		displayName: 'Product',
		searchMethod: 'searchProducts',
		resourceLabel: 'product',
		displayOptions: showFor(RESOURCE, ['get', 'update', 'archive']),
	}),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The name of the product or service',
	},
	{
		displayName: 'Unit Price',
		name: 'unitPrice',
		type: 'number',
		required: true,
		typeOptions: { numberPrecision: 5 },
		default: 0,
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The price per unit in the major currency unit, for example 12.50',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: [
			{ ...salesTaxesField },
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the product or service',
			},
			{
				...expenseAccountField,
				description:
					'The expense account of the product. Wave then marks the product as bought. Wave needs an income account, an expense account, or both.',
			},
			{
				...incomeAccountField,
				description:
					'The income account of the product. Wave then marks the product as sold. Wave needs an income account, an expense account, or both.',
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
					'Whether to return only archived products (true) or only active ones (false). Wave returns only active products when you do not set this filter.',
			},
			{
				displayName: 'Is Bought',
				name: 'isBought',
				type: 'boolean',
				default: true,
				description: 'Whether to return only products that the business buys (true) or does not buy (false)',
			},
			{
				displayName: 'Is Sold',
				name: 'isSold',
				type: 'boolean',
				default: true,
				description: 'Whether to return only products that the business sells (true) or does not sell (false)',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
				description: 'Return only products that changed after this date',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
				description: 'Return only products that changed before this date',
			},
		],
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'multiOptions',
		options: enumOptions('ProductSort'),
		default: [],
		displayOptions: showFor(RESOURCE, ['getAll']),
		description: 'The order of the results. The default is newest first.',
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
				...salesTaxesField,
				description:
					'The sales taxes that Wave adds to the product by default. This list replaces the current list. An empty list removes all default sales taxes.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the product or service',
			},
			{ ...expenseAccountField },
			{ ...incomeAccountField },
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the product or service',
			},
			{
				displayName: 'Unit Price',
				name: 'unitPrice',
				type: 'number',
				typeOptions: { numberPrecision: 5 },
				default: 0,
				description: 'The price per unit in the major currency unit',
			},
		],
	},
];

type ProductOutput = WaveMutationOutput & { product: IDataObject | null };

/** Turns the node fields of a product into the fields of ProductCreateInput or ProductPatchInput. */
export function buildProductFields(fields: IDataObject): IDataObject {
	const { defaultSalesTaxes, incomeAccountId, expenseAccountId, ...rest } = fields;
	const result: IDataObject = {
		...rest,
		incomeAccountId: getLocatorValue(incomeAccountId),
		expenseAccountId: getLocatorValue(expenseAccountId),
	};
	if (defaultSalesTaxes !== undefined) {
		const items = ((defaultSalesTaxes as IDataObject).items ?? []) as IDataObject[];
		result.defaultSalesTaxIds = items
			.map((item) => getLocatorValue(item.salesTaxId))
			.filter((id): id is string => id !== undefined);
	}
	return compactInput(result);
}

export const productResource: ResourceModule = {
	option: { name: 'Product / Service', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const input = {
				businessId,
				name: this.getNodeParameter('name', itemIndex) as string,
				unitPrice: String(this.getNodeParameter('unitPrice', itemIndex)),
				...buildProductFields(this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject),
			};
			const output = await waveMutation<ProductOutput>(
				this,
				`mutation($input: ProductCreateInput!) {
					productCreate(input: $input) {
						didSucceed
						inputErrors { code message path }
						product { ${PRODUCT_FIELDS} }
					}
				}`,
				'productCreate',
				input,
				{ itemIndex },
			);
			return output.product ?? {};
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const productId = getResourceId.call(this, 'productId', itemIndex);
			const data = await waveRequest<{ business: { product: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $productId: ID!) {
					business(id: $businessId) { product(id: $productId) { ${PRODUCT_FIELDS} } }
				}`,
				{ businessId, productId },
				{ itemIndex },
			);
			return data.business?.product ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			const sort = this.getNodeParameter('sort', itemIndex, []) as string[];
			return await waveGetAll<
				IDataObject,
				{ business: { products: WaveConnection<IDataObject> } | null }
			>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!, $sort: [ProductSort!]! = [CREATED_AT_DESC],
					$isSold: Boolean, $isBought: Boolean, $isArchived: Boolean,
					$modifiedAtAfter: DateTime, $modifiedAtBefore: DateTime
				) {
					business(id: $businessId) {
						products(
							page: $page, pageSize: $pageSize, sort: $sort, isSold: $isSold, isBought: $isBought,
							isArchived: $isArchived, modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${PRODUCT_FIELDS} } }
						}
					}
				}`,
				compactInput({
					businessId,
					...(sort.length > 0 ? { sort } : {}),
					isSold: filters.isSold,
					isBought: filters.isBought,
					// When the variable is left out, Wave returns only active products
					...('isArchived' in filters ? { isArchived: filters.isArchived } : {}),
					modifiedAtAfter: filters.modifiedAtAfter,
					modifiedAtBefore: filters.modifiedAtBefore,
				}),
				(data) => data.business?.products,
				{ limit, itemIndex },
			);
		},
		async update({ itemIndex }) {
			const productId = getResourceId.call(this, 'productId', itemIndex);
			const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			const input = {
				id: productId,
				...buildProductFields({
					...fields,
					...(fields.unitPrice !== undefined ? { unitPrice: String(fields.unitPrice) } : {}),
				}),
			};
			const output = await waveMutation<ProductOutput>(
				this,
				`mutation($input: ProductPatchInput!) {
					productPatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						product { ${PRODUCT_FIELDS} }
					}
				}`,
				'productPatch',
				input,
				{ itemIndex },
			);
			return output.product ?? {};
		},
		async archive({ itemIndex }) {
			const productId = getResourceId.call(this, 'productId', itemIndex);
			const output = await waveMutation<ProductOutput>(
				this,
				`mutation($input: ProductArchiveInput!) {
					productArchive(input: $input) {
						didSucceed
						inputErrors { code message path }
						product { ${PRODUCT_FIELDS} }
					}
				}`,
				'productArchive',
				{ id: productId },
				{ itemIndex },
			);
			return { success: true, id: productId, ...(output.product ? { product: output.product } : {}) };
		},
	},
};
