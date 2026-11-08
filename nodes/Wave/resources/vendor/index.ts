import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	businessLocator,
	paginationFields,
	resourceLocator,
	showFor,
	simplifyField,
} from '../../shared/descriptions';
import { ADDRESS_FIELDS, CURRENCY_FIELDS, PAGE_INFO_FIELDS } from '../../shared/fields';
import { getBusinessId, getResourceId, toDateTime } from '../../shared/utils';
import { waveGetAll, waveRequest, type WaveConnection } from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'vendor';

export const VENDOR_FIELDS = `
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
				name: 'Get',
				value: 'get',
				description: 'Get a vendor',
				action: 'Get a vendor',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many vendors of a business',
				action: 'Get many vendors',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'vendorId',
		displayName: 'Vendor',
		searchMethod: 'searchVendors',
		resourceLabel: 'vendor',
		description: 'The vendor to get',
		displayOptions: showFor(RESOURCE, ['get']),
	}),
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
				description: 'Only return vendors with this email address',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAtAfter',
				type: 'dateTime',
				default: '',
				description: 'Only return vendors that were modified after this date',
			},
			{
				displayName: 'Modified Before',
				name: 'modifiedAtBefore',
				type: 'dateTime',
				default: '',
				description: 'Only return vendors that were modified before this date',
			},
		],
	},
];

export const vendorResource: ResourceModule = {
	option: { name: 'Vendor', value: RESOURCE },
	description: [...description, simplifyField(RESOURCE, ['get', 'getAll'])],
	operations: {
		async get({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const id = getResourceId.call(this, 'vendorId', itemIndex);
			const data = await waveRequest<{ business: { vendor: IDataObject | null } | null }>(
				this,
				`query($businessId: ID!, $id: ID!) {
					business(id: $businessId) { vendor(id: $id) { ${VENDOR_FIELDS} } }
				}`,
				{ businessId, id },
				{ itemIndex },
			);
			return data.business?.vendor ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			return await waveGetAll<
				IDataObject,
				{ business: { vendors: WaveConnection<IDataObject> } | null }
			>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!,
					$email: String, $modifiedAtAfter: DateTime, $modifiedAtBefore: DateTime
				) {
					business(id: $businessId) {
						vendors(
							page: $page, pageSize: $pageSize, email: $email,
							modifiedAtAfter: $modifiedAtAfter, modifiedAtBefore: $modifiedAtBefore
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${VENDOR_FIELDS} } }
						}
					}
				}`,
				{
					businessId,
					email: (filters.email as string | undefined) || null,
					modifiedAtAfter: toDateTime(filters.modifiedAtAfter) ?? null,
					modifiedAtBefore: toDateTime(filters.modifiedAtBefore) ?? null,
				},
				(data) => data.business?.vendors,
				{ limit, itemIndex },
			);
		},
	},
};
