import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { fixedCollectionValues, getRequiredString } from './utils';
import { waveGetAll, waveMutation, type WaveConnection, type WaveMutationOutput } from '../transport';

export interface ProductMatchConfig {
	businessId: string;
	incomeAccountId: string;
}

interface ProductEntry {
	id: string;
	name: string;
	isArchived?: boolean;
}

/** Product IDs by normalized name for one business. */
type ProductIndex = Map<string, string>;

// One list call for each business and execution. The key is the execution context object.
const indexes = new WeakMap<object, Map<string, Promise<ProductIndex>>>();

export function normalizeProductName(name: string): string {
	return name.trim().toLowerCase();
}

async function loadProductIndex(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
): Promise<ProductIndex> {
	// Wave returns only active products when the isArchived variable is left out.
	const products = await waveGetAll<
		ProductEntry,
		{ business: { products: WaveConnection<ProductEntry> } | null }
	>(
		ctx,
		`query($businessId: ID!, $page: Int!, $pageSize: Int!) {
			business(id: $businessId) {
				products(page: $page, pageSize: $pageSize, sort: [CREATED_AT_ASC]) {
					pageInfo { currentPage totalPages totalCount }
					edges { node { id name isArchived } }
				}
			}
		}`,
		{ businessId },
		(data) => data.business?.products,
		{ itemIndex },
	);
	const index: ProductIndex = new Map();
	for (const product of products) {
		if (product.isArchived) continue;
		const key = normalizeProductName(product.name);
		// With two products of the same name, the oldest one wins.
		if (!index.has(key)) index.set(key, product.id);
	}
	return index;
}

function getProductIndex(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
): Promise<ProductIndex> {
	let perBusiness = indexes.get(ctx);
	if (!perBusiness) {
		perBusiness = new Map();
		indexes.set(ctx, perBusiness);
	}
	let index = perBusiness.get(businessId);
	if (!index) {
		index = loadProductIndex(ctx, itemIndex, businessId);
		perBusiness.set(businessId, index);
		// A failed load must not stay in the cache.
		index.catch(() => perBusiness.delete(businessId));
	}
	return index;
}

/**
 * Finds an active product by name (trimmed, not case-sensitive, exact) or creates it with the
 * default income account. The created product is added to the cache of the execution.
 */
export async function findOrCreateProduct(
	ctx: IExecuteFunctions,
	itemIndex: number,
	config: ProductMatchConfig,
	name: string,
	unitPrice?: string,
): Promise<string> {
	const index = await getProductIndex(ctx, itemIndex, config.businessId);
	const key = normalizeProductName(name);
	const existing = index.get(key);
	if (existing) return existing;

	const output = await waveMutation<WaveMutationOutput & { product: { id: string } | null }>(
		ctx,
		`mutation($input: ProductCreateInput!) {
			productCreate(input: $input) {
				didSucceed
				inputErrors { code message path }
				product { id }
			}
		}`,
		'productCreate',
		{
			businessId: config.businessId,
			name: name.trim(),
			unitPrice: unitPrice || '0',
			incomeAccountId: config.incomeAccountId,
		},
		{ itemIndex },
	);
	const id = output.product?.id;
	if (!id) {
		throw new NodeOperationError(ctx.getNode(), `Wave did not return the product "${name.trim()}"`, {
			itemIndex,
		});
	}
	index.set(key, id);
	return id;
}

/** Reads the matching options of Invoice Create and Estimate Create. Undefined when it is off. */
export function getProductMatchConfig(
	ctx: IExecuteFunctions,
	itemIndex: number,
	businessId: string,
): ProductMatchConfig | undefined {
	if (!ctx.getNodeParameter('matchProductsByName', itemIndex, false)) return undefined;
	return {
		businessId,
		incomeAccountId: getRequiredString.call(ctx, 'defaultIncomeAccount', itemIndex),
	};
}

/**
 * Replaces the "Product Name" of each line with the ID of the matching product. The result has
 * the shape of the "Items" fixed collection, so `buildLineItems` can read it.
 */
export async function resolveItemProducts(
	ctx: IExecuteFunctions,
	itemIndex: number,
	config: ProductMatchConfig,
	items: unknown,
): Promise<IDataObject> {
	const lines = fixedCollectionValues(items, 'itemValues');
	const resolved: IDataObject[] = [];
	for (const [position, line] of lines.entries()) {
		const { productName, ...rest } = line;
		const name = String(productName ?? '').trim();
		if (!name) {
			throw new NodeOperationError(
				ctx.getNode(),
				`Item ${position + 1} has no Product Name. Fill in the name or turn off Match Products By Name.`,
				{ itemIndex },
			);
		}
		const unitPrice = rest.unitPrice === undefined ? '' : String(rest.unitPrice);
		const product = await findOrCreateProduct(ctx, itemIndex, config, name, unitPrice);
		resolved.push({ ...rest, product });
	}
	return { itemValues: resolved };
}
