import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	addressFields,
	businessLocator,
	currencyField,
	enumOptions,
	paginationFields,
	resourceLocator,
	showFor,
} from '../../shared/descriptions';
import {
	ADDRESS_FIELDS,
	CURRENCY_FIELDS,
	MONEY_FIELDS,
	PAGE_INFO_FIELDS,
} from '../../shared/fields';
import {
	compactInput,
	getBusinessId,
	getRequiredString,
	getResourceId,
	toDateTime,
} from '../../shared/utils';
import {
	waveGetAll,
	waveMutation,
	waveRequest,
	type WaveConnection,
	type WaveMutationOutput,
} from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'customer';

export const CUSTOMER_FIELDS = `
	id
	name
	firstName
	lastName
	displayId
	email
	mobile
	phone
	fax
	tollFree
	website
	internalNotes
	address { ${ADDRESS_FIELDS} }
	currency { ${CURRENCY_FIELDS} }
	shippingDetails {
		name
		phone
		instructions
		address { ${ADDRESS_FIELDS} }
	}
	outstandingAmount { ${MONEY_FIELDS} }
	overdueAmount { ${MONEY_FIELDS} }
	isArchived
	isActive
	createdAt
	modifiedAt
`;

function customerFieldOptions(): INodeProperties[] {
	return [
		{
			displayName: 'Address',
			name: 'address',
			type: 'collection',
			placeholder: 'Add Address Field',
			default: {},
			options: addressFields,
		},
		currencyField({ description: 'The default currency of the customer' }),
		{ displayName: 'Display ID', name: 'displayId', type: 'string', default: '' },
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'name@email.com',
			default: '',
		},
		{ displayName: 'Fax', name: 'fax', type: 'string', default: '' },
		{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
		{
			displayName: 'Internal Notes',
			name: 'internalNotes',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
		},
		{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
		{ displayName: 'Mobile', name: 'mobile', type: 'string', default: '' },
		{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
		{
			displayName: 'Shipping Details',
			name: 'shippingDetails',
			type: 'collection',
			placeholder: 'Add Shipping Field',
			default: {},
			options: [
				{
					displayName: 'Address',
					name: 'address',
					type: 'collection',
					placeholder: 'Add Address Field',
					default: {},
					options: addressFields,
				},
				{
					displayName: 'Delivery Instructions',
					name: 'instructions',
					type: 'string',
					typeOptions: { rows: 3 },
					default: '',
				},
				{ displayName: 'Name', name: 'name', type: 'string', default: '' },
				{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
			],
		},
		{ displayName: 'Toll Free', name: 'tollFree', type: 'string', default: '' },
		{ displayName: 'Website', name: 'website', type: 'string', default: '' },
	];
}

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showFor(RESOURCE),
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a customer',
				action: 'Create a customer',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a customer',
				action: 'Delete a customer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a customer',
				action: 'Get a customer',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many customers of a business',
				action: 'Get many customers',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a customer',
				action: 'Update a customer',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'customerId',
		displayName: 'Customer',
		searchMethod: 'searchCustomers',
		resourceLabel: 'customer',
		description: 'The customer to work with',
		displayOptions: showFor(RESOURCE, ['get', 'update', 'delete']),
	}),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name or business name of the customer',
		displayOptions: showFor(RESOURCE, ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['create']),
		options: customerFieldOptions(),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor(RESOURCE, ['update']),
		options: [
			...customerFieldOptions(),
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
		].sort((a, b) => a.displayName.localeCompare(b.displayName)),
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
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Only return customers with this email address',
			},
			{
				displayName: 'Is Archived',
				name: 'isArchived',
				type: 'boolean',
				default: false,
				description: 'Whether to return only archived customers (true) or only active ones (false)',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return customers that were modified after this date',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
				description: 'Only return customers that were modified before this date',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: showFor(RESOURCE, ['getAll']),
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: enumOptions('CustomerSort'),
				default: 'NAME_ASC',
				description: 'The order of the customers',
			},
		],
	},
];

type CustomerOutput = WaveMutationOutput & { customer?: IDataObject | null };

export const customerResource: ResourceModule = {
	option: { name: 'Customer', value: RESOURCE },
	description,
	operations: {
		async create({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const name = getRequiredString.call(this, 'name', itemIndex);
			const fields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
			const output = await waveMutation<CustomerOutput>(
				this,
				`mutation($input: CustomerCreateInput!) {
					customerCreate(input: $input) {
						didSucceed
						inputErrors { code message path }
						customer { ${CUSTOMER_FIELDS} }
					}
				}`,
				'customerCreate',
				{ businessId, name, ...compactInput(fields) },
				{ itemIndex },
			);
			return output.customer ?? {};
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getResourceId.call(this, 'customerId', itemIndex, 'Customer');
			const data = await waveRequest<{ business: { customer: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $id: ID!) {
					business(id: $businessId) { customer(id: $id) { ${CUSTOMER_FIELDS} } }
				}`,
				{ businessId, id },
				{ itemIndex },
			);
			return data.business?.customer ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
			return await waveGetAll<
				IDataObject,
				{ business: { customers: WaveConnection<IDataObject> } | null }
			>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!, $sort: [CustomerSort!]!,
					$email: String, $isArchived: Boolean, $modifiedAtAfter: DateTime, $modifiedAtBefore: DateTime
				) {
					business(id: $businessId) {
						customers(
							page: $page, pageSize: $pageSize, sort: $sort, email: $email,
							isArchived: $isArchived, modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${CUSTOMER_FIELDS} } }
						}
					}
				}`,
				{
					businessId,
					sort: [(options.sort as string | undefined) ?? 'NAME_ASC'],
					email: (filters.email as string | undefined) || null,
					isArchived: filters.isArchived ?? null,
					modifiedAtAfter: toDateTime(filters.modifiedAtAfter) ?? null,
					modifiedAtBefore: toDateTime(filters.modifiedAtBefore) ?? null,
				},
				(data) => data.business?.customers,
				{ limit, itemIndex },
			);
		},
		async update({ itemIndex }) {
			const id = getResourceId.call(this, 'customerId', itemIndex, 'Customer');
			const fields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			const output = await waveMutation<CustomerOutput>(
				this,
				`mutation($input: CustomerPatchInput!) {
					customerPatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						customer { ${CUSTOMER_FIELDS} }
					}
				}`,
				'customerPatch',
				{ id, ...compactInput(fields) },
				{ itemIndex },
			);
			return output.customer ?? {};
		},
		async delete({ itemIndex }) {
			const id = getResourceId.call(this, 'customerId', itemIndex, 'Customer');
			await waveMutation(
				this,
				`mutation($input: CustomerDeleteInput!) {
					customerDelete(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'customerDelete',
				{ id },
				{ itemIndex },
			);
			return { success: true, id };
		},
	},
};
