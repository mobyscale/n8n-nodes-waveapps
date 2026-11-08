import { CURRENCY_FIELDS, MONEY_FIELDS } from '../../shared/fields';

export const INVOICE_PAYMENT_FIELDS = `
	id
	paymentDate
	amount
	memo
	exchangeRate
	paymentMethod
	state
	origin
	transactionType
	readonlyUrl
	account { id name }
	invoice { id invoiceNumber }
	businessCurrency { ${CURRENCY_FIELDS} }
	invoiceCurrency { ${CURRENCY_FIELDS} }
	paymentCurrency { ${CURRENCY_FIELDS} }
	createdAt
	modifiedAt
`;

/** The invoice selection without payments. Wave fills payments only for a single invoice. */
export const INVOICE_LIST_FIELDS = `
	id
	invoiceNumber
	status
	title
	subhead
	poNumber
	invoiceDate
	dueDate
	createdAt
	modifiedAt
	pdfUrl
	viewUrl
	customer { id name email }
	currency { ${CURRENCY_FIELDS} }
	exchangeRate
	subtotal { ${MONEY_FIELDS} }
	taxTotal { ${MONEY_FIELDS} }
	discountTotal { ${MONEY_FIELDS} }
	total { ${MONEY_FIELDS} }
	amountPaid { ${MONEY_FIELDS} }
	amountDue { ${MONEY_FIELDS} }
	discounts {
		__typename
		name
		... on FixedInvoiceDiscount { amount }
		... on PercentageInvoiceDiscount { percentage }
	}
	items {
		id
		description
		quantity
		unitPrice
		product { id name }
		account { id name }
		subtotal { ${MONEY_FIELDS} }
		total { ${MONEY_FIELDS} }
		taxes {
			salesTax { id name abbreviation rate }
			amount { ${MONEY_FIELDS} }
		}
	}
	memo
	footer
	disableCreditCardPayments
	disableBankPayments
	disableAmexPayments
	itemTitle
	unitTitle
	priceTitle
	amountTitle
	hideName
	hideDescription
	hideUnit
	hidePrice
	hideAmount
	requireTermsOfServiceAgreement
	lastSentAt
	lastSentVia
	lastViewedAt
`;

export const INVOICE_FIELDS = `
	${INVOICE_LIST_FIELDS}
	payments { ${INVOICE_PAYMENT_FIELDS} }
`;
