/**
 * GraphQL selection sets for the records that the triggers return. Keep them in sync with
 * schema/wave.graphql.
 */
import { ADDRESS_FIELDS, CURRENCY_FIELDS, MONEY_FIELDS } from '../Wave/shared/fields';

const SHIPPING_FIELDS = `name address { ${ADDRESS_FIELDS} } phone instructions`;

const CONTACT_FIELDS = `
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
	currency { ${CURRENCY_FIELDS} }
	address { ${ADDRESS_FIELDS} }
	shippingDetails { ${SHIPPING_FIELDS} }
	isArchived
	createdAt
	modifiedAt
`;

export const CUSTOMER_FIELDS = `
	${CONTACT_FIELDS}
	isActive
	outstandingAmount { ${MONEY_FIELDS} }
	overdueAmount { ${MONEY_FIELDS} }
`;

export const VENDOR_FIELDS = CONTACT_FIELDS;

const SALES_TAX_REFERENCE_FIELDS = 'id name abbreviation rate';

export const PRODUCT_FIELDS = `
	id
	name
	description
	unitPrice
	isSold
	isBought
	isArchived
	incomeAccount { id name }
	expenseAccount { id name }
	defaultSalesTaxes { ${SALES_TAX_REFERENCE_FIELDS} }
	createdAt
	modifiedAt
`;

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

const ITEM_FIELDS = `
	id
	description
	quantity
	unitPrice
	subtotal { ${MONEY_FIELDS} }
	total { ${MONEY_FIELDS} }
	account { id name }
	product { id name }
	taxes { amount { ${MONEY_FIELDS} } salesTax { ${SALES_TAX_REFERENCE_FIELDS} } }
`;

const LAYOUT_FIELDS = `
	itemTitle
	unitTitle
	priceTitle
	amountTitle
	hideName
	hideDescription
	hideUnit
	hidePrice
	hideAmount
`;

const SALES_DOCUMENT_FIELDS = `
	id
	createdAt
	modifiedAt
	pdfUrl
	viewUrl
	status
	title
	subhead
	poNumber
	dueDate
	amountDue { ${MONEY_FIELDS} }
	amountPaid { ${MONEY_FIELDS} }
	taxTotal { ${MONEY_FIELDS} }
	subtotal { ${MONEY_FIELDS} }
	discountTotal { ${MONEY_FIELDS} }
	total { ${MONEY_FIELDS} }
	currency { ${CURRENCY_FIELDS} }
	exchangeRate
	customer { id name email }
	items { ${ITEM_FIELDS} }
	memo
	footer
	disableCreditCardPayments
	disableBankPayments
	disableAmexPayments
	${LAYOUT_FIELDS}
	lastSentAt
	lastSentVia
	lastViewedAt
	requireTermsOfServiceAgreement
`;

export const INVOICE_FIELDS = `
	${SALES_DOCUMENT_FIELDS}
	invoiceNumber
	invoiceDate
	discounts {
		name
		createdAt
		modifiedAt
		... on FixedInvoiceDiscount { amount }
		... on PercentageInvoiceDiscount { percentage }
	}
`;

export const ESTIMATE_FIELDS = `
	${SALES_DOCUMENT_FIELDS}
	estimateNumber
	estimateDate
	discounts {
		name
		createdAt
		modifiedAt
		... on FixedEstimateDiscount { amount }
		... on PercentageEstimateDiscount { percentage }
	}
	depositStatus
	depositUnit
	depositValue
	depositTotal { ${MONEY_FIELDS} }
	depositPaymentStatus
	dontCarryOverNotesToInvoice
`;
