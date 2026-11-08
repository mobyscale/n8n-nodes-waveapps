/**
 * GraphQL selection sets that several resources share. Keep them in sync with
 * schema/wave.graphql. Each resource defines its own selection for its main type.
 */

export const CURRENCY_FIELDS = 'code symbol name';

export const MONEY_FIELDS = `value minorUnitValue currency { ${CURRENCY_FIELDS} }`;

export const ADDRESS_FIELDS = `
	addressLine1
	addressLine2
	city
	province { code name }
	country { code name }
	postalCode
`;

export const PAGE_INFO_FIELDS = 'currentPage totalPages totalCount';
