import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	businessLocator,
	currencyField,
	enumOptions,
	paginationFields,
	resourceLocator,
	showFor,
} from '../../shared/descriptions';
import { CURRENCY_FIELDS, PAGE_INFO_FIELDS } from '../../shared/fields';
import { compactInput, getBusinessId, getResourceId } from '../../shared/utils';
import {
	waveGetAll,
	waveMutation,
	waveRequest,
	type WaveConnection,
	type WaveMutationOutput,
} from '../../transport';
import type { OperationContext, ResourceModule } from '../types';

const RESOURCE = 'account';

export const ACCOUNT_FIELDS = `
	id
	name
	description
	displayId
	currency { ${CURRENCY_FIELDS} }
	type { name value normalBalanceType }
	subtype { name value type { name value } description }
	normalBalanceType
	isArchived
	sequence
	balance
	balanceInBusinessCurrency
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
				description: 'Archive an account',
				action: 'Archive an account',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an account',
				action: 'Create an account',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an account',
				action: 'Get an account',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many accounts of the chart of accounts',
				action: 'Get many accounts',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an account',
				action: 'Update an account',
			},
		],
		default: 'get',
	},
	businessLocator(showFor(RESOURCE)),
	resourceLocator({
		name: 'accountId',
		displayName: 'Account',
		searchMethod: 'searchAccounts',
		resourceLabel: 'account',
		displayOptions: showFor(RESOURCE, ['get', 'update', 'archive']),
	}),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The name of the account',
	},
	{
		displayName: 'Subtype',
		name: 'subtype',
		type: 'options',
		required: true,
		options: enumOptions('AccountSubtypeValueCreateInput'),
		default: 'EXPENSE',
		displayOptions: showFor(RESOURCE, ['create']),
		description: 'The subtype of the account. The subtype sets the account type.',
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
				displayName: 'Can Archive',
				name: 'canArchive',
				type: 'boolean',
				default: true,
				description: 'Whether a user can archive this account. Only some applications can set this.',
			},
			currencyField({
				description:
					'The currency of the account. The default is the currency of the business. Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			}),
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the account',
			},
			{
				displayName: 'Display ID',
				name: 'displayId',
				type: 'string',
				default: '',
				description: 'An ID for the account that you define',
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
				displayName: 'Excluded Subtypes',
				name: 'excludedSubtypes',
				type: 'multiOptions',
				options: enumOptions('AccountSubtypeValue'),
				default: [],
				description: 'Do not return accounts of these subtypes',
			},
			{
				displayName: 'Is Archived',
				name: 'isArchived',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only archived accounts (true) or only active ones (false). Wave returns only active accounts when you do not set this filter.',
			},
			{
				displayName: 'Subtypes',
				name: 'subtypes',
				type: 'multiOptions',
				options: enumOptions('AccountSubtypeValue'),
				default: [],
				description: 'Return only accounts of these subtypes',
			},
			{
				displayName: 'Types',
				name: 'types',
				type: 'multiOptions',
				options: enumOptions('AccountTypeValue'),
				default: [],
				description: 'Return only accounts of these types',
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
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the account',
			},
			{
				displayName: 'Display ID',
				name: 'displayId',
				type: 'string',
				default: '',
				description: 'An ID for the account that you define',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the account',
			},
		],
	},
];

type AccountOutput = WaveMutationOutput & { account: IDataObject | null };

export function buildAccountCreateInput(
	businessId: string,
	name: string,
	subtype: string,
	additionalFields: IDataObject,
): IDataObject {
	const { canArchive, ...rest } = additionalFields;
	return compactInput({
		businessId,
		name,
		subtype,
		...rest,
		restrictions: canArchive === undefined ? undefined : { canArchive },
	});
}

const nonEmptyList = (value: unknown) =>
	Array.isArray(value) && value.length > 0 ? (value as string[]) : null;

export const accountResource: ResourceModule = {
	option: { name: 'Account', value: RESOURCE, description: 'Chart of accounts' },
	description,
	operations: {
		async create({ itemIndex }: OperationContext) {
			const businessId = getBusinessId.call(this, itemIndex);
			const input = buildAccountCreateInput(
				businessId,
				this.getNodeParameter('name', itemIndex) as string,
				this.getNodeParameter('subtype', itemIndex) as string,
				this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject,
			);
			const output = await waveMutation<AccountOutput>(
				this,
				`mutation($input: AccountCreateInput!) {
					accountCreate(input: $input) {
						didSucceed
						inputErrors { code message path }
						account { ${ACCOUNT_FIELDS} }
					}
				}`,
				'accountCreate',
				input,
				{ itemIndex },
			);
			return output.account ?? {};
		},
		async get({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const accountId = getResourceId.call(this, 'accountId', itemIndex);
			const data = await waveRequest<{
				business: { account: IDataObject | null } | null;
			}>(
				this,
				`query($businessId: ID!, $accountId: ID!) {
					business(id: $businessId) { account(id: $accountId) { ${ACCOUNT_FIELDS} } }
				}`,
				{ businessId, accountId },
				{ itemIndex },
			);
			return data.business?.account ?? {};
		},
		async getAll({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll ? undefined : (this.getNodeParameter('limit', itemIndex) as number);
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			return await waveGetAll<
				IDataObject,
				{ business: { accounts: WaveConnection<IDataObject> } | null }
			>(
				this,
				`query(
					$businessId: ID!, $page: Int!, $pageSize: Int!, $types: [AccountTypeValue!],
					$subtypes: [AccountSubtypeValue!], $excludedSubtypes: [AccountSubtypeValue!], $isArchived: Boolean
				) {
					business(id: $businessId) {
						accounts(
							page: $page, pageSize: $pageSize, types: $types, subtypes: $subtypes,
							excludedSubtypes: $excludedSubtypes, isArchived: $isArchived
						) {
							pageInfo { ${PAGE_INFO_FIELDS} }
							edges { node { ${ACCOUNT_FIELDS} } }
						}
					}
				}`,
				{
					businessId,
					types: nonEmptyList(filters.types),
					subtypes: nonEmptyList(filters.subtypes),
					excludedSubtypes: nonEmptyList(filters.excludedSubtypes),
					// When the variable is left out, Wave returns only active accounts
					...('isArchived' in filters ? { isArchived: filters.isArchived } : {}),
				},
				(data) => data.business?.accounts,
				{ limit, itemIndex },
			);
		},
		async update({ itemIndex }) {
			const businessId = getBusinessId.call(this, itemIndex);
			const accountId = getResourceId.call(this, 'accountId', itemIndex);
			const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
			// Wave needs the current sequence number to detect concurrent changes
			const current = await waveRequest<{
				business: { account: { sequence: number } | null } | null;
			}>(
				this,
				`query($businessId: ID!, $accountId: ID!) {
					business(id: $businessId) { account(id: $accountId) { sequence } }
				}`,
				{ businessId, accountId },
				{ itemIndex },
			);
			const sequence = current.business?.account?.sequence;
			if (sequence === undefined) {
				throw new NodeOperationError(this.getNode(), 'The account was not found', { itemIndex });
			}
			const output = await waveMutation<AccountOutput>(
				this,
				`mutation($input: AccountPatchInput!) {
					accountPatch(input: $input) {
						didSucceed
						inputErrors { code message path }
						account { ${ACCOUNT_FIELDS} }
					}
				}`,
				'accountPatch',
				compactInput({ id: accountId, sequence, ...updateFields }),
				{ itemIndex },
			);
			return output.account ?? {};
		},
		async archive({ itemIndex }) {
			const accountId = getResourceId.call(this, 'accountId', itemIndex);
			await waveMutation(
				this,
				`mutation($input: AccountArchiveInput!) {
					accountArchive(input: $input) {
						didSucceed
						inputErrors { code message path }
					}
				}`,
				'accountArchive',
				{ id: accountId },
				{ itemIndex },
			);
			return { success: true, id: accountId };
		},
	},
};
