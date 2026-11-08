import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	businessLocator,
	paginationFields,
	showFor,
	simplifyField,
} from '../../shared/descriptions';
import { ADDRESS_FIELDS, CURRENCY_FIELDS, PAGE_INFO_FIELDS } from '../../shared/fields';
import { getBusinessId } from '../../shared/utils';
import { waveGetAll, waveRequest, type WaveConnection } from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'business';

export const BUSINESS_FIELDS = `
	id
	name
	isPersonal
	organizationalType
	type { name value }
	subtype { name value }
	currency { ${CURRENCY_FIELDS} }
	timezone
	address { ${ADDRESS_FIELDS} }
	phone
	fax
	mobile
	tollFree
	website
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
				description: 'Get a business',
				action: 'Get a business',
			},
			{
				name: 'Get Invoice and Estimate Settings',
				value: 'getInvoiceEstimateSettings',
				description: 'Get the invoice and estimate settings (accent color and logo) of a business',
				action: 'Get the invoice and estimate settings of a business',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many businesses that the credential can access',
				action: 'Get many businesses',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE, ['get', 'getInvoiceEstimateSettings'])),
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
					'Whether to return only archived businesses (true) or only active ones (false)',
			},
		],
	},
];

export const businessResource: ResourceModule = {
	option: { name: 'Business', value: RESOURCE },
	description: [...description, simplifyField(RESOURCE, ['get', 'getAll'])],
	operations: {
		async get({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const data = await waveRequest<{ business: IDataObject | null }>(
				this,
				`query($id: ID!) { business(id: $id) { ${BUSINESS_FIELDS} emailSendEnabled } }`,
				{ id: businessId },
				{ itemIndex },
			);
			return data.business ?? {};
		},
		async getInvoiceEstimateSettings({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const data = await waveRequest<{ business: { invoiceEstimateSettings: IDataObject } | null }>(
				this,
				`query($id: ID!) {
					business(id: $id) {
						invoiceEstimateSettings { generalSettings { accentColor logoUrl } }
					}
				}`,
				{ id: businessId },
				{ itemIndex },
			);
			return { businessId, ...(data.business?.invoiceEstimateSettings ?? {}) };
		},
		async getAll({ itemIndex }) {
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			return await waveGetAll<IDataObject, { businesses: WaveConnection<IDataObject> }>(
				this,
				`query($page: Int!, $pageSize: Int!, $isArchived: Boolean) {
					businesses(page: $page, pageSize: $pageSize, isArchived: $isArchived) {
						pageInfo { ${PAGE_INFO_FIELDS} }
						edges { node { ${BUSINESS_FIELDS} } }
					}
				}`,
				{ isArchived: filters.isArchived ?? null },
				(data) => data.businesses,
				{ limit, itemIndex },
			);
		},
	},
};
