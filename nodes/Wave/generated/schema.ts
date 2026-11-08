export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
	/** ISO-8601 date object. Format returned will follow `yyyy-MM-dd`. */
	Date: { input: string; output: string };
	/** ISO-8601 date and time object. Format returned will follow `yyyy-MM-ddThh:mm:ss.sssZ` where the timezone is UTC. */
	DateTime: { input: string; output: string };
	/** A signed decimal number, which supports arbitrary precision and is serialized as a string. Example value: `14.99`. */
	Decimal: { input: string; output: string };
	/** A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors. */
	HexColorCode: { input: string; output: string };
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
	JSON: { input: unknown; output: unknown };
	/** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
	URL: { input: string; output: string };
};

/** Attachment object representing a file stored in invoicing */
export type ARAttachment = {
	/** The state of attachment, if it is active or soft-deleted. */
	active: Scalars['Boolean']['output'];
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['output'];
	/** URL to download attachment. */
	downloadUrl: Scalars['String']['output'];
	/** The name of attachment file. */
	fileName: Scalars['String']['output'];
	/** The file path in S3 bucket. */
	filePath: Scalars['String']['output'];
	/** The size (in bytes) of attachment file. */
	fileSize: Scalars['String']['output'];
	/** Unique identifier for the attachment. */
	id: Scalars['ID']['output'];
	/** Timestamp of when the upload status was last updated. */
	uploadStatusUpdatedAt: Scalars['DateTime']['output'];
};

/** An approximate bill given to a buyer indicating the products or services, quantities, and expected prices (not a request for payment). */
export type AREstimate = {
	/** estimate total less amount already paid. */
	amountDue: Money;
	/** Total of all payments so far made against this estimate. */
	amountPaid: Money;
	/** The label for the 'Amount' (= unit x price) column in the listing of line items on the estimate. */
	amountTitle: Scalars['String']['output'];
	/** Attachments for the estimate. */
	attachments?: Maybe<Array<ARAttachment>>;
	/** When the estimate was created. */
	createdAt: Scalars['DateTime']['output'];
	/** Currency of the estimate. */
	currency: Currency;
	/** Customer the estimate is for. */
	customer: Customer;
	/** Deposit payment status. */
	depositPaymentStatus: EstimateDepositPaymentStatus;
	/** Status of the deposit request. */
	depositStatus: EstimateDepositStatusType;
	/** Total value of all deposits. */
	depositTotal: Money;
	/** Unit of the deposit. */
	depositUnit?: Maybe<EstimateDepositUnitType>;
	/** Unit value of deposit requested. */
	depositValue?: Maybe<Scalars['Decimal']['output']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estimate has been marked to not be payable by American Express. */
	disableAmexPayments: Scalars['Boolean']['output'];
	/** Within a business that is enabled to accept bank payments, indicates if this individual estimate has been marked to not be payable by bank payment. */
	disableBankPayments: Scalars['Boolean']['output'];
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estimate has been marked to not be payable by card. */
	disableCreditCardPayments: Scalars['Boolean']['output'];
	/** Total value of all discounts. */
	discountTotal: Money;
	/** estimate discounts. */
	discounts?: Maybe<Array<EstimateDiscount>>;
	/** Indicates whether the estimate memo (notes) should not be carried over when the estimate is converted to an invoice. */
	dontCarryOverNotesToInvoice?: Maybe<Scalars['Boolean']['output']>;
	/** Date when payment is due. */
	dueDate: Scalars['Date']['output'];
	/** Date when estimate is issued. */
	estimateDate: Scalars['Date']['output'];
	/** Unique number assigned to the estimate. */
	estimateNumber: Scalars['String']['output'];
	/** Exchange rate to business's currency from the estimate's currency. Used to value the estimate income within Wave's accounting transactions. */
	exchangeRate: Scalars['Decimal']['output'];
	/** estimate footer text. */
	footer?: Maybe<Scalars['String']['output']>;
	/** Indicates whether item's amount is hidden in the line items listing. */
	hideAmount: Scalars['Boolean']['output'];
	/** Indicates whether item's description in item column is hidden in the line items listing. */
	hideDescription: Scalars['Boolean']['output'];
	/** Indicates whether item's product name in item column is hidden in the line items listing. */
	hideName: Scalars['Boolean']['output'];
	/** Indicates whether item's price is hidden in the line items listing. */
	hidePrice: Scalars['Boolean']['output'];
	/** Indicates whether item's unit is hidden in the line items listing. */
	hideUnit: Scalars['Boolean']['output'];
	/** Acceptance history of the estimate. */
	history?: Maybe<Array<AREstimateAcceptanceHistory>>;
	/** Unique identifier for the estimate. */
	id: Scalars['ID']['output'];
	/** The label for the 'Item' column in the line items listing. */
	itemTitle: Scalars['String']['output'];
	/** The line items (product, unit and price) that make up the estimated sale. */
	items?: Maybe<Array<EstimateItem>>;
	/** When the estimate was last sent. */
	lastSentAt?: Maybe<Scalars['DateTime']['output']>;
	/** How the estimate was last sent. */
	lastSentVia?: Maybe<EstimateSendMethod>;
	/** When the estimate was last viewed by the customer. */
	lastViewedAt?: Maybe<Scalars['DateTime']['output']>;
	/** estimate memo (notes) text. */
	memo?: Maybe<Scalars['String']['output']>;
	/** When the estimate was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** Estimate payments */
	payments?: Maybe<Array<Maybe<EstimatePayment>>>;
	/** URL to access PDF representation of the estimate. */
	pdfUrl: Scalars['String']['output'];
	/** Purchase order or sales order number for the estimate. */
	poNumber?: Maybe<Scalars['String']['output']>;
	/** The label for the 'Price' column in the listing of line items on the estimate. */
	priceTitle: Scalars['String']['output'];
	/** Indicates whether the customer is required to accept the terms of service. */
	requireTermsOfServiceAgreement: Scalars['Boolean']['output'];
	/** Status of the estimate. */
	status: EstimateStatus;
	/** estimate subheading text. */
	subhead?: Maybe<Scalars['String']['output']>;
	/** Pretax total. */
	subtotal: Money;
	/** Total of all sales taxes on all line items within the estimate. */
	taxTotal: Money;
	/** estimate title at the top of the document. */
	title: Scalars['String']['output'];
	/** Total value of the estimate including sales taxes. */
	total: Money;
	/** The label for the 'Unit' column in the listing of line items on the estimate. */
	unitTitle: Scalars['String']['output'];
	/** URL to view the estimate online as seen by a customer. */
	viewUrl: Scalars['String']['output'];
};

/** Acceptance history record for estimate */
export type AREstimateAcceptanceHistory = {
	/** Email associated to the entity */
	email: Scalars['String']['output'];
	/** Id of the entity */
	entityId: Scalars['String']['output'];
	/** Type of the entity */
	entityType: EstimateHistoryEntityType;
	/** Name of the entity */
	name: Scalars['String']['output'];
	/** State of the history record */
	state: Scalars['String']['output'];
	/** Timestamp of the history record */
	timestamp: Scalars['DateTime']['output'];
};

/** A unique record for each type of asset, liability, equity, income and expense. Used as part of a Chart of Accounts. */
export type Account = BusinessNode &
	Node & {
		/** The balance of the account as of the current date. */
		balance?: Maybe<Scalars['Decimal']['output']>;
		/** The balance of the account as of the current date in the business currency. */
		balanceInBusinessCurrency?: Maybe<Scalars['Decimal']['output']>;
		/** Business that the account belongs to. */
		business: Business;
		/** The classic primary key used internally at Wave. */
		classicId?: Maybe<Scalars['String']['output']>;
		/** Currency of the account. */
		currency: Currency;
		/** User defined description for the account. */
		description?: Maybe<Scalars['String']['output']>;
		/** User defined id for the account. */
		displayId?: Maybe<Scalars['String']['output']>;
		/** Unique identifier for the account. */
		id: Scalars['ID']['output'];
		/** Indicates whether the account is hidden from view by default. */
		isArchived: Scalars['Boolean']['output'];
		/** Name of the account. */
		name: Scalars['String']['output'];
		/** Credit or Debit. */
		normalBalanceType: AccountNormalBalanceType;
		/**
		 * Numerically increasing version, each representing a revision of account data.
		 * As soon as something modifies an account, its sequence is incremented.
		 */
		sequence: Scalars['Int']['output'];
		/** The account subtype classification based on type. */
		subtype: AccountSubtype;
		/** Account type. */
		type: AccountType;
	};

/** Input to the `accountArchive` mutation. */
export type AccountArchiveInput = {
	/** The unique identifier for the account. */
	id: Scalars['ID']['input'];
};

/** Output of the accountArchive mutation. */
export type AccountArchiveOutput = {
	/** Indicates whether the account was successfully archived. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Account connection. */
export type AccountConnection = {
	/** List of accounts from the Chart of Accounts. */
	edges: Array<AccountEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Input to the `accountCreate` mutation. */
export type AccountCreateInput = {
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Currency of the account. Will default to business's currency. */
	currency?: InputMaybe<CurrencyCode>;
	/** User defined description for the account. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** User defined id for the account. */
	displayId?: InputMaybe<Scalars['String']['input']>;
	/** Name of the account. */
	name: Scalars['String']['input'];
	/** Rules around how a user is able to modify this account. This field is only usable for specific applications. */
	restrictions?: InputMaybe<AccountCreateRestrictions>;
	/** The account subtype classification. */
	subtype: AccountSubtypeValueCreateInput;
};

/** Output of the `accountCreate` mutation. */
export type AccountCreateOutput = {
	/** Account that was created. */
	account?: Maybe<Account>;
	/** Indicates whether the account was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Rules around how a user is able to modify this account. */
export type AccountCreateRestrictions = {
	/** Whether or not a user can archive this account. */
	canArchive?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Account edge. */
export type AccountEdge = {
	/** An account from the Chart of Accounts. */
	node?: Maybe<Account>;
};

/** Account balance type. */
export type AccountNormalBalanceType =
	/** Credit */
	| 'CREDIT'
	/** Debit */
	| 'DEBIT';

/** Input to the `accountPatch` mutation. */
export type AccountPatchInput = {
	/** User defined description for the account. Use null to unset the current value. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** User defined id for the account. Use null to unset the current value. */
	displayId?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the account. */
	id: Scalars['ID']['input'];
	/** Name of the account. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** The most recent reversion you are aware of. As soon as something modifies an account, its sequence is incremented. */
	sequence: Scalars['Int']['input'];
};

/** Output of the accountPatch mutation. */
export type AccountPatchOutput = {
	/** Account that was patched. */
	account?: Maybe<Account>;
	/** Indicates whether the account was successfully patched. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Account subtype. */
export type AccountSubtype = {
	/** Indicates if accounts of this subtype can be archived. */
	archivable: Scalars['Boolean']['output'];
	/** Account subtype description. */
	description?: Maybe<Scalars['String']['output']>;
	/** Account subtype name. */
	name: Scalars['String']['output'];
	/** Indicates if accounts of this subtype is system created accounts. */
	systemCreated: Scalars['Boolean']['output'];
	/** Account type for the subtype. */
	type: AccountType;
	/** Account subtype value. */
	value: AccountSubtypeValue;
};

/** Subtypes of accounts, as used in the Chart of Accounts. */
export type AccountSubtypeValue =
	/** Cash & Bank */
	| 'CASH_AND_BANK'
	/** Cost of Goods Sold */
	| 'COST_OF_GOODS_SOLD'
	/** Credit Card */
	| 'CREDIT_CARD'
	/** Customer Prepayments and Customer Credits */
	| 'CUSTOMER_PREPAYMENTS_AND_CREDITS'
	/** Depreciation and Amortization */
	| 'DEPRECIATION_AND_AMORTIZATION'
	/** Discount */
	| 'DISCOUNTS'
	/** Due For Payroll */
	| 'DUE_FOR_PAYROLL'
	/** Due to You and Other Business Owners */
	| 'DUE_TO_YOU_AND_OTHER_OWNERS'
	/** Expense */
	| 'EXPENSE'
	/** Gain on Foreign Exchange */
	| 'GAIN_ON_FOREIGN_EXCHANGE'
	/** Income */
	| 'INCOME'
	/** Inventory */
	| 'INVENTORY'
	/** Loan and Line of Credit */
	| 'LOANS'
	/** Loss on Foreign Exchange */
	| 'LOSS_ON_FOREIGN_EXCHANGE'
	/** Money in Transit */
	| 'MONEY_IN_TRANSIT'
	/** Business Owner Contribution */
	| 'NON_RETAINED_EARNINGS'
	/** Other Short-Term Asset */
	| 'OTHER_CURRENT_ASSETS'
	/** Other Short-Term Liability */
	| 'OTHER_CURRENT_LIABILITY'
	/** Other Income */
	| 'OTHER_INCOME'
	/** Other Long-Term Asset */
	| 'OTHER_LONG_TERM_ASSETS'
	/** Other Long-Term Liability */
	| 'OTHER_LONG_TERM_LIABILITY'
	/** Payable */
	| 'PAYABLE'
	/** System Payable Bill */
	| 'PAYABLE_BILLS'
	/** System Payable Non-Bill */
	| 'PAYABLE_OTHER'
	/** Payment Processing Fee */
	| 'PAYMENT_PROCESSING_FEES'
	/** Payroll Expense */
	| 'PAYROLL_EXPENSES'
	/** Property, Plant, Equipment */
	| 'PROPERTY_PLANT_EQUIPMENT'
	/** Receivable */
	| 'RECEIVABLE'
	/** System Receivable Invoice */
	| 'RECEIVABLE_INVOICES'
	/** System Receivable Non-Invoice */
	| 'RECEIVABLE_OTHER'
	/** Retained Earnings: Profit and Business Owner Drawing */
	| 'RETAINED_EARNINGS'
	/** Sales Tax on Sales and Purchases */
	| 'SALES_TAX'
	/** System Customer Credits */
	| 'SYSTEM_CUSTOMER_CREDITS'
	/** Transfers */
	| 'TRANSFERS'
	/** Uncategorized Expense */
	| 'UNCATEGORIZED_EXPENSE'
	/** Uncategorized Income */
	| 'UNCATEGORIZED_INCOME'
	/** Unknown Account */
	| 'UNKNOWN_ACCOUNT'
	/** Vendor Prepayments and Vendor Credits */
	| 'VENDOR_PREPAYMENTS_AND_CREDITS';

/** Subtypes of accounts supported for account creation. Not all subtypes are supported when creating accounts, and this type excludes those that are not supported. */
export type AccountSubtypeValueCreateInput =
	/** Cash & Bank */
	| 'CASH_AND_BANK'
	/** Cost of Goods Sold */
	| 'COST_OF_GOODS_SOLD'
	/** Credit Card */
	| 'CREDIT_CARD'
	/** Customer Prepayments and Customer Credits */
	| 'CUSTOMER_PREPAYMENTS_AND_CREDITS'
	/** Depreciation and Amortization */
	| 'DEPRECIATION_AND_AMORTIZATION'
	/** Discount */
	| 'DISCOUNTS'
	/** Due For Payroll */
	| 'DUE_FOR_PAYROLL'
	/** Due to You and Other Business Owners */
	| 'DUE_TO_YOU_AND_OTHER_OWNERS'
	/** Expense */
	| 'EXPENSE'
	/** Income */
	| 'INCOME'
	/** Inventory */
	| 'INVENTORY'
	/** Loan and Line of Credit */
	| 'LOANS'
	/** Money in Transit */
	| 'MONEY_IN_TRANSIT'
	/** Business Owner Contribution */
	| 'NON_RETAINED_EARNINGS'
	/** Other Short-Term Asset */
	| 'OTHER_CURRENT_ASSETS'
	/** Other Short-Term Liability */
	| 'OTHER_CURRENT_LIABILITY'
	/** Other Income */
	| 'OTHER_INCOME'
	/** Other Long-Term Asset */
	| 'OTHER_LONG_TERM_ASSETS'
	/** Other Long-Term Liability */
	| 'OTHER_LONG_TERM_LIABILITY'
	/** Payable */
	| 'PAYABLE'
	/** Payment Processing Fee */
	| 'PAYMENT_PROCESSING_FEES'
	/** Payroll Expense */
	| 'PAYROLL_EXPENSES'
	/** Property, Plant, Equipment */
	| 'PROPERTY_PLANT_EQUIPMENT'
	/** Receivable */
	| 'RECEIVABLE'
	/** Retained Earnings: Profit and Business Owner Drawing */
	| 'RETAINED_EARNINGS'
	/** Vendor Prepayments and Vendor Credits */
	| 'VENDOR_PREPAYMENTS_AND_CREDITS';

/** Account type. */
export type AccountType = {
	/** Account type name. */
	name: Scalars['String']['output'];
	/** Normal balance type of the account type */
	normalBalanceType: AccountNormalBalanceType;
	/** Account type value. */
	value: AccountTypeValue;
};

/** Types of accounts, as used in the Chart of Accounts. */
export type AccountTypeValue =
	/** Represents the different types of economic resources owned or controlled by an entity. */
	| 'ASSET'
	/** Represents the residual equity of an entity. */
	| 'EQUITY'
	/** Represents the business's expenditures. */
	| 'EXPENSE'
	/** Represents the business's earnings. */
	| 'INCOME'
	/** Represents the different types of economic obligations of an entity. */
	| 'LIABILITY';

/** An address. */
export type Address = {
	/** Address line 1 (Street address/PO Box/Company name). */
	addressLine1?: Maybe<Scalars['String']['output']>;
	/** Address line 2 (Apartment/Suite/Unit/Building). */
	addressLine2?: Maybe<Scalars['String']['output']>;
	/** City/District/Suburb/Town/Village. */
	city?: Maybe<Scalars['String']['output']>;
	/** Country. */
	country?: Maybe<Country>;
	/** Zip/Postal Code. */
	postalCode?: Maybe<Scalars['String']['output']>;
	/** State/County/Province/Region. */
	province?: Maybe<Province>;
};

/** An address. */
export type AddressInput = {
	/** Address line 1 (Street address/PO Box/Company name). */
	addressLine1?: InputMaybe<Scalars['String']['input']>;
	/** Address line 2 (Apartment/Suite/Unit/Building). */
	addressLine2?: InputMaybe<Scalars['String']['input']>;
	/** City/District/Suburb/Town/Village. */
	city?: InputMaybe<Scalars['String']['input']>;
	/** Country Code. */
	countryCode?: InputMaybe<CountryCode>;
	/** Zip/Postal Code. */
	postalCode?: InputMaybe<Scalars['String']['input']>;
	/** State/County/Province/Region Code ([ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2)). */
	provinceCode?: InputMaybe<Scalars['String']['input']>;
};

/** Balance type that expresses how to change an account. */
export type BalanceType =
	/** Credit. */
	| 'CREDIT'
	/** Debit. */
	| 'DEBIT'
	/** Decrease using the inverse of the account's normal balance type. For contra accounts whose subtype is `DISCOUNTS` or `DEPRECIATION_AND_AMORTIZATION`, apply the amount in the account's normal balance type. */
	| 'DECREASE'
	/** Increase using the account's normal balance type. For contra accounts whose subtype is `DISCOUNTS` or `DEPRECIATION_AND_AMORTIZATION`, apply the amount in the inverse of the account's normal balance type. */
	| 'INCREASE';

/** An organization and legal entity made up of an association of people. */
export type Business = Node & {
	/** Get an account of the business. */
	account?: Maybe<Account>;
	/** Chart of Accounts for the business. */
	accounts?: Maybe<AccountConnection>;
	/** The address of the business. */
	address?: Maybe<Address>;
	/** When the business was created. */
	createdAt: Scalars['DateTime']['output'];
	/** The currency of the business. */
	currency: Currency;
	/** Get a customer of the business. */
	customer?: Maybe<Customer>;
	/** List of customers for the business. */
	customers?: Maybe<CustomerConnection>;
	/** Indicates whether Wave email sending features, such as sending invoices, are enabled for this business */
	emailSendEnabled: Scalars['Boolean']['output'];
	/** Get a single estimate for a business. */
	estimate?: Maybe<AREstimate>;
	/** Get Estimate payment or refund */
	estimatePayment?: Maybe<EstimatePayment>;
	/** List of estimates for the business. */
	estimates?: Maybe<EstimateConnection>;
	/** The fax number of the business. */
	fax?: Maybe<Scalars['String']['output']>;
	/** The unique identifier for the business. */
	id: Scalars['ID']['output'];
	/** Get an invoice of the business. */
	invoice?: Maybe<Invoice>;
	/** Invoice and estimate settings for the business. */
	invoiceEstimateSettings: InvoiceEstimateSettings;
	/** Invoice payments */
	invoicePayment?: Maybe<InvoicePayment>;
	/** List of invoices for the business. */
	invoices?: Maybe<InvoiceConnection>;
	/** Is the business hidden from view by default. */
	isArchived: Scalars['Boolean']['output'];
	/**
	 * Does business use classic accounting system.
	 * @deprecated Classic Accounting is deprecated
	 */
	isClassicAccounting: Scalars['Boolean']['output'];
	/**
	 * Does business use classic invoicing system.
	 * @deprecated Classic Invoicing is deprecated
	 */
	isClassicInvoicing: Scalars['Boolean']['output'];
	/** Is the business a personal one with limited functionality compared to regular businesses. */
	isPersonal: Scalars['Boolean']['output'];
	/** The mobile/cell number of the business. */
	mobile?: Maybe<Scalars['String']['output']>;
	/** When the business was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** The name of the business. */
	name: Scalars['String']['output'];
	/** The organization type of the business. */
	organizationalType?: Maybe<OrganizationalType>;
	/** The phone number of the business. */
	phone?: Maybe<Scalars['String']['output']>;
	/** Get a product (or service) of the business. */
	product?: Maybe<Product>;
	/** List of products (and services) for the business. */
	products?: Maybe<ProductConnection>;
	/** Get a sales tax of the business. */
	salesTax?: Maybe<SalesTax>;
	/** List of sales taxes for the business. */
	salesTaxes?: Maybe<SalesTaxConnection>;
	/** The subtype of the business. */
	subtype?: Maybe<BusinessSubtype>;
	/** The timezone of the business. */
	timezone?: Maybe<Scalars['String']['output']>;
	/** The toll free number of the business. */
	tollFree?: Maybe<Scalars['String']['output']>;
	/** The type of the business. */
	type?: Maybe<BusinessType>;
	/** Get a vendor of the business. */
	vendor?: Maybe<Vendor>;
	/** List of vendors for the business. */
	vendors?: Maybe<VendorConnection>;
	/** The website of the business. */
	website?: Maybe<Scalars['String']['output']>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinessaccountArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessaccountsArgs = {
	excludedSubtypes?: InputMaybe<Array<AccountSubtypeValue>>;
	isArchived?: InputMaybe<Scalars['Boolean']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	subtypes?: InputMaybe<Array<AccountSubtypeValue>>;
	types?: InputMaybe<Array<AccountTypeValue>>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinesscustomerArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinesscustomersArgs = {
	email?: InputMaybe<Scalars['String']['input']>;
	isArchived?: InputMaybe<Scalars['Boolean']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	sort?: Array<CustomerSort>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinessestimateArgs = {
	embedAttachments?: InputMaybe<Scalars['Boolean']['input']>;
	embedDepositPayments?: InputMaybe<Scalars['Boolean']['input']>;
	embedHistory?: InputMaybe<Scalars['Boolean']['input']>;
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessestimatePaymentArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessestimatesArgs = {
	amountDue?: InputMaybe<Scalars['Decimal']['input']>;
	currency?: InputMaybe<CurrencyCode>;
	customerId?: InputMaybe<Scalars['ID']['input']>;
	estimateDateEnd?: InputMaybe<Scalars['Date']['input']>;
	estimateDateStart?: InputMaybe<Scalars['Date']['input']>;
	estimateNumber?: InputMaybe<Scalars['String']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	sort?: EstimateSort;
	status?: InputMaybe<EstimateListStatusFilter>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinessinvoiceArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessinvoicePaymentArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessinvoicesArgs = {
	amountDue?: InputMaybe<Scalars['Decimal']['input']>;
	currency?: InputMaybe<CurrencyCode>;
	customerId?: InputMaybe<Scalars['ID']['input']>;
	invoiceDateEnd?: InputMaybe<Scalars['Date']['input']>;
	invoiceDateStart?: InputMaybe<Scalars['Date']['input']>;
	invoiceNumber?: InputMaybe<Scalars['String']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	sort?: Array<InvoiceSort>;
	sourceId?: InputMaybe<Scalars['ID']['input']>;
	status?: InputMaybe<InvoiceStatus>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinessproductArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessproductsArgs = {
	isArchived?: InputMaybe<Scalars['Boolean']['input']>;
	isBought?: InputMaybe<Scalars['Boolean']['input']>;
	isSold?: InputMaybe<Scalars['Boolean']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	sort?: Array<ProductSort>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinesssalesTaxArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinesssalesTaxesArgs = {
	isArchived?: InputMaybe<Scalars['Boolean']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
};

/** An organization and legal entity made up of an association of people. */
export type BusinessvendorArgs = {
	id: Scalars['ID']['input'];
};

/** An organization and legal entity made up of an association of people. */
export type BusinessvendorsArgs = {
	email?: InputMaybe<Scalars['String']['input']>;
	modifiedAtAfter?: InputMaybe<Scalars['DateTime']['input']>;
	modifiedAtBefore?: InputMaybe<Scalars['DateTime']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
};

/** Business connection. */
export type BusinessConnection = {
	/** List of businesses. */
	edges: Array<BusinessEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Business edge. */
export type BusinessEdge = {
	/** A business. */
	node?: Maybe<Business>;
};

/** An object belonging to a `Business` with an `ID`. */
export type BusinessNode = {
	/** Business that the node belongs to. */
	business: Business;
	/** ID of the object. */
	id: Scalars['ID']['output'];
};

/** Granular area of focus of a business. */
export type BusinessSubtype = {
	/** The description of the business subtype in human-friendly form. */
	name: Scalars['String']['output'];
	/** The enum value of the business subtype. */
	value: BusinessSubtypeValue;
};

/** Granular area of focus of a business. */
export type BusinessSubtypeValue =
	/** Advertising, Public Relations */
	| 'ADVERTISING_PUBLIC_RELATIONS'
	/** Agriculture, Ranching and Farming */
	| 'AGRICULTURE_RANCHING_FARMING'
	/** Actor */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__ACTOR'
	/** Audio/Visual Production */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__AUDIO_VISUAL_PRODUCTION'
	/** Craftsperson */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__CRAFTSPERSON'
	/** Dancer, Choreographer */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__DANCER_CHOREOG'
	/** Musician */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__MUSICIAN'
	/** Other Creative */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__OTHER'
	/** Performing Arts (acting, music, dance) */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__PERFORMING_ARTS_ACTING_MUSIC_DANCE'
	/** Photographer */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__PHOTOGRAPHER'
	/** Visual Artist */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE__VISUAL_ARTIST'
	/** Automotive Repair & Sales */
	| 'AUTOMOTIVE_SALES_AND_REPAIR'
	/** Church, Religious Organization */
	| 'CHURCH_RELIGIOUS_ORGANIZATION'
	/** Contractor */
	| 'CONSTRUCTION_HOME_IMPROVEMENT__CONTRACTOR'
	/** Engineer */
	| 'CONSTRUCTION_HOME_IMPROVEMENT__ENGINEER'
	/** Home Inspector */
	| 'CONSTRUCTION_HOME_IMPROVEMENT__HOME_INSPECTOR'
	/** Trade */
	| 'CONSTRUCTION_HOME_IMPROVEMENT__OTHER_TRADES'
	/** Accountant, Bookkeeper */
	| 'CONSULTANTS_PROFESSIONALS__ACCOUNTANTS_BOOKKEEPERS'
	/** Communications, Marketing, PR */
	| 'CONSULTANTS_PROFESSIONALS__COMMUNICATIONS'
	/** Executive Coach */
	| 'CONSULTANTS_PROFESSIONALS__EXECUTIVE_COACH'
	/** HR, Recruitment, Staffing */
	| 'CONSULTANTS_PROFESSIONALS__HR_RECRUITMENT_STAFFING'
	/** IT, Technical */
	| 'CONSULTANTS_PROFESSIONALS__IT_TECHNICAL'
	/** Other Consultant */
	| 'CONSULTANTS_PROFESSIONALS__OTHER'
	/** Sales */
	| 'CONSULTANTS_PROFESSIONALS__SALES'
	/** Design, Architecture, Engineering */
	| 'DESIGN_ARCHITECTURE_ENGINEERING'
	/** Other Financial Service */
	| 'FINANCIAL_SERVICES'
	/** Salon, Spa */
	| 'HAIR_SPA_AESTHETICS__HAIR_SALON'
	/** Massage */
	| 'HAIR_SPA_AESTHETICS__MASSAGE'
	/** Nails, Skin, Aesthetics */
	| 'HAIR_SPA_AESTHETICS__NAIL_SKIN_AESTHETICS'
	/** Other Aesthetics/Spa */
	| 'HAIR_SPA_AESTHETICS__OTHER'
	/** Insurance Agency, Broker */
	| 'INSURANCE_AGENCY_BROKER'
	/** Landlord */
	| 'LANDLORD_PROPERTY_MANAGER__LANDLORD'
	/** Property Manager */
	| 'LANDLORD_PROPERTY_MANAGER__PROPERTY_MANAGER'
	/** Lawn Care, Landscaping */
	| 'LAWN_CARE_LANDSCAPING'
	/** Legal Services */
	| 'LEGAL_SERVICES'
	/** Lodging, Hotel, Motel */
	| 'LODGING_HOTEL_MOTEL'
	/** Manufacturing Representative, Agent */
	| 'MANUFACTURER_REPRESENTATIVE_AGENT'
	/** Chiropractor */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__CHIROPRACTOR'
	/** Dentist */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__DENTIST'
	/** Fitness */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__FITNESS'
	/** Massage Therapist */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__MASSAGE_THERAPIST'
	/** Mental Health */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__MENTAL_HEALTH'
	/** Nutrition */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__NUTRITION'
	/** Occupational Therapist */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__OCCUP_THERAPIST'
	/** Other Health */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__OTHER'
	/** Physical Therapist */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE__PHYSICAL_THERAPIST'
	/** Association */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__ASSOCIATION'
	/** Charity */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__CHARITABLE'
	/** Club */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__CLUB'
	/** Condo */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__CONDO'
	/** Other Non-Profit */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__OTHER'
	/** Parent Booster USA */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS__PARENT_BOOSTER'
	/** Other (please specify) */
	| 'OTHER__OTHER_PLEASE_SPECIFY'
	/** Manufacturer */
	| 'PRODUCT_PROVIDER__MANUFACTURER'
	/** Manufacturer and Vendor */
	| 'PRODUCT_PROVIDER__MANUFACTURER_AND_VENDOR'
	/** Other Product-based Business */
	| 'PRODUCT_PROVIDER__OTHER'
	/** Vendor */
	| 'PRODUCT_PROVIDER__VENDOR'
	/** Real Estate Agent */
	| 'REAL_ESTATE_SALES__AGENT'
	/** Real Estate Broker */
	| 'REAL_ESTATE_SALES__BROKER'
	/** Other Real Estate */
	| 'REAL_ESTATE_SALES__OTHER'
	/** Real Estate Rental */
	| 'RENTAL'
	/** Repairs/Maintenance */
	| 'REPAIR_AND_MAINTENANCE'
	/** Restaurant, Caterer, Bar */
	| 'RESTAURANT_CATERER_BAR'
	/** eBay Resellers */
	| 'RETAILERS_AND_RESELLERS__EBAY'
	/** Etsy Vendors */
	| 'RETAILERS_AND_RESELLERS__ETSY'
	/** Non-Store Retailers */
	| 'RETAILERS_AND_RESELLERS__NON_STORE_RETAILER'
	/** Other Retailers */
	| 'RETAILERS_AND_RESELLERS__OTHER'
	/** Store Retailers */
	| 'RETAILERS_AND_RESELLERS__STORE_RETAILER'
	/** Sales: Independent Agent */
	| 'SALES_INDEPENDENT_AGENT'
	/** Cleaning, Janitorial Services */
	| 'SERVICE_PROVIDER__CLEANING_JANITORIAL_SERVICES'
	/** Customer Service/Support */
	| 'SERVICE_PROVIDER__CUSTOMER_SERVICE_SUPPORT'
	/** Household Employer */
	| 'SERVICE_PROVIDER__DOMESTIC_CAREGIVER_EMPLOYER'
	/** Fitness */
	| 'SERVICE_PROVIDER__FITNESS'
	/** Office Admin/Support */
	| 'SERVICE_PROVIDER__OFFICE_ADMIN_SUPPORT'
	/** Other Service-based Business */
	| 'SERVICE_PROVIDER__OTHER'
	/** Personal Care */
	| 'SERVICE_PROVIDER__PERSONAL_CARE'
	/** Telemarketing */
	| 'SERVICE_PROVIDER__TELEMARKETING'
	/** Transcription */
	| 'SERVICE_PROVIDER__TRANSCRIPTION'
	/** Transportation, Trucking, Deliver */
	| 'TRANSPORTATION_TRUCKING_DELIVERY'
	/** Designer */
	| 'WEB_MEDIA_FREELANCER__DESIGNER'
	/** Marketing, Social Media */
	| 'WEB_MEDIA_FREELANCER__MARKETING_SOCIAL_MEDIA'
	/** Other Media/Tech */
	| 'WEB_MEDIA_FREELANCER__OTHER'
	/** Programmer */
	| 'WEB_MEDIA_FREELANCER__PROGRAMMER'
	/** SEO */
	| 'WEB_MEDIA_FREELANCER__SEO'
	/** Writer */
	| 'WEB_MEDIA_FREELANCER__WRITER'
	/** Wholesale Distribution and Sales */
	| 'WHOLESALE_DISTRIBUTION_SALES';

/** Area of focus of a business. */
export type BusinessType = {
	/** The description of the business type in human-friendly form. */
	name: Scalars['String']['output'];
	/** The enum value of the business type. */
	value: BusinessTypeValue;
};

/** Area of focus of a business. */
export type BusinessTypeValue =
	/** Artists, Photographers & Creative Types */
	| 'ARTISTS_PHOTOGRAPHERS_CREATIVE'
	/** Consultants & Professionals */
	| 'CONSULTANTS_PROFESSIONALS'
	/** Financial Services */
	| 'FINANCE_INSURANCE'
	/** Hair, Spa & Aesthetics */
	| 'HAIR_SPA_AESTHETICS'
	/** Medical, Dental, Health */
	| 'MEDICAL_DENTAL_HEALTH_SERVICE'
	/** Non-profits, Associations & Groups */
	| 'NONPROFIT_ASSOCIATIONS_GROUPS'
	/** Other (please specify) */
	| 'OTHER'
	/** General: I make or sell a PRODUCT */
	| 'PRODUCT_PROVIDER'
	/** Real Estate, Construction & Home Improvement */
	| 'REALESTATE_HOME'
	/** Retailers, Resellers & Sales */
	| 'RETAILERS_AND_RESELLERS'
	/** General: I provide a SERVICE */
	| 'SERVICE_PROVIDER'
	/** Web, Tech & Media */
	| 'WEB_MEDIA_FREELANCER';

/** Input to the `convertEstimateToInvoice` mutation. */
export type ConvertEstimateToInvoiceInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Out of the `convertEstimateToInvoice` mutation. */
export type ConvertEstimateToInvoiceOutput = {
	/** Indicates whether the estimate was succesfully converted to an invoice. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** The unique identifier for the invoice that was created. */
	invoiceId: Scalars['ID']['output'];
};

/** A country. */
export type Country = {
	/** Country code. */
	code: CountryCode;
	/** Default currency of the country. */
	currency: Currency;
	/** Plain-language representation. */
	name: Scalars['String']['output'];
	/** Name of the country with the appropriate article. */
	nameWithArticle: Scalars['String']['output'];
	/** List of principal subdivisions. */
	provinces: Array<Province>;
};

/** Country codes ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). */
export type CountryCode =
	/** Andorra */
	| 'AD'
	/** United Arab Emirates */
	| 'AE'
	/** Afghanistan */
	| 'AF'
	/** Antigua and Barbuda */
	| 'AG'
	/** Anguilla */
	| 'AI'
	/** Albania */
	| 'AL'
	/** Armenia */
	| 'AM'
	/** Angola */
	| 'AO'
	/** Antarctica */
	| 'AQ'
	/** Argentina */
	| 'AR'
	/** American Samoa */
	| 'AS'
	/** Austria */
	| 'AT'
	/** Australia */
	| 'AU'
	/** Aruba */
	| 'AW'
	/** Åland Islands */
	| 'AX'
	/** Azerbaijan */
	| 'AZ'
	/** Bosnia and Herzegovina */
	| 'BA'
	/** Barbados */
	| 'BB'
	/** Bangladesh */
	| 'BD'
	/** Belgium */
	| 'BE'
	/** Burkina Faso */
	| 'BF'
	/** Bulgaria */
	| 'BG'
	/** Bahrain */
	| 'BH'
	/** Burundi */
	| 'BI'
	/** Benin */
	| 'BJ'
	/** Saint Barthélemy */
	| 'BL'
	/** Bermuda */
	| 'BM'
	/** Brunei Darussalam */
	| 'BN'
	/** Bolivia, Plurinational State of */
	| 'BO'
	/** Bonaire, Sint Eustatius and Saba */
	| 'BQ'
	/** Brazil */
	| 'BR'
	/** Bahamas */
	| 'BS'
	/** Bhutan */
	| 'BT'
	/** Bouvet Island */
	| 'BV'
	/** Botswana */
	| 'BW'
	/** Belarus */
	| 'BY'
	/** Belize */
	| 'BZ'
	/** Canada */
	| 'CA'
	/** Cocos (Keeling) Islands */
	| 'CC'
	/** Congo, The Democratic Republic of the */
	| 'CD'
	/** Central African Republic */
	| 'CF'
	/** Congo */
	| 'CG'
	/** Switzerland */
	| 'CH'
	/** Côte d'Ivoire */
	| 'CI'
	/** Cook Islands */
	| 'CK'
	/** Chile */
	| 'CL'
	/** Cameroon */
	| 'CM'
	/** China */
	| 'CN'
	/** Colombia */
	| 'CO'
	/** Costa Rica */
	| 'CR'
	/** Cuba */
	| 'CU'
	/** Cape Verde */
	| 'CV'
	/** Curaçao */
	| 'CW'
	/** Christmas Island */
	| 'CX'
	/** Cyprus */
	| 'CY'
	/** Czech Republic */
	| 'CZ'
	/** Germany */
	| 'DE'
	/** Djibouti */
	| 'DJ'
	/** Denmark */
	| 'DK'
	/** Dominica */
	| 'DM'
	/** Dominican Republic */
	| 'DO'
	/** Algeria */
	| 'DZ'
	/** Ecuador */
	| 'EC'
	/** Estonia */
	| 'EE'
	/** Egypt */
	| 'EG'
	/** Western Sahara */
	| 'EH'
	/** Eritrea */
	| 'ER'
	/** Spain */
	| 'ES'
	/** Ethiopia */
	| 'ET'
	/** Finland */
	| 'FI'
	/** Fiji */
	| 'FJ'
	/** Falkland Islands */
	| 'FK'
	/** Micronesia, Federated States of */
	| 'FM'
	/** Faroe Islands */
	| 'FO'
	/** France */
	| 'FR'
	/** Gabon */
	| 'GA'
	/** United Kingdom */
	| 'GB'
	/** Grenada */
	| 'GD'
	/** Georgia */
	| 'GE'
	/** French Guiana */
	| 'GF'
	/** Guernsey */
	| 'GG'
	/** Ghana */
	| 'GH'
	/** Gibraltar */
	| 'GI'
	/** Greenland */
	| 'GL'
	/** Gambia */
	| 'GM'
	/** Guinea */
	| 'GN'
	/** Guadeloupe */
	| 'GP'
	/** Equatorial Guinea */
	| 'GQ'
	/** Greece */
	| 'GR'
	/** South Georgia and the South Sandwich Islands */
	| 'GS'
	/** Guatemala */
	| 'GT'
	/** Guam */
	| 'GU'
	/** Guinea-Bissau */
	| 'GW'
	/** Guyana */
	| 'GY'
	/** Hong Kong */
	| 'HK'
	/** Heard Island and McDonald Islands */
	| 'HM'
	/** Honduras */
	| 'HN'
	/** Croatia */
	| 'HR'
	/** Haiti */
	| 'HT'
	/** Hungary */
	| 'HU'
	/** Indonesia */
	| 'ID'
	/** Ireland */
	| 'IE'
	/** Israel */
	| 'IL'
	/** Isle of Man */
	| 'IM'
	/** India */
	| 'IN'
	/** British Indian Ocean Territory */
	| 'IO'
	/** Iraq */
	| 'IQ'
	/** Iran */
	| 'IR'
	/** Iceland */
	| 'IS'
	/** Italy */
	| 'IT'
	/** Jersey */
	| 'JE'
	/** Jamaica */
	| 'JM'
	/** Jordan */
	| 'JO'
	/** Japan */
	| 'JP'
	/** Kenya */
	| 'KE'
	/** Kyrgyzstan */
	| 'KG'
	/** Cambodia */
	| 'KH'
	/** Kiribati */
	| 'KI'
	/** Comoros */
	| 'KM'
	/** Saint Kitts and Nevis */
	| 'KN'
	/** Korea, Democratic People's Republic of */
	| 'KP'
	/** Korea, Republic of */
	| 'KR'
	/** Kuwait */
	| 'KW'
	/** Cayman Islands */
	| 'KY'
	/** Kazakhstan */
	| 'KZ'
	/** Lao People's Democratic Republic */
	| 'LA'
	/** Lebanon */
	| 'LB'
	/** Saint Lucia */
	| 'LC'
	/** Liechtenstein */
	| 'LI'
	/** Sri Lanka */
	| 'LK'
	/** Liberia */
	| 'LR'
	/** Lesotho */
	| 'LS'
	/** Lithuania */
	| 'LT'
	/** Luxembourg */
	| 'LU'
	/** Latvia */
	| 'LV'
	/** Libya */
	| 'LY'
	/** Morocco */
	| 'MA'
	/** Monaco */
	| 'MC'
	/** Moldova, Republic of */
	| 'MD'
	/** Montenegro */
	| 'ME'
	/** Saint Martin */
	| 'MF'
	/** Madagascar */
	| 'MG'
	/** Marshall Islands */
	| 'MH'
	/** North Macedonia */
	| 'MK'
	/** Mali */
	| 'ML'
	/** Myanmar */
	| 'MM'
	/** Mongolia */
	| 'MN'
	/** Macao */
	| 'MO'
	/** Northern Mariana Islands */
	| 'MP'
	/** Martinique */
	| 'MQ'
	/** Mauritania */
	| 'MR'
	/** Montserrat */
	| 'MS'
	/** Malta */
	| 'MT'
	/** Mauritius */
	| 'MU'
	/** Maldives */
	| 'MV'
	/** Malawi */
	| 'MW'
	/** Mexico */
	| 'MX'
	/** Malaysia */
	| 'MY'
	/** Mozambique */
	| 'MZ'
	/** Namibia */
	| 'NA'
	/** New Caledonia */
	| 'NC'
	/** Niger */
	| 'NE'
	/** Norfolk Island */
	| 'NF'
	/** Nigeria */
	| 'NG'
	/** Nicaragua */
	| 'NI'
	/** Netherlands */
	| 'NL'
	/** Norway */
	| 'NO'
	/** Nepal */
	| 'NP'
	/** Nauru */
	| 'NR'
	/** Niue */
	| 'NU'
	/** New Zealand */
	| 'NZ'
	/** Oman */
	| 'OM'
	/** Panama */
	| 'PA'
	/** Peru */
	| 'PE'
	/** French Polynesia */
	| 'PF'
	/** Papua New Guinea */
	| 'PG'
	/** Philippines */
	| 'PH'
	/** Pakistan */
	| 'PK'
	/** Poland */
	| 'PL'
	/** Saint Pierre and Miquelon */
	| 'PM'
	/** Pitcairn */
	| 'PN'
	/** Puerto Rico */
	| 'PR'
	/** Palestine */
	| 'PS'
	/** Portugal */
	| 'PT'
	/** Palau */
	| 'PW'
	/** Paraguay */
	| 'PY'
	/** Qatar */
	| 'QA'
	/** Réunion */
	| 'RE'
	/** Romania */
	| 'RO'
	/** Serbia */
	| 'RS'
	/** Russian Federation */
	| 'RU'
	/** Rwanda */
	| 'RW'
	/** Saudi Arabia */
	| 'SA'
	/** Solomon Islands */
	| 'SB'
	/** Seychelles */
	| 'SC'
	/** Sudan */
	| 'SD'
	/** Sweden */
	| 'SE'
	/** Singapore */
	| 'SG'
	/** Saint Helena, Ascension and Tristan da Cunha */
	| 'SH'
	/** Slovenia */
	| 'SI'
	/** Svalbard and Jan Mayen */
	| 'SJ'
	/** Slovakia */
	| 'SK'
	/** Sierra Leone */
	| 'SL'
	/** San Marino */
	| 'SM'
	/** Senegal */
	| 'SN'
	/** Somalia */
	| 'SO'
	/** Suriname */
	| 'SR'
	/** South Sudan */
	| 'SS'
	/** Sao Tome and Principe */
	| 'ST'
	/** El Salvador */
	| 'SV'
	/** Sint Maarten */
	| 'SX'
	/** Syria */
	| 'SY'
	/** Eswatini */
	| 'SZ'
	/** Turks and Caicos Islands */
	| 'TC'
	/** Chad */
	| 'TD'
	/** French Southern Territories */
	| 'TF'
	/** Togo */
	| 'TG'
	/** Thailand */
	| 'TH'
	/** Tajikistan */
	| 'TJ'
	/** Tokelau */
	| 'TK'
	/** Timor-Leste */
	| 'TL'
	/** Turkmenistan */
	| 'TM'
	/** Tunisia */
	| 'TN'
	/** Tonga */
	| 'TO'
	/** Turkey */
	| 'TR'
	/** Trinidad and Tobago */
	| 'TT'
	/** Tuvalu */
	| 'TV'
	/** Taiwan */
	| 'TW'
	/** Tanzania, United Republic of */
	| 'TZ'
	/** Ukraine */
	| 'UA'
	/** Uganda */
	| 'UG'
	/** United States Minor Outlying Islands */
	| 'UM'
	/** United States */
	| 'US'
	/** Uruguay */
	| 'UY'
	/** Uzbekistan */
	| 'UZ'
	/** Holy See */
	| 'VA'
	/** Saint Vincent and the Grenadines */
	| 'VC'
	/** Venezuela, Bolivarian Republic of */
	| 'VE'
	/** Virgin Islands (British) */
	| 'VG'
	/** Virgin Islands (U.S) */
	| 'VI'
	/** Viet Nam */
	| 'VN'
	/** Vanuatu */
	| 'VU'
	/** Wallis and Futuna */
	| 'WF'
	/** Samoa */
	| 'WS'
	/** Yemen */
	| 'YE'
	/** Mayotte */
	| 'YT'
	/** South Africa */
	| 'ZA'
	/** Zambia */
	| 'ZM'
	/** Zimbabwe */
	| 'ZW';

/** A medium of exchange in common use. */
export type Currency = {
	/** Currency code. */
	code: CurrencyCode;
	/** Expresses the relationship between a major currency unit and its minor currency unit. The number of digits found to the right of the decimal place to represent the fractional part of this currency (assumes a base of 10). */
	exponent: Scalars['Int']['output'];
	/** Plain-language representation. */
	name: Scalars['String']['output'];
	/** Plural version of currency name. */
	plural: Scalars['String']['output'];
	/** Symbol used to denote that a number is a monetary value. */
	symbol: Scalars['String']['output'];
};

/** Currency codes based on ISO 4217. */
export type CurrencyCode =
	/** UAE dirham */
	| 'AED'
	/** Afghani */
	| 'AFN'
	/** Lek */
	| 'ALL'
	/** Armenian dram */
	| 'AMD'
	/** Netherlands Antillean Guilder */
	| 'ANG'
	/** Kwanza */
	| 'AOA'
	/** Argentinian peso */
	| 'ARS'
	/** Australian dollar */
	| 'AUD'
	/** Aruban Guilder */
	| 'AWG'
	/** New Manat */
	| 'AZN'
	/** Convertible Marks */
	| 'BAM'
	/** Barbados dollar */
	| 'BBD'
	/** Taka */
	| 'BDT'
	/** Lev */
	| 'BGN'
	/** Bahraini dinar */
	| 'BHD'
	/** Burundi franc */
	| 'BIF'
	/** Bermuda dollar */
	| 'BMD'
	/** Brunei dollar */
	| 'BND'
	/** Boliviano */
	| 'BOB'
	/** Real */
	| 'BRL'
	/** Bahamian dollar */
	| 'BSD'
	/** Ngultrum */
	| 'BTN'
	/** Pula */
	| 'BWP'
	/** Belarussian rouble */
	| 'BYR'
	/** Belize dollar */
	| 'BZD'
	/** Canadian dollar */
	| 'CAD'
	/** Franc congolais */
	| 'CDF'
	/** Swiss franc */
	| 'CHF'
	/** Chilean peso */
	| 'CLP'
	/** Ren-Min-Bi yuan */
	| 'CNY'
	/** Colombian peso */
	| 'COP'
	/** Costa Rican colon */
	| 'CRC'
	/** Cuban peso */
	| 'CUP'
	/** Cape Verde escudo */
	| 'CVE'
	/** Czech koruna */
	| 'CZK'
	/** Djibouti franc */
	| 'DJF'
	/** Danish krone */
	| 'DKK'
	/** Dominican peso */
	| 'DOP'
	/** Algerian dinar */
	| 'DZD'
	/** Estonian kroon */
	| 'EEK'
	/** Egyptian pound */
	| 'EGP'
	/** Nakfa */
	| 'ERN'
	/** Ethiopian birr */
	| 'ETB'
	/** Euro */
	| 'EUR'
	/** Fiji dollar */
	| 'FJD'
	/** Falkland Islands (Malvinas) Pound */
	| 'FKP'
	/** Pound sterling */
	| 'GBP'
	/** Lari */
	| 'GEL'
	/** Ghana Cedi */
	| 'GHS'
	/** Gibraltar pound */
	| 'GIP'
	/** Dalasi */
	| 'GMD'
	/** Guinean franc */
	| 'GNF'
	/** Quetzal */
	| 'GTQ'
	/** Guinean bissau Peso */
	| 'GWP'
	/** Guyana dollar */
	| 'GYD'
	/** Hong Kong dollar */
	| 'HKD'
	/** Lempira */
	| 'HNL'
	/** Kuna */
	| 'HRK'
	/** Haitian gourde */
	| 'HTG'
	/** Forint */
	| 'HUF'
	/** Rupiah */
	| 'IDR'
	/** New Israeli sheqel */
	| 'ILS'
	/** Indian rupee */
	| 'INR'
	/** Iraqi dinar */
	| 'IQD'
	/** Iranian rial */
	| 'IRR'
	/** Icelandic Krona */
	| 'ISK'
	/** Jamaican dollar */
	| 'JMD'
	/** Jordanian dinar */
	| 'JOD'
	/** Yen */
	| 'JPY'
	/** Kenyan shilling */
	| 'KES'
	/** Kyrgyz Som */
	| 'KGS'
	/** Riel */
	| 'KHR'
	/** Comoro franc */
	| 'KMF'
	/** Won */
	| 'KRW'
	/** Kuwaiti dinar */
	| 'KWD'
	/** Cayman Islands dollar */
	| 'KYD'
	/** Tenge */
	| 'KZT'
	/** Kip */
	| 'LAK'
	/** Lebanese pound */
	| 'LBP'
	/** Sri Lankan rupee */
	| 'LKR'
	/** Liberian dollar */
	| 'LRD'
	/** Loti */
	| 'LSL'
	/** Lithuanian litus */
	| 'LTL'
	/** Latvian lats */
	| 'LVL'
	/** Libyan dinar */
	| 'LYD'
	/** Moroccan dirham */
	| 'MAD'
	/** Moldovan leu */
	| 'MDL'
	/** Malagasy Ariary */
	| 'MGA'
	/** Denar */
	| 'MKD'
	/** Kyat */
	| 'MMK'
	/** Tugrik */
	| 'MNT'
	/** Pataca */
	| 'MOP'
	/** Ouguiya */
	| 'MRO'
	/** Ouguiya */
	| 'MRU'
	/** Mauritian rupee */
	| 'MUR'
	/** Rufiyaa */
	| 'MVR'
	/** Kwacha */
	| 'MWK'
	/** Mexican peso */
	| 'MXN'
	/** Malaysian ringgit */
	| 'MYR'
	/** Metical */
	| 'MZN'
	/** Namibian dollar */
	| 'NAD'
	/** Naira */
	| 'NGN'
	/** Cordoba Oro */
	| 'NIO'
	/** Norwegian krone */
	| 'NOK'
	/** Nepalese rupee */
	| 'NPR'
	/** New Zealand dollar */
	| 'NZD'
	/** Omani rial */
	| 'OMR'
	/** Balboa */
	| 'PAB'
	/** Nuevo Sol */
	| 'PEN'
	/** Kina */
	| 'PGK'
	/** Philippine peso */
	| 'PHP'
	/** Pakistani rupee */
	| 'PKR'
	/** Zloty */
	| 'PLN'
	/** Guarani */
	| 'PYG'
	/** Qatari riyal */
	| 'QAR'
	/** New Leu */
	| 'RON'
	/** Serbian Dinar */
	| 'RSD'
	/** Russian rouble */
	| 'RUB'
	/** Rwanda franc */
	| 'RWF'
	/** Saudi riyal */
	| 'SAR'
	/** Solomon Islands Dollar */
	| 'SBD'
	/** Seychelles rupee */
	| 'SCR'
	/** Sudanese Pound */
	| 'SDG'
	/** Swedish Krona */
	| 'SEK'
	/** Singapore dollar */
	| 'SGD'
	/** Saint Helena Pound */
	| 'SHP'
	/** Leone */
	| 'SLL'
	/** Somali shilling */
	| 'SOS'
	/** Surinam dollar */
	| 'SRD'
	/** South Sudanese pound */
	| 'SSP'
	/** Dobra */
	| 'STD'
	/** El Salvador colon */
	| 'SVC'
	/** Syrian pound */
	| 'SYP'
	/** Lilangeni */
	| 'SZL'
	/** Baht */
	| 'THB'
	/** Somoni */
	| 'TJS'
	/** Manat */
	| 'TMM'
	/** Tunisian dinar */
	| 'TND'
	/** Pa'anga */
	| 'TOP'
	/** Turkish Lira */
	| 'TRY'
	/** Trinidad and Tobago dollar */
	| 'TTD'
	/** Taiwan New Dollar */
	| 'TWD'
	/** Tanzanian shilling */
	| 'TZS'
	/** Hryvnia */
	| 'UAH'
	/** Ugandan shilling */
	| 'UGX'
	/** United States dollar */
	| 'USD'
	/** Uruguayo peso */
	| 'UYU'
	/** Uzbekistan sum */
	| 'UZS'
	/** Bolivar Fuerte */
	| 'VEF'
	/** Dong */
	| 'VND'
	/** Vatu */
	| 'VUV'
	/** Samoan Tala */
	| 'WST'
	/** CFA Franc - BEAC */
	| 'XAF'
	/** Eastern Caribbean dollar */
	| 'XCD'
	/** CFA franc - BCEAO */
	| 'XOF'
	/** Comptoirs Francais du Pacifique Francs */
	| 'XPF'
	/** Yemeni rial */
	| 'YER'
	/** Rand */
	| 'ZAR'
	/** Kwacha */
	| 'ZMK'
	/** Kwacha */
	| 'ZMW'
	/** Zimbabwean dollar */
	| 'ZWD';

/** A customer of the business. */
export type Customer = BusinessNode &
	Node & {
		/** Address of the customer. */
		address?: Maybe<Address>;
		/** Business that the customer belongs to. */
		business: Business;
		/** When the customer was created. */
		createdAt: Scalars['DateTime']['output'];
		/** Default currency used by the customer. */
		currency?: Maybe<Currency>;
		/** User defined id for the customer. Commonly referred to as Account Number. */
		displayId?: Maybe<Scalars['String']['output']>;
		/** Email of the principal contact. */
		email?: Maybe<Scalars['String']['output']>;
		/** Fax number of the customer. */
		fax?: Maybe<Scalars['String']['output']>;
		/** First name of the principal contact. */
		firstName?: Maybe<Scalars['String']['output']>;
		/** Unique identifier for the customer. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
		/** Internal notes about the customer. */
		internalNotes?: Maybe<Scalars['String']['output']>;
		/** Whether or not the customer is active. If false the customer has been deleted */
		isActive?: Maybe<Scalars['Boolean']['output']>;
		/** Whether or not the customer is archived. */
		isArchived?: Maybe<Scalars['Boolean']['output']>;
		/** Last name of the principal contact. */
		lastName?: Maybe<Scalars['String']['output']>;
		/** Mobile telephone number of the principal contact. */
		mobile?: Maybe<Scalars['String']['output']>;
		/** When the customer was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Name or business name of the customer. */
		name: Scalars['String']['output'];
		/** Amount due on customer's invoices. */
		outstandingAmount: Money;
		/** Amount due on customer's invoices with due date that have passed. */
		overdueAmount: Money;
		/** Telephone number of the customer. */
		phone?: Maybe<Scalars['String']['output']>;
		/** Details for shipping to the customer. */
		shippingDetails?: Maybe<CustomerShippingDetails>;
		/** Toll-free number of the customer. */
		tollFree?: Maybe<Scalars['String']['output']>;
		/** Website address of the customer. */
		website?: Maybe<Scalars['String']['output']>;
	};

/** Customer connection. */
export type CustomerConnection = {
	/** List of customers. */
	edges: Array<CustomerEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Input to the `customerCreate` mutation. */
export type CustomerCreateInput = {
	/** Address */
	address?: InputMaybe<AddressInput>;
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Default currency used by the customer. */
	currency?: InputMaybe<CurrencyCode>;
	/** User defined id for the customer. */
	displayId?: InputMaybe<Scalars['String']['input']>;
	/** Email of the principal contact. */
	email?: InputMaybe<Scalars['String']['input']>;
	/** Fax number of the customer. */
	fax?: InputMaybe<Scalars['String']['input']>;
	/** First name of the principal contact. */
	firstName?: InputMaybe<Scalars['String']['input']>;
	/** Internal notes about the customer. */
	internalNotes?: InputMaybe<Scalars['String']['input']>;
	/** Last name of the principal contact. */
	lastName?: InputMaybe<Scalars['String']['input']>;
	/** Mobile telephone number of the principal contact. */
	mobile?: InputMaybe<Scalars['String']['input']>;
	/** Name or business name of the customer. */
	name: Scalars['String']['input'];
	/** Telephone number of the customer. */
	phone?: InputMaybe<Scalars['String']['input']>;
	/** Details for shipping to the customer. */
	shippingDetails?: InputMaybe<CustomerShippingDetailsInput>;
	/** Toll-free number of the customer. */
	tollFree?: InputMaybe<Scalars['String']['input']>;
	/** Website address of the customer. */
	website?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `customerCreate` mutation. */
export type CustomerCreateOutput = {
	/** Customer that was created. */
	customer?: Maybe<Customer>;
	/** Indicates whether the customer was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `customerDelete` mutation. */
export type CustomerDeleteInput = {
	/** The unique identifier for the customer. */
	id: Scalars['ID']['input'];
};

/** Output of the `customerDelete` mutation. */
export type CustomerDeleteOutput = {
	/** Indicates whether the customer was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Customer edge. */
export type CustomerEdge = {
	/** A customer. */
	node?: Maybe<Customer>;
};

/** Input to the `customerPatch` mutation. */
export type CustomerPatchInput = {
	/** Address */
	address?: InputMaybe<AddressInput>;
	/** Default currency used by the customer. */
	currency?: InputMaybe<CurrencyCode>;
	/** User defined id for the customer. */
	displayId?: InputMaybe<Scalars['String']['input']>;
	/** Email of the principal contact. */
	email?: InputMaybe<Scalars['String']['input']>;
	/** Fax number of the customer. */
	fax?: InputMaybe<Scalars['String']['input']>;
	/** First name of the principal contact. */
	firstName?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the customer. */
	id: Scalars['ID']['input'];
	/** Internal notes about the customer. */
	internalNotes?: InputMaybe<Scalars['String']['input']>;
	/** Last name of the principal contact. */
	lastName?: InputMaybe<Scalars['String']['input']>;
	/** Mobile telephone number of the principal contact. */
	mobile?: InputMaybe<Scalars['String']['input']>;
	/** Name or business name of the customer. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Telephone number of the customer. */
	phone?: InputMaybe<Scalars['String']['input']>;
	/** Details for shipping to the customer. */
	shippingDetails?: InputMaybe<CustomerPatchShippingDetailsInput>;
	/** Toll-free number of the customer. */
	tollFree?: InputMaybe<Scalars['String']['input']>;
	/** Website address of the customer. */
	website?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `customerPatch` mutation. */
export type CustomerPatchOutput = {
	/** Customer that was patched. */
	customer?: Maybe<Customer>;
	/** Indicates whether the customer was successfully patched. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Shipping details related to a customer. */
export type CustomerPatchShippingDetailsInput = {
	/** Address of the customer. */
	address?: InputMaybe<AddressInput>;
	/** Delivery instructions for handling. */
	instructions?: InputMaybe<Scalars['String']['input']>;
	/** Name or business name of the customer. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Telephone number of the customer. */
	phone?: InputMaybe<Scalars['String']['input']>;
};

/** Shipping details related to a customer. */
export type CustomerShippingDetails = {
	/** Address of the customer. */
	address?: Maybe<Address>;
	/** Delivery instructions for handling. */
	instructions?: Maybe<Scalars['String']['output']>;
	/** Name or business name of the customer. */
	name?: Maybe<Scalars['String']['output']>;
	/** Telephone number of the customer. */
	phone?: Maybe<Scalars['String']['output']>;
};

/** Shipping details related to a customer. */
export type CustomerShippingDetailsInput = {
	/** Address of the customer. */
	address?: InputMaybe<AddressInput>;
	/** Delivery instructions for handling. */
	instructions?: InputMaybe<Scalars['String']['input']>;
	/** Name or business name of the customer. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Telephone number of the customer. */
	phone?: InputMaybe<Scalars['String']['input']>;
};

/** Options by which customers can be ordered. */
export type CustomerSort =
	/** Ascending by creation time. */
	| 'CREATED_AT_ASC'
	/** Descending by creation time. */
	| 'CREATED_AT_DESC'
	/** Ascending by modified time. */
	| 'MODIFIED_AT_ASC'
	/** Descending by modified time. */
	| 'MODIFIED_AT_DESC'
	/** Ascending by name. */
	| 'NAME_ASC'
	/** Descending by name. */
	| 'NAME_DESC';

/** An approximate bill given to a buyer indicating the products or services, quantities, and expected prices (not a request for payment). Refers to classic estimates in the old platform. */
export type Estimate = BusinessNode &
	Node & {
		/** Business that the Estimate belongs to */
		business: Business;
		/** Unique identifier for the estimate. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
	};

/** Input to the `estimateApprove` mutation. */
export type EstimateApproveInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateApprove` mutation. */
export type EstimateApproveOutput = {
	/** Indicates whether the estimate was successfully approved. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was approved. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateClone` mutation. */
export type EstimateCloneInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateClone` mutation. */
export type EstimateCloneOutput = {
	/** Indicates whether the estimate was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was cloned. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Estimate connection. */
export type EstimateConnection = {
	/** List of estimates. */
	edges: Array<EstimateEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Estimate Discount. */
export type EstimateCreateDiscountInput = {
	/** Discount amount (for FIXED-type discounts). */
	amount?: InputMaybe<Scalars['Decimal']['input']>;
	/** Discount type. */
	discountType: EstimateDiscountType;
	/** Discount name. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Discount percentage (for PERCENTAGE-type discounts). */
	percentage?: InputMaybe<Scalars['Decimal']['input']>;
};

/** Input to the `estimateCreate` mutation. */
export type EstimateCreateInput = {
	/** The label for the 'Amount' (= unit x price) column in the listing of line items on the estimate. If not provided, will use the business's default estimate column amount title. */
	amountTitle?: InputMaybe<Scalars['String']['input']>;
	/** List of attachment ids to be associated with the estimate. */
	attachmentIds?: InputMaybe<Array<Scalars['String']['input']>>;
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Currency of the estimate. If not provided, will use the business's default currency. */
	currency?: InputMaybe<CurrencyCode>;
	/** The customer identifier to associate with estimate. */
	customerId: Scalars['ID']['input'];
	/** Indicates whether the deposits can be accepted on the estimate */
	depositStatus?: InputMaybe<EstimateDepositStatusType>;
	/** Indicates the unit of the deposit value */
	depositUnit?: InputMaybe<EstimateDepositUnitType>;
	/** Indicates the value of the deposit either amount in cents or percentage */
	depositValue?: InputMaybe<Scalars['Decimal']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estimate has been marked to not be payable by american express payment. If not provided, will use the business's default estimate settings american express payment state. */
	disableAmexPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept bank payments, indicates if this individual estimate has been marked to not be payable by bank payment. If not provided, will use the business's default estimate bank payment state. */
	disableBankPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estiamte has been marked to not be payable by card. If not provided, will use the business's default estimate credit card payment state. */
	disableCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** The discounts applied to estimate. */
	discounts?: InputMaybe<Array<EstimateCreateDiscountInput>>;
	/** Indicates whether the estimate memo (notes) should not be carried over when the estimate is converted to an invoice. */
	dontCarryOverNotesToInvoice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Date when payment is due. If not provided, will apply the business's default estimate payment terms to `estimateDate` value. */
	dueDate?: InputMaybe<Scalars['Date']['input']>;
	/** Date when estimate is issued. If not provided, will use today's date */
	estimateDate?: InputMaybe<Scalars['Date']['input']>;
	/** Unique number assigned to the estimate. If not provided, one will be system generated. */
	estimateNumber?: InputMaybe<Scalars['String']['input']>;
	/** Exchange rate to business's currency from the estimate's currency. Used to value the estimate income within Wave's accounting transactions. */
	exchangeRate?: InputMaybe<Scalars['Decimal']['input']>;
	/** Estimate footer text. If not provided, will use the business's default estimate footer. */
	footer?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether item's amount is hidden in the line items listing. If not provided, will use the business's default estimate item amount visibility. */
	hideAmount?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's description in item column is hidden in the line items listing. If not provided, will use the business's default estimate item description visibility. */
	hideDescription?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's product name in item column is hidden in the line items listing. If not provided, will use the business's default estimate item name visibility. */
	hideName?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's price is hidden in the line items listing. If not provided, will use the business's default estimate item price visibility. */
	hidePrice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's unit is hidden in the line items listing. If not provided, will use the business's default estimate item unit visibility. */
	hideUnit?: InputMaybe<Scalars['Boolean']['input']>;
	/** The label for the 'Item' column in the listing of line items on the estimate. If not provided, will use the business's default estimate column item title. */
	itemTitle?: InputMaybe<Scalars['String']['input']>;
	/** The line items (product, unit and price) that make up the estimated sale. */
	items?: InputMaybe<Array<EstimateCreateItemInput>>;
	/** Estimate memo (notes) text. If not provided, will use the business's default estimate memo. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** Purchase order or sales order number for the estimate. */
	poNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Price' column in the listing of line items on the estimate. If not provided, will use the business's default estimate column price title. */
	priceTitle?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether the customer is required to accept the terms of service. */
	requireTermsOfServiceAgreement?: InputMaybe<Scalars['Boolean']['input']>;
	/** Status of the estimate */
	status?: InputMaybe<EstimateCreateStatus>;
	/** Estimate subheading text. If not provided, will use the business's default estimate subheading. */
	subhead?: InputMaybe<Scalars['String']['input']>;
	/** Estimate title at the top of the document. If not provided, will use the business's default estimate title. */
	title?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Unit' column in the listing of line items on the estimate. If not provided, will use the business's default estimate column unit title. */
	unitTitle?: InputMaybe<Scalars['String']['input']>;
};

/** Estimate line item. */
export type EstimateCreateItemInput = {
	/** Override product's description. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Product's name. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Associated product. */
	productId: Scalars['ID']['input'];
	/** Number of units (rounded to nearest 8 decimal places with ties going away from zero). */
	quantity?: InputMaybe<Scalars['Decimal']['input']>;
	/** Taxes. To have the product's default sales taxes applied, provide `undefined` as the value. */
	taxes?: InputMaybe<Array<EstimateCreateItemTaxInput>>;
	/** Override product's unitPrice. Price per unit in the major currency unit (rounded to nearest 8 decimal places with ties going away from zero). */
	unitPrice: Scalars['Decimal']['input'];
};

/** Estimate line item's sales tax. */
export type EstimateCreateItemTaxInput = {
	/** Sales tax. */
	salesTaxId: Scalars['ID']['input'];
};

/** Output of the `estimateCreate` mutation. */
export type EstimateCreateOutput = {
	/** Indicates whether the estimate was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was created. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Status of an estimate that is allowed for creation */
export type EstimateCreateStatus =
	/** The estimate is still a draft. */
	'DRAFT';

/** Input to the `estimateDelete` mutation. */
export type EstimateDeleteInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateDelete` mutation. */
export type EstimateDeleteOutput = {
	/** Indicates whether the estimate was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateDepositPaymentCreateManual` mutation. */
export type EstimateDepositPaymentCreateManualInput = {
	/** Payment amount in dollars and cents. eg 123.45 */
	amount: Scalars['Decimal']['input'];
	/** The unique global identifier for the estimate. This encoded ID also contains the bizId. */
	estimateId: Scalars['ID']['input'];
	/** Memo / Notes. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the payment account. */
	paymentAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Actual payment date. */
	paymentDate: Scalars['Date']['input'];
	/** Payment method. */
	paymentMethod: EstimatePaymentMethod;
};

/** Input to the `EstimateDepositPaymentReceiptSend` mutation. */
export type EstimateDepositPaymentReceiptSendInput = {
	/** Include a PDF of the invoice as an attachment. */
	attachPdf?: InputMaybe<Scalars['Boolean']['input']>;
	/** Email addresses to receive an email. */
	ccMyself?: InputMaybe<Scalars['Boolean']['input']>;
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
	/** The unique identifier for the estimate payment. */
	estimatePaymentId: Scalars['ID']['input'];
	/** The address the email is from. */
	fromAddress?: InputMaybe<Scalars['String']['input']>;
	/** Message body of the email. */
	message?: InputMaybe<Scalars['String']['input']>;
	/** Subject of the email. */
	subject?: InputMaybe<Scalars['String']['input']>;
	/** Email addresses to receive an email. */
	to: Array<Scalars['String']['input']>;
};

/** Output of the `EstimateDepositPaymentReceiptSend` mutation. */
export type EstimateDepositPaymentReceiptSendOutput = {
	/** Indicates whether the estimate deposit payment receipt was successfully queued for sending. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Estimate deposit unit entity types */
export type EstimateDepositPaymentStatus =
	/** PAID_FULL */
	| 'PAID_FULL'
	/** PAID_PARTIAL */
	| 'PAID_PARTIAL'
	/** UNPAID */
	| 'UNPAID';

/** Input to the `estimateDepositPaymentUpdateManual` mutation. */
export type EstimateDepositPaymentUpdateManualInput = {
	/** Payment amount in dollars and cents. eg 123.45 */
	amount?: InputMaybe<Scalars['Decimal']['input']>;
	/** The unique global identifier for the estimate. This encoded ID also contains the bizId. */
	estimateId: Scalars['ID']['input'];
	/** The unique identifier for the estimate payment. */
	id: Scalars['ID']['input'];
	/** Memo / Notes. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the payment account. */
	paymentAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Actual payment date. */
	paymentDate?: InputMaybe<Scalars['Date']['input']>;
	/** Payment method. */
	paymentMethod?: InputMaybe<EstimatePaymentMethod>;
};

/** Deposit acceptance status type. */
export type EstimateDepositStatusType =
	/** Estimate deposit disabled. */
	| 'DISABLED'
	/** Estimate deposit is mandatory. */
	| 'ENABLED_MANDATORY'
	/** Estimate deposit can be accepted but is not mandatory. */
	| 'ENABLED_OPTIONAL';

/** Deposit unit type. */
export type EstimateDepositUnitType =
	/** Estimate deposit value is an amount in cents. */
	| 'AMOUNT'
	/** Estimate deposit value is a percentage. */
	| 'PERCENTAGE';

/** Common base properties of EstimateDiscounts. */
export type EstimateDiscount = {
	/** When the estimate discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the estimate discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
};

/** Type of estimate discount. */
export type EstimateDiscountType =
	/** Fixed dollar amount discount. */
	| 'FIXED'
	/** Percentage discount. */
	| 'PERCENTAGE';

/** Estimate edge. */
export type EstimateEdge = {
	/** An estimate. */
	node: AREstimate;
};

/** Input to the `estimateGeneratePdf` mutation */
export type EstimateGeneratePdfInput = {
	/** The ID of the estimate */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateGeneratePdf` mutation */
export type EstimateGeneratePdfOutput = {
	/** Indicates whether the estimate PDF was successfully generated */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors */
	inputErrors?: Maybe<Array<InputError>>;
	/** URL of the generated PDF */
	pdfUrl?: Maybe<Scalars['URL']['output']>;
};

/** Estimate history entity types */
export type EstimateHistoryEntityType =
	/** BUSINESS OWNER */
	| 'BUSINESS_OWNER'
	/** CUSTOMER */
	| 'CUSTOMER';

/** Estimate line item. */
export type EstimateItem = {
	/** Income account. */
	account: Account;
	/** Detailed description. */
	description?: Maybe<Scalars['String']['output']>;
	/** Unique id for item. */
	id: Scalars['ID']['output'];
	/** Associated product. */
	product: Product;
	/** Number of units. */
	quantity: Scalars['Decimal']['output'];
	/** Pretax total. */
	subtotal: Money;
	/** Taxes. */
	taxes: Array<EstimateItemTax>;
	/** Total including sales taxes. */
	total: Money;
	/** Price per unit in the major currency unit. */
	unitPrice: Scalars['Decimal']['output'];
};

/** Estimate line item's sales tax. */
export type EstimateItemTax = {
	/** Sales tax amount. */
	amount?: Maybe<Money>;
	/** Sales tax. */
	salesTax: SalesTax;
};

/** Options for filtering estimates by status. */
export type EstimateListStatusFilter =
	/** Accepted estimates filter. */
	| 'ACCEPTED'
	/** Active estimates filter. */
	| 'ACTIVE'
	/** Approved estimates filter. */
	| 'APPROVED'
	/** Converted estimates filter. */
	| 'CONVERTED'
	/** Draft estimates filter. */
	| 'DRAFT'
	/** Expired estimates filter. */
	| 'EXPIRED'
	/** Paid estimates filter. */
	| 'PAID'
	/** Partially paid estimates filter. */
	| 'PARTIAL'
	/** Rejected estimates filter. */
	| 'REJECTED'
	/** Sent estimates filter. */
	| 'SENT'
	/** Unpaid estimates filter. */
	| 'UNPAID'
	/** Viewed estimates filter. */
	| 'VIEWED';

/** Input to the `estimateMarkAccepted` mutation. */
export type EstimateMarkAcceptedInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateMarkAccepted` mutation. */
export type EstimateMarkAcceptedOutput = {
	/** Indicates whether the estimate was successfully marked as accepted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was marked as accepted. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateMarkSent` mutation. */
export type EstimateMarkSentInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
	/** How the estimate was sent. */
	sendMethod: EstimateSendMethod;
	/** When the estimate was sent. */
	sentAt?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Output of the `estimateMarkSent` mutation. */
export type EstimateMarkSentOutput = {
	/** Indicates whether the estimate was successfully marked as sent. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was marked as sent. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimatePatch` mutation. For each value if it's not provided - do not update it. */
export type EstimatePatchInput = {
	/** The label for the 'Amount' (= unit x price) column in the listing of line items on the estimate. */
	amountTitle?: InputMaybe<Scalars['String']['input']>;
	/** List of attachment ids to be associated with the estimate. */
	attachmentIds?: InputMaybe<Array<Scalars['String']['input']>>;
	/** Currency of the estimate. */
	currency: CurrencyCode;
	/** The customer identifier to associate with estimate. */
	customerId: Scalars['ID']['input'];
	/** Indicates whether the deposits can be accepted on the estimate */
	depositStatus?: InputMaybe<EstimateDepositStatusType>;
	/** Indicates the unit of the deposit value */
	depositUnit?: InputMaybe<EstimateDepositUnitType>;
	/** Indicates the value of the deposit either amount in cents or percentage */
	depositValue?: InputMaybe<Scalars['Decimal']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estimate has been marked to not be payable by american express payment. */
	disableAmexPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept bank payments, indicates if this individual estimate has been marked to not be payable by bank payment. */
	disableBankPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual estimate has been marked to not be payable by card. */
	disableCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** The discounts applied to the estimate (currently limited to max 1). */
	discounts?: InputMaybe<Array<EstimateCreateDiscountInput>>;
	/** Indicates whether the estimate memo (notes) should not be carried over when the estimate is converted to an invoice. */
	dontCarryOverNotesToInvoice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Date when payment is due. */
	dueDate: Scalars['Date']['input'];
	/** Date when estimate is issued. */
	estimateDate: Scalars['Date']['input'];
	/** Unique number assigned to the estimate. */
	estimateNumber?: InputMaybe<Scalars['String']['input']>;
	/** Exchange rate to business's currency from the estimate's currency. Used to value the estimate income within Wave's accounting transactions. */
	exchangeRate: Scalars['Decimal']['input'];
	/** Estimate footer text. */
	footer?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether item's amount is hidden in the line items listing. */
	hideAmount?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's description in item column is hidden in the line items listing. */
	hideDescription?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's product name in item column is hidden in the line items listing. */
	hideName?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's price is hidden in the line items listing. */
	hidePrice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's unit is hidden in the line items listing. */
	hideUnit?: InputMaybe<Scalars['Boolean']['input']>;
	/** Unique identifier for the estimate. */
	id: Scalars['ID']['input'];
	/** The label for the 'Item' column in the listing of line items on the estimate. */
	itemTitle?: InputMaybe<Scalars['String']['input']>;
	/** The line items (product, unit and price) that make up the estimated sale. If provided, it would replace all items with given ones. */
	items?: InputMaybe<Array<EstimateCreateItemInput>>;
	/** Estimate memo (notes) text. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** Purchase order or sales order number for the estimate. */
	poNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Price' column in the listing of line items on the estimate. */
	priceTitle?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether the customer is required to accept the terms of service. */
	requireTermsOfServiceAgreement?: InputMaybe<Scalars['Boolean']['input']>;
	/** Status of the Estimate. */
	status: EstimateStatus;
	/** Estimate subheading text. */
	subhead?: InputMaybe<Scalars['String']['input']>;
	/** Estimate title at the top of the document. */
	title: Scalars['String']['input'];
	/** The label for the 'Unit' column in the listing of line items on the estimate. */
	unitTitle?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `estimatePatch` mutation. */
export type EstimatePatchOutput = {
	/** Indicates whether the estimate was successfully updated. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was updated. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Record of estimate payment made for an estimate. Only populated when details of a specific estimate is requested. Does not get populated for a list of estimates. */
export type EstimatePayment = {
	/** Active */
	active?: Maybe<Scalars['Boolean']['output']>;
	/** Amount paid for the Estimate associated with the Estimate Payment. */
	amount?: Maybe<Scalars['String']['output']>;
	/** Confirmation code */
	confirmationCode?: Maybe<Scalars['String']['output']>;
	/** When the payment was created. */
	createdAt: Scalars['DateTime']['output'];
	/** Estimate currency */
	currency?: Maybe<Currency>;
	/** Estimate associated with the estimate payment. */
	estimate?: Maybe<AREstimate>;
	/** Unique identifier for the estimate payment. */
	id: Scalars['ID']['output'];
	/** Estimate Payment memo (notes) text. */
	memo?: Maybe<Scalars['String']['output']>;
	/** When the payment was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** Payment origin */
	origin?: Maybe<Scalars['String']['output']>;
	/** Origin payment ID, set in case of a refund */
	originPaymentId?: Maybe<Scalars['String']['output']>;
	/** AccountId from where the funds are sourced from payment. */
	paymentAccountId: Scalars['String']['output'];
	/** Date payment was made for the Estimate associated with the estimate payment. */
	paymentDate?: Maybe<Scalars['Date']['output']>;
	/** Additional details on the payment made for the Estimate associated with the Estimate Payment. */
	paymentDetails?: Maybe<EstimatePaymentDetail>;
	/** Method of payment used to make payments for the Estimate associated with the Estimate Payment. */
	paymentMethod?: Maybe<EstimatePaymentMethod>;
	/** Payment method ID */
	paymentMethodId?: Maybe<Scalars['String']['output']>;
	/** Payment provider */
	paymentProvider?: Maybe<EstimatePaymentProvider>;
	/** Readonly url for the payment receipt */
	readonlyUrl?: Maybe<Scalars['String']['output']>;
	/** Payment state */
	state?: Maybe<Scalars['String']['output']>;
	/** Payment platform ID */
	transactionId?: Maybe<Scalars['String']['output']>;
	/** Type of transaction */
	transactionType?: Maybe<EstimateTransactionType>;
};

/** Output of the `estimateManualPaymentCreate` mutation. */
export type EstimatePaymentCreateManualOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Entity that was created. */
	estimatePayment?: Maybe<EstimatePayment>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimatePaymentDelete` mutation. */
export type EstimatePaymentDeleteInput = {
	/** The unique identifier for the estimate payment. */
	id: Scalars['ID']['input'];
};

/** Output of the `estimatePaymentDelete` mutation. */
export type EstimatePaymentDeleteOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Payment Detail for the payment made for an Estimate associated with an estimate payment */
export type EstimatePaymentDetail = {
	/** Card expiration month */
	cardExpiryMonth?: Maybe<Scalars['String']['output']>;
	/** Card expiration year */
	cardExpiryYear?: Maybe<Scalars['String']['output']>;
	/** Digital wallets-relevant data like if a payment is made through a digital wallets system (starting with 'ApplePay'). */
	cardSource?: Maybe<Scalars['String']['output']>;
	/** Type of card, such as `Visa`. */
	cardType?: Maybe<Scalars['String']['output']>;
	/** Last four digits of a card. */
	lastFour?: Maybe<Scalars['String']['output']>;
};

/** Estimate payment methods */
export type EstimatePaymentMethod =
	/** Bank transfer. */
	| 'BANK_TRANSFER'
	/** Cash. */
	| 'CASH'
	/** Cheque. */
	| 'CHEQUE'
	/** Credit card. */
	| 'CREDIT_CARD'
	/** Other. */
	| 'OTHER'
	/** Paypal. */
	| 'PAYPAL';

/** Estimate payment provider */
export type EstimatePaymentProvider =
	/** Adyen */
	| 'ADYEN'
	/** Manual */
	| 'MANUAL'
	/** Wpp */
	| 'WPP';

/** Output of the `estimateManualPaymentCreate` mutation. */
export type EstimatePaymentUpdateManualOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Updated payment resource. */
	estimatePayment?: Maybe<EstimatePayment>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateResetAcceptance` mutation. */
export type EstimateResetAcceptanceInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output of the `estimateResetAcceptance` mutation. */
export type EstimateResetAcceptanceOutput = {
	/** Indicates whether the estimate was successfully reset. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was reset. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateSendAcceptanceCustomerEmail` mutation. */
export type EstimateSendAcceptanceCustomerEmailInput = {
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
};

/** Output to the `estimateSendAcceptanceCustomerEmail` mutation. */
export type EstimateSendAcceptanceCustomerEmailOutput = {
	/** Indicates whether the estimate was successfully queued for sending. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was sent. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Input to the `estimateSend` mutation. */
export type EstimateSendInput = {
	/** Include a PDF of the estimate as an attachment. */
	attachPDF?: Scalars['Boolean']['input'];
	/** Carbon copy email. */
	ccMyself?: InputMaybe<Scalars['Boolean']['input']>;
	/** The unique identifier for the estimate. */
	estimateId: Scalars['ID']['input'];
	/** Email address from */
	fromAddress?: InputMaybe<Scalars['String']['input']>;
	/** Hide grand total in the email. */
	hideGrandTotal?: InputMaybe<Scalars['Boolean']['input']>;
	/** Whether attachments should be included in the email. Defaults to false. */
	includeAttachments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Message body of the email. */
	message?: InputMaybe<Scalars['String']['input']>;
	/** Subject line of the email. */
	subject?: InputMaybe<Scalars['String']['input']>;
	/** Email addresses to receive an email. */
	to: Array<Scalars['String']['input']>;
};

/** Estimate send method. */
export type EstimateSendMethod =
	/** Export PDF. */
	| 'EXPORT_PDF'
	/** Gmail */
	| 'GMAIL'
	/** Marked as sent. */
	| 'MARKED_SENT'
	/** Not sent. */
	| 'NOT_SENT'
	/** Outlook. */
	| 'OUTLOOK'
	/** Shared link. */
	| 'SHARED_LINK'
	/** Skipped. */
	| 'SKIPPED'
	/** Wave. */
	| 'WAVE'
	/** Yahoo. */
	| 'YAHOO';

/** Output of the `estimateSend` mutation. */
export type EstimateSendOutput = {
	/** Indicates whether the estimate was successfully queued for sending. */
	didSucceed: Scalars['Boolean']['output'];
	/** Estimate that was sent. */
	estimate?: Maybe<AREstimate>;
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Options by which estimates can be ordered. */
export type EstimateSort =
	/** Ascending by amount due. */
	| 'AMOUNT_DUE_ASC'
	/** Descending by amount due. */
	| 'AMOUNT_DUE_DESC'
	/** Ascending by amount paid. */
	| 'AMOUNT_PAID_ASC'
	/** Descending by amount paid. */
	| 'AMOUNT_PAID_DESC'
	/** Ascending by creation time. */
	| 'CREATED_AT_ASC'
	/** Descending by creation time. */
	| 'CREATED_AT_DESC'
	/** Ascending by customer's name. */
	| 'CUSTOMER_NAME_ASC'
	/** Descending by customer's name. */
	| 'CUSTOMER_NAME_DESC'
	/** Ascending by due date. */
	| 'DUE_AT_ASC'
	/** Descending by due date. */
	| 'DUE_AT_DESC'
	/** Ascending by estimate date. */
	| 'ESTIMATE_DATE_ASC'
	/** Descending by estimate date. */
	| 'ESTIMATE_DATE_DESC'
	/** Ascending by estimate number. */
	| 'ESTIMATE_NUMBER_ASC'
	/** Descending by estimate number. */
	| 'ESTIMATE_NUMBER_DESC'
	/** Ascending by modified date. */
	| 'MODIFIED_AT_ASC'
	/** Descending by modified date. */
	| 'MODIFIED_AT_DESC'
	/** Ascending by status. */
	| 'STATUS_ASC'
	/** Descending by status. */
	| 'STATUS_DESC'
	/** Ascending by total amount. */
	| 'TOTAL_ASC'
	/** Descending by total amount. */
	| 'TOTAL_DESC';

/** Status of an estimate. */
export type EstimateStatus =
	/** The estimate was accepted. */
	| 'ACCEPTED'
	/** The estimate was approved. */
	| 'APPROVED'
	/** The estimate was converted. */
	| 'CONVERTED'
	/** The estimate was deleted. */
	| 'DELETED'
	/** The estimate is still a draft. */
	| 'DRAFT'
	/** The estimate was expired. */
	| 'EXPIRED'
	/** The estimate was rejected. */
	| 'REJECTED'
	/** The estimate was sent. */
	| 'SENT'
	/** The estimate was viewed. */
	| 'VIEWED';

/** Estimate transaction type */
export type EstimateTransactionType =
	/** Deposit */
	| 'DEPOSIT'
	/** Refund */
	| 'REFUND'
	/** Void */
	| 'VOID';

/** A fixed discount applied to an estimate. */
export type FixedEstimateDiscount = EstimateDiscount & {
	/** The amount of the discount. */
	amount?: Maybe<Scalars['Decimal']['output']>;
	/** When the estimate discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the estimate discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
};

/** A fixed discount applied to an Invoice. */
export type FixedInvoiceDiscount = InvoiceDiscount & {
	/** The amount of the discount. */
	amount?: Maybe<Scalars['Decimal']['output']>;
	/** When the invoice discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the invoice discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
};

/** General settings on an invoice and estimate. */
export type GeneralSettings = {
	/** Color to represent the brand of the business. */
	accentColor?: Maybe<Scalars['HexColorCode']['output']>;
	/** Logo of the business. */
	logoUrl?: Maybe<Scalars['URL']['output']>;
};

/** Mutation validation error. */
export type InputError = {
	/** Error code. */
	code?: Maybe<Scalars['String']['output']>;
	/** Error message. */
	message?: Maybe<Scalars['String']['output']>;
	/** Path to the input value. */
	path?: Maybe<Array<Scalars['String']['output']>>;
};

/** Document issued to a buyer for payment indicating the products or services, quantities, and agreed prices. */
export type Invoice = BusinessNode &
	Node & {
		/** Invoice total less amount already paid. */
		amountDue: Money;
		/** Total of all payments so far made against this invoice. */
		amountPaid: Money;
		/** The label for the 'Amount' (= unit x price) column in the listing of line items on the invoice. */
		amountTitle: Scalars['String']['output'];
		/** The anonymous identifier for the PublicInvoice */
		anonymousId: Scalars['ID']['output'];
		/** Attachments for the invoice. */
		attachments?: Maybe<Array<ARAttachment>>;
		/** Business that the invoice belongs to. */
		business: Business;
		/** When the invoice was created. */
		createdAt: Scalars['DateTime']['output'];
		/** Currency of the invoice. */
		currency: Currency;
		/** Customer the invoice is for. */
		customer: Customer;
		/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by American Express. */
		disableAmexPayments: Scalars['Boolean']['output'];
		/** Within a business that is enabled to accept bank payments, indicates if this individual invoice has been marked to not be payable by bank payment. */
		disableBankPayments: Scalars['Boolean']['output'];
		/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by card. */
		disableCreditCardPayments: Scalars['Boolean']['output'];
		/** Total value of all discounts. */
		discountTotal: Money;
		/** Invoice discounts. */
		discounts?: Maybe<Array<InvoiceDiscount>>;
		/** Date when payment is due. */
		dueDate: Scalars['Date']['output'];
		/** Exchange rate to business's currency from the invoice's currency. Used to value the invoice income within Wave's accounting transactions. */
		exchangeRate: Scalars['Decimal']['output'];
		/** Invoice footer text. */
		footer?: Maybe<Scalars['String']['output']>;
		/** Indicates whether item's amount is hidden in the line items listing. */
		hideAmount: Scalars['Boolean']['output'];
		/** Indicates whether item's description in item column is hidden in the line items listing. */
		hideDescription: Scalars['Boolean']['output'];
		/** Indicates whether item's product name in item column is hidden in the line items listing. */
		hideName: Scalars['Boolean']['output'];
		/** Indicates whether item's price is hidden in the line items listing. */
		hidePrice: Scalars['Boolean']['output'];
		/** Indicates whether item's unit is hidden in the line items listing. */
		hideUnit: Scalars['Boolean']['output'];
		/** Unique identifier for the invoice. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
		/** Date when invoice is issued. */
		invoiceDate: Scalars['Date']['output'];
		/** Unique number assigned to the invoice. */
		invoiceNumber: Scalars['String']['output'];
		/** List invoice reminders for an invoice. */
		invoiceReminders: Array<InvoiceReminder>;
		/** The label for the 'Item' column in the line items listing. */
		itemTitle: Scalars['String']['output'];
		/** The line items (product, unit and price) that make up the invoiced sale. */
		items?: Maybe<Array<InvoiceItem>>;
		/** When the invoice was last sent. */
		lastSentAt?: Maybe<Scalars['DateTime']['output']>;
		/** How the invoice was last sent. */
		lastSentVia?: Maybe<InvoiceSendMethod>;
		/** When the invoice was last viewed by the customer. */
		lastViewedAt?: Maybe<Scalars['DateTime']['output']>;
		/** Invoice memo (notes) text. */
		memo?: Maybe<Scalars['String']['output']>;
		/** When the invoice was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Invoice payments */
		payments?: Maybe<Array<Maybe<InvoicePayment>>>;
		/** URL to access PDF representation of the invoice. */
		pdfUrl: Scalars['String']['output'];
		/** Purchase order or sales order number for the invoice. */
		poNumber?: Maybe<Scalars['String']['output']>;
		/** The label for the 'Price' column in the listing of line items on the invoice. */
		priceTitle: Scalars['String']['output'];
		/** Indicates whether the customer is required to accept the terms of service. */
		requireTermsOfServiceAgreement: Scalars['Boolean']['output'];
		/** Entity that was the precursor to the invoice. */
		source?: Maybe<InvoiceSource>;
		/** Status of the Invoice. */
		status: InvoiceStatus;
		/** Invoice subheading text. */
		subhead?: Maybe<Scalars['String']['output']>;
		/** Pretax total. */
		subtotal: Money;
		/** Total of all sales taxes on all line items within the invoice. */
		taxTotal: Money;
		/** Invoice title at the top of the document. */
		title: Scalars['String']['output'];
		/** Total value of the invoice including sales taxes. */
		total: Money;
		/** The label for the 'Unit' column in the listing of line items on the invoice. */
		unitTitle: Scalars['String']['output'];
		/** URL to view the invoice online as seen by a customer. */
		viewUrl: Scalars['String']['output'];
	};

/** Input to the `invoiceApprove` mutation. */
export type InvoiceApproveInput = {
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
};

/** Output of the `invoiceApprove` mutation. */
export type InvoiceApproveOutput = {
	/** Indicates whether the invoice was successfully approved. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was approved. */
	invoice?: Maybe<Invoice>;
};

/** Input to the `invoiceClone` mutation. */
export type InvoiceCloneInput = {
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
};

/** Output of the `invoiceClone` mutation. */
export type InvoiceCloneOutput = {
	/** Indicates whether the invoice was successfully cloned. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was cloned. */
	invoice?: Maybe<Invoice>;
};

/** Invoice connection. */
export type InvoiceConnection = {
	/** List of invoices. */
	edges: Array<InvoiceEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Input to the `invoiceCreate` mutation. */
export type InvoiceCreateInput = {
	/** The label for the 'Amount' (= unit x price) column in the listing of line items on the invoice. If not provided, will use the business's default invoice column amount title. */
	amountTitle?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Currency of the invoice. If not provided, will use the business's default currency. */
	currency?: InputMaybe<CurrencyCode>;
	/** The customer identifier to associate with invoice. */
	customerId: Scalars['ID']['input'];
	/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by american express payment. If not provided, will use the business's default invoice settings american express payment state. */
	disableAmexPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept bank payments, indicates if this individual invoice has been marked to not be payable by bank payment. If not provided, will use the business's default invoice bank payment state. */
	disableBankPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by card. If not provided, will use the business's default invoice credit card payment state. */
	disableCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** The discounts applied to the invoice (currently limited to max 1). */
	discounts?: InputMaybe<Array<InvoiceDiscountInput>>;
	/** Date when payment is due. If not provided, will apply the business's default invoice payment terms to `invoiceDate` value. */
	dueDate?: InputMaybe<Scalars['Date']['input']>;
	/** Exchange rate to business's currency from the invoice's currency. Used to value the invoice income within Wave's accounting transactions. */
	exchangeRate?: InputMaybe<Scalars['Decimal']['input']>;
	/** Invoice footer text. If not provided, will use the business's default invoice footer. */
	footer?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether item's amount is hidden in the line items listing. If not provided, will use the business's default invoice item amount visibility. */
	hideAmount?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's description in item column is hidden in the line items listing. If not provided, will use the business's default invoice item description visibility. */
	hideDescription?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's product name in item column is hidden in the line items listing. If not provided, will use the business's default invoice item name visibility. */
	hideName?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's price is hidden in the line items listing. If not provided, will use the business's default invoice item price visibility. */
	hidePrice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's unit is hidden in the line items listing. If not provided, will use the business's default invoice item unit visibility. */
	hideUnit?: InputMaybe<Scalars['Boolean']['input']>;
	/** Date when invoice is issued. If not provided, will use today's date. */
	invoiceDate?: InputMaybe<Scalars['Date']['input']>;
	/** Unique number assigned to the invoice. If not provided, will find the current largest invoice number and add 1. */
	invoiceNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Item' column in the listing of line items on the invoice. If not provided, will use the business's default invoice column item title. */
	itemTitle?: InputMaybe<Scalars['String']['input']>;
	/** The line items (product, unit and price) that make up the invoiced sale. */
	items?: InputMaybe<Array<InvoiceCreateItemInput>>;
	/** Invoice memo (notes) text. If not provided, will use the business's default invoice memo. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** Purchase order or sales order number for the invoice. */
	poNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Price' column in the listing of line items on the invoice. If not provided, will use the business's default invoice column price title. */
	priceTitle?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether the customer is required to accept the terms of service. */
	requireTermsOfServiceAgreement?: InputMaybe<Scalars['Boolean']['input']>;
	/** Status of the Invoice. */
	status?: InputMaybe<InvoiceCreateStatus>;
	/** Invoice subheading text. If not provided, will use the business's default invoice subheading. */
	subhead?: InputMaybe<Scalars['String']['input']>;
	/** Invoice title at the top of the document. If not provided, will use the business's default invoice title. */
	title?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Unit' column in the listing of line items on the invoice. If not provided, will use the business's default invoice column unit title. */
	unitTitle?: InputMaybe<Scalars['String']['input']>;
};

/** Invoice line item. */
export type InvoiceCreateItemInput = {
	/** Override product's description. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Associated product. */
	productId: Scalars['ID']['input'];
	/** Number of units (rounded to nearest 8 decimal places with ties going away from zero). */
	quantity?: InputMaybe<Scalars['Decimal']['input']>;
	/** Taxes. To have the product's default sales taxes applied, provide `undefined` as the value. */
	taxes?: InputMaybe<Array<InvoiceCreateItemTaxInput>>;
	/** Override product's unitPrice. Price per unit in the major currency unit (rounded to nearest 8 decimal places with ties going away from zero). */
	unitPrice?: InputMaybe<Scalars['Decimal']['input']>;
};

/** Invoice line item's sales tax. */
export type InvoiceCreateItemTaxInput = {
	/** *DEPRECATED - DO NOT USE* Sales Tax Amount is calculated by Wave using your Sales Tax settings. */
	amount?: InputMaybe<Scalars['Decimal']['input']>;
	/** Sales tax. */
	salesTaxId: Scalars['ID']['input'];
};

/** Output of the `invoiceCreate` mutation. */
export type InvoiceCreateOutput = {
	/** Indicates whether the invoice was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was created. */
	invoice?: Maybe<Invoice>;
};

/** Status of an invoice. */
export type InvoiceCreateStatus =
	/** The invoice is still a draft. */
	| 'DRAFT'
	/** The invoice was saved. */
	| 'SAVED';

/** Input to the `invoiceDelete` mutation. */
export type InvoiceDeleteInput = {
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
};

/** Output of the `invoiceDelete` mutation. */
export type InvoiceDeleteOutput = {
	/** Indicates whether the invoice was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Common base properties of InvoiceDiscounts. */
export type InvoiceDiscount = {
	/** When the invoice discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the invoice discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
};

/** Invoice Discount. */
export type InvoiceDiscountInput = {
	/** Discount amount (for FIXED-type discounts). */
	amount?: InputMaybe<Scalars['Decimal']['input']>;
	/** Discount type. */
	discountType: InvoiceDiscountType;
	/** Discount name. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Discount percentage (for PERCENTAGE-type discounts). */
	percentage?: InputMaybe<Scalars['Decimal']['input']>;
};

/** Type of invoice discount. */
export type InvoiceDiscountType =
	/** Fixed dollar amount discount. */
	| 'FIXED'
	/** Type of invoice discount. */
	| 'PERCENTAGE';

/** Invoice edge. */
export type InvoiceEdge = {
	/** An invoice. */
	node: Invoice;
};

/** Business invoice and estimates settings information. */
export type InvoiceEstimateSettings = {
	/** Settings applied to both invoices and estimates. */
	generalSettings: GeneralSettings;
};

/** Invoice line item. */
export type InvoiceItem = {
	/** Income account. */
	account: Account;
	/** Detailed description. */
	description?: Maybe<Scalars['String']['output']>;
	/** Unique id for item. */
	id: Scalars['ID']['output'];
	/**
	 * Price per unit.
	 * @deprecated Use unitPrice to avoid ambiguity in how the value relates to quantity and the subtotal.
	 */
	price: Scalars['Decimal']['output'];
	/** Associated product. */
	product: Product;
	/** Number of units. */
	quantity: Scalars['Decimal']['output'];
	/** Pretax total. */
	subtotal: Money;
	/** Taxes. */
	taxes: Array<InvoiceItemTax>;
	/** Total including sales taxes. */
	total: Money;
	/** Price per unit in the major currency unit. */
	unitPrice: Scalars['Decimal']['output'];
};

/** Invoice line item's sales tax. */
export type InvoiceItemTax = {
	/** Sales tax amount. */
	amount?: Maybe<Money>;
	/**
	 * Sales tax rate.
	 * @deprecated Use `salesTax.rate`. `rate` will be removed on Oct 20th 2022.
	 */
	rate?: Maybe<Scalars['Decimal']['output']>;
	/** Sales tax. */
	salesTax: SalesTax;
};

/** Input to the `invoiceMarkSent` mutation. */
export type InvoiceMarkSentInput = {
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
	/** How the invoice was sent. */
	sendMethod: InvoiceSendMethod;
	/** When the invoice was sent. */
	sentAt?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Output of the `invoiceMarkSent` mutation. */
export type InvoiceMarkSentOutput = {
	/** Indicates whether the invoice was successfully marked as sent. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was marked as sent. */
	invoice?: Maybe<Invoice>;
};

/** Input to the `invoicePatch` mutation. For each value if it's not provided - do not update it. */
export type InvoicePatchInput = {
	/** The label for the 'Amount' (= unit x price) column in the listing of line items on the invoice. */
	amountTitle?: InputMaybe<Scalars['String']['input']>;
	/** Currency of the invoice. */
	currency?: InputMaybe<CurrencyCode>;
	/** The customer identifier to associate with invoice. */
	customerId?: InputMaybe<Scalars['ID']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by american express payment. */
	disableAmexPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept bank payments, indicates if this individual invoice has been marked to not be payable by bank payment. */
	disableBankPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** Within a business that is enabled to accept credit card payments, indicates if this individual invoice has been marked to not be payable by card. */
	disableCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
	/** The discounts applied to the invoice (currently limited to max 1). */
	discounts?: InputMaybe<Array<InvoiceDiscountInput>>;
	/** Date when payment is due. */
	dueDate?: InputMaybe<Scalars['Date']['input']>;
	/** Exchange rate to business's currency from the invoice's currency. Used to value the invoice income within Wave's accounting transactions. */
	exchangeRate?: InputMaybe<Scalars['Decimal']['input']>;
	/** Invoice footer text. */
	footer?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether item's amount is hidden in the line items listing. */
	hideAmount?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's description in item column is hidden in the line items listing. */
	hideDescription?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's product name in item column is hidden in the line items listing. */
	hideName?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's price is hidden in the line items listing. */
	hidePrice?: InputMaybe<Scalars['Boolean']['input']>;
	/** Indicates whether item's unit is hidden in the line items listing. */
	hideUnit?: InputMaybe<Scalars['Boolean']['input']>;
	/** Unique identifier for the invoice. */
	id: Scalars['ID']['input'];
	/** Date when invoice is issued. */
	invoiceDate?: InputMaybe<Scalars['Date']['input']>;
	/** Unique number assigned to the invoice. */
	invoiceNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Item' column in the listing of line items on the invoice. */
	itemTitle?: InputMaybe<Scalars['String']['input']>;
	/** The line items (product, unit and price) that make up the invoiced sale. If provided, it would replace all items with given ones. */
	items?: InputMaybe<Array<InvoiceCreateItemInput>>;
	/** Invoice memo (notes) text. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** Purchase order or sales order number for the invoice. */
	poNumber?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Price' column in the listing of line items on the invoice. */
	priceTitle?: InputMaybe<Scalars['String']['input']>;
	/** Indicates whether the customer is required to accept the terms of service. */
	requireTermsOfServiceAgreement?: InputMaybe<Scalars['Boolean']['input']>;
	/** Status of the Invoice. */
	status?: InputMaybe<InvoiceCreateStatus>;
	/** Invoice subheading text. */
	subhead?: InputMaybe<Scalars['String']['input']>;
	/** Invoice title at the top of the document. */
	title?: InputMaybe<Scalars['String']['input']>;
	/** The label for the 'Unit' column in the listing of line items on the invoice. */
	unitTitle?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `invoicePatch` mutation. */
export type InvoicePatchOutput = {
	/** Indicates whether the invoice was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was created. */
	invoice?: Maybe<Invoice>;
};

/** Record of invoice payment made for an invoice. Only populated when details of a specific invoice is requested. Does not get populated for a list of invoices. */
export type InvoicePayment = BusinessNode &
	Node & {
		/** Account used to make payments for the Invoice associated with the Invoice Payment. */
		account: Account;
		/** Last 3 digits of the account number */
		accountNumberLast3?: Maybe<Scalars['String']['output']>;
		/** Accounting Transaction ID */
		accountingTransactionId?: Maybe<Scalars['String']['output']>;
		/** Active */
		active?: Maybe<Scalars['Boolean']['output']>;
		/** Amount paid for the Invoice associated with the Invoice Payment. */
		amount?: Maybe<Scalars['String']['output']>;
		/** Authorizer name */
		authorizerName?: Maybe<Scalars['String']['output']>;
		/** Business that the invoice payment belongs to. */
		business: Business;
		/** Business currency */
		businessCurrency?: Maybe<Currency>;
		/** Confirmation code */
		confirmationCode?: Maybe<Scalars['String']['output']>;
		/** When the payment was created. */
		createdAt: Scalars['DateTime']['output'];
		/** The customer of the payment. */
		customer?: Maybe<Customer>;
		/** Exchange rate to display */
		displayExchangeRate?: Maybe<Scalars['String']['output']>;
		/** Exchange rate between invoice currency and business currency. */
		exchangeRate: Scalars['Decimal']['output'];
		/** Unique identifier for the invoice payment. */
		id: Scalars['ID']['output'];
		/** Institution name */
		institutionName?: Maybe<Scalars['String']['output']>;
		/** Invoice associated with the invoice payment. */
		invoice?: Maybe<Invoice>;
		/** Invoice currency */
		invoiceCurrency?: Maybe<Currency>;
		/** Invoice Payment memo (notes) text. */
		memo?: Maybe<Scalars['String']['output']>;
		/** When the payment was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Payment origin */
		origin?: Maybe<Scalars['String']['output']>;
		/** Original Invoice Payment (present when current payment is a refund) */
		originInvoicePayment?: Maybe<InvoicePayment>;
		/** Payment currency */
		paymentCurrency?: Maybe<Currency>;
		/** Date payment was made for the Invoice associated with the invoice payment. */
		paymentDate?: Maybe<Scalars['Date']['output']>;
		/** Additional details on the payment made for the Invoice associated with the Invoice Payment. */
		paymentDetails?: Maybe<InvoicePaymentDetail>;
		/** Method of payment used to make payments for the Invoice associated with the Invoice Payment. */
		paymentMethod?: Maybe<Scalars['String']['output']>;
		/** Payment method ID */
		paymentMethodId?: Maybe<Scalars['String']['output']>;
		/** Payment provider */
		paymentProvider?: Maybe<Scalars['String']['output']>;
		/** Readonly url for the payment receipt */
		readonlyUrl?: Maybe<Scalars['String']['output']>;
		/** Payment state */
		state?: Maybe<Scalars['String']['output']>;
		/** Payment platform ID */
		transactionId?: Maybe<Scalars['String']['output']>;
		/** Type of transaction */
		transactionType?: Maybe<Scalars['String']['output']>;
	};

/** Input of the `invoiceManualPaymentCreate` mutation. */
export type InvoicePaymentCreateManualInput = {
	/** Payment amount. */
	amount: Scalars['Decimal']['input'];
	/** Exchange rate to payment account's currency from the invoice's currency. Only used if the invoice and payment accounts are in different currencies. */
	exchangeRate: Scalars['Decimal']['input'];
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
	/** Notes. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the payment account. */
	paymentAccountId: Scalars['ID']['input'];
	/** Actual payment date. */
	paymentDate: Scalars['Date']['input'];
	/** Payment method. */
	paymentMethod: InvoicePaymentMethod;
};

/** Output of the `invoiceManualPaymentCreate` mutation. */
export type InvoicePaymentCreateManualOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Entity that was created. */
	invoicePayment?: Maybe<InvoicePayment>;
};

/** Input to the `invoicePaymentDelete` mutation. */
export type InvoicePaymentDeleteInput = {
	/** The unique identifier for the invoice payment. */
	id: Scalars['ID']['input'];
};

/** Output of the `invoicePaymentDelete` mutation. */
export type InvoicePaymentDeleteOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Payment Detail for the payment made for an Invoice associated with an invoice payment */
export type InvoicePaymentDetail = {
	/** Card expiration month */
	cardExpiryMonth?: Maybe<Scalars['String']['output']>;
	/** Card expiration year */
	cardExpiryYear?: Maybe<Scalars['String']['output']>;
	/** Digital wallets-relevant data like if a payment is made through a digital wallets system (starting with 'ApplePay'). */
	cardSource?: Maybe<Scalars['String']['output']>;
	/** Type of card, such as `Visa`. */
	cardType?: Maybe<Scalars['String']['output']>;
	/** Last four digits of a card. */
	lastFour?: Maybe<Scalars['String']['output']>;
};

/** Invoice payment methods */
export type InvoicePaymentMethod =
	/** Bank transfer. */
	| 'BANK_TRANSFER'
	/** Cash. */
	| 'CASH'
	/** Cheque. */
	| 'CHEQUE'
	/** Credit card. */
	| 'CREDIT_CARD'
	/** Other. */
	| 'OTHER'
	/** Paypal. */
	| 'PAYPAL'
	/** Unspecified payment method. */
	| 'UNSPECIFIED';

/** Input of the `invoicePaymentUpdate` mutation. */
export type InvoicePaymentPatchInput = {
	/** Payment amount. */
	amount?: InputMaybe<Scalars['Decimal']['input']>;
	/** Exchange rate to payment account's currency from the invoice's currency. Only used if the invoice and payment accounts are in different currencies. */
	exchangeRate?: InputMaybe<Scalars['Decimal']['input']>;
	/** The unique identifier for the invoice payment. */
	id: Scalars['ID']['input'];
	/** Notes. */
	memo?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the payment account. */
	paymentAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Actual payment date. */
	paymentDate?: InputMaybe<Scalars['Date']['input']>;
	/** Payment method. */
	paymentMethod?: InputMaybe<InvoicePaymentMethod>;
};

/** Output of the `invoicePaymentUpdate` mutation. */
export type InvoicePaymentPatchOutput = {
	/** Indicates whether the action was successful. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Entity that was created. */
	invoicePayment?: Maybe<InvoicePayment>;
};

/** Input to the `InvoicePaymentReceiptSend` mutation. */
export type InvoicePaymentReceiptSendInput = {
	/** Include a PDF of the invoice as an attachment. */
	attachPdf?: InputMaybe<Scalars['Boolean']['input']>;
	/** Email addresses to receive an email. */
	ccMyself?: InputMaybe<Scalars['Boolean']['input']>;
	/** The address the email is from. */
	fromAddress?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
	/** The unique identifier for the invoice payment. */
	invoicePaymentId: Scalars['ID']['input'];
	/** Message body of the email. */
	message?: InputMaybe<Scalars['String']['input']>;
	/** Subject of the email. */
	subject?: InputMaybe<Scalars['String']['input']>;
	/** Email addresses to receive an email. */
	to: Array<Scalars['String']['input']>;
};

/** Output of the `InvoicePaymentReceiptSend` mutation. */
export type InvoicePaymentReceiptSendOutput = {
	/** Indicates whether the invoice was successfully queued for sending. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Record of invoice reminder sent to a customer for an invoice. */
export type InvoiceReminder = BusinessNode &
	Node & {
		/** Business that the invoice reminder belongs to. */
		business: Business;
		/** When the invoiceReminder was created. */
		createdAt?: Maybe<Scalars['DateTime']['output']>;
		/** Days delta. */
		daysDelta?: Maybe<Scalars['Int']['output']>;
		/** Unique identifier for the invoice reminder. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
		/** Invoice associated with the invoice reminder. */
		invoice?: Maybe<Invoice>;
		/** Issue date. */
		issueDate?: Maybe<Scalars['DateTime']['output']>;
		/** When the invoiceReminder was modified. */
		modifiedAt?: Maybe<Scalars['DateTime']['output']>;
		/** Is sent */
		sent?: Maybe<Scalars['Boolean']['output']>;
		/** Is sent manualy */
		sentManually?: Maybe<Scalars['Boolean']['output']>;
	};

/** Input to the `invoiceSend` mutation. */
export type InvoiceSendInput = {
	/** Include a PDF of the invoice as an attachment. */
	attachPDF?: Scalars['Boolean']['input'];
	/** Carbon copy email. */
	ccMyself?: InputMaybe<Scalars['Boolean']['input']>;
	/** Email address from */
	fromAddress?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the invoice. */
	invoiceId: Scalars['ID']['input'];
	/** Message body of the email. */
	message?: InputMaybe<Scalars['String']['input']>;
	/** Subject line of the email. */
	subject?: InputMaybe<Scalars['String']['input']>;
	/** Email addresses to receive an email. */
	to: Array<Scalars['String']['input']>;
};

/** Invoice send method. */
export type InvoiceSendMethod =
	/** Export PDF. */
	| 'EXPORT_PDF'
	/** Gmail */
	| 'GMAIL'
	/** Marked as sent. */
	| 'MARKED_SENT'
	/** Not sent. */
	| 'NOT_SENT'
	/** Outlook. */
	| 'OUTLOOK'
	/** Shared link. */
	| 'SHARED_LINK'
	/** Skipped. */
	| 'SKIPPED'
	/** Wave. */
	| 'WAVE'
	/** Yahoo. */
	| 'YAHOO';

/** Output of the `invoiceSend` mutation. */
export type InvoiceSendOutput = {
	/** Indicates whether the invoice was successfully queued for sending. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Invoice that was sent. */
	invoice?: Maybe<Invoice>;
};

/** Options by which invoices can be ordered. */
export type InvoiceSort =
	/** Ascending by amount due. */
	| 'AMOUNT_DUE_ASC'
	/** Descending by amount due. */
	| 'AMOUNT_DUE_DESC'
	/** Ascending by amount paid. */
	| 'AMOUNT_PAID_ASC'
	/** Descending by amount paid. */
	| 'AMOUNT_PAID_DESC'
	/** Ascending by creation time. */
	| 'CREATED_AT_ASC'
	/** Descending by creation time. */
	| 'CREATED_AT_DESC'
	/** Ascending by customer's name. */
	| 'CUSTOMER_NAME_ASC'
	/** Descending by customer's name. */
	| 'CUSTOMER_NAME_DESC'
	/** Ascending by due date. */
	| 'DUE_AT_ASC'
	/** Descending by due date. */
	| 'DUE_AT_DESC'
	/** Ascending by invoice date. */
	| 'INVOICE_DATE_ASC'
	/** Descending by invoice date. */
	| 'INVOICE_DATE_DESC'
	/** Ascending by invoice number. */
	| 'INVOICE_NUMBER_ASC'
	/** Descending by invoice number. */
	| 'INVOICE_NUMBER_DESC'
	/** Ascending by modified date. */
	| 'MODIFIED_AT_ASC'
	/** Descending by modified date. */
	| 'MODIFIED_AT_DESC'
	/** Ascending by status. */
	| 'STATUS_ASC'
	/** Descending by status. */
	| 'STATUS_DESC'
	/** Ascending by total amount. */
	| 'TOTAL_ASC'
	/** Descending by total amount. */
	| 'TOTAL_DESC';

/** Specifies either the invoice is made from estimate, is recurring, or created manually. */
export type InvoiceSource = Estimate | NewEstimate | RecurringInvoice;

/** Status of an invoice. */
export type InvoiceStatus =
	/** The invoice is still a draft. */
	| 'DRAFT'
	/** The invoice is overdue. */
	| 'OVERDUE'
	/** The invoice was overpaid. */
	| 'OVERPAID'
	/** The invoice was paid. */
	| 'PAID'
	/** The invoice was partially paid. */
	| 'PARTIAL'
	/** The invoice was saved. */
	| 'SAVED'
	/** The invoice was sent. */
	| 'SENT'
	/** The invoice is unpaid. */
	| 'UNPAID'
	/** The invoice was viewed. */
	| 'VIEWED';

/** A medium of exchange in common use. */
export type Money = {
	/** Currency */
	currency: Currency;
	/** Value represented in only the minor currency unit. */
	minorUnitValue: Scalars['Decimal']['output'];
	/**
	 * Value represented in only the minor currency unit.
	 * @deprecated Use `minorUnitValue` instead, as `raw` can overflow for large numbers.
	 */
	raw: Scalars['Int']['output'];
	/** Amount represented as a combination of the major and minor currency unit (uses a decimal separator). */
	value: Scalars['String']['output'];
};

/** Input representing a deposit. */
export type MoneyDepositTransactionCreateDepositInput = {
	/** Id of the account. */
	accountId: Scalars['ID']['input'];
	/** Date of the transaction. */
	amount: Scalars['Float']['input'];
};

/** Fee input. */
export type MoneyDepositTransactionCreateFeeInput = {
	/** ID of the account associated with the fee. */
	accountId: Scalars['ID']['input'];
	/** Amount. */
	amount: Scalars['Float']['input'];
};

/** Input of the moneyDepositTransactionCreate Mutation */
export type MoneyDepositTransactionCreateInput = {
	/** Id of the business. */
	businessId: Scalars['ID']['input'];
	/** Transaction timestamp. */
	createdAt?: InputMaybe<Scalars['DateTime']['input']>;
	/** Date of the transaction. */
	date: Scalars['Date']['input'];
	/** Deposit account and amount. */
	deposit: MoneyDepositTransactionCreateDepositInput;
	/** Description for the transaction. */
	description: Scalars['String']['input'];
	/** ID of the transaction in an external system. */
	externalId?: InputMaybe<Scalars['String']['input']>;
	/** Fees. */
	fees?: InputMaybe<Array<MoneyDepositTransactionCreateFeeInput>>;
	/** Line items. */
	lineItems: Array<MoneyDepositTransactionCreateLineItemInput>;
	/** Extra notes about the transaction. */
	notes?: InputMaybe<Scalars['String']['input']>;
	/** Origin of the transaction. */
	origin: TransactionOrigin;
};

/** Line item input. */
export type MoneyDepositTransactionCreateLineItemInput = {
	/** ID of the account associated with the line item. */
	accountId: Scalars['ID']['input'];
	/** Amount. */
	amount: Scalars['Float']['input'];
	/** ID of the customer associated with the line item. */
	customerId?: InputMaybe<Scalars['ID']['input']>;
	/** Taxes applied to the line item. */
	taxes: Array<TransactionCreateSalesTaxInput>;
};

/** Output of the moneyDepositTransactionCreate Mutation */
export type MoneyDepositTransactionCreateOutput = {
	/** Whether or not the transaction was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
};

/** Anchor input. */
export type MoneyTransactionCreateAnchorInput = {
	/** ID of the anchor account. */
	accountId: Scalars['ID']['input'];
	/** Amount of the transaction (unsigned). */
	amount: Scalars['Decimal']['input'];
	/** Direction of a transaction */
	direction: TransactionDirection;
};

/** Input of the `moneyTransactionCreate` Mutation */
export type MoneyTransactionCreateInput = {
	/** Anchor item. */
	anchor: MoneyTransactionCreateAnchorInput;
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Date of the transaction. */
	date: Scalars['Date']['input'];
	/** Description for the transaction. */
	description: Scalars['String']['input'];
	/** ID of the transaction in an external system. If you don't have one, generate a UUID and provide it. */
	externalId: Scalars['String']['input'];
	/** Line items. */
	lineItems: Array<MoneyTransactionCreateLineItemInput>;
	/** Extra notes about the transaction. */
	notes?: InputMaybe<Scalars['String']['input']>;
};

/** Line item input. */
export type MoneyTransactionCreateLineItemInput = {
	/** ID of the account associated with the line item. */
	accountId: Scalars['ID']['input'];
	/** Amount of the line item (unsigned). */
	amount: Scalars['Decimal']['input'];
	/** How the account should change in relation to the amount. */
	balance?: BalanceType;
	/** ID of the customer associated with the line item. */
	customerId?: InputMaybe<Scalars['ID']['input']>;
	/** Optional description for line item. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Taxes applied to the line item. */
	taxes?: InputMaybe<Array<MoneyTransactionCreateSalesTaxInput>>;
};

/** Output of the `moneyTransactionCreate` Mutation */
export type MoneyTransactionCreateOutput = {
	/** Whether or not the transaction was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Created transaction. */
	transaction?: Maybe<Transaction>;
};

/** Sales tax input. */
export type MoneyTransactionCreateSalesTaxInput = {
	/** Override the amount of the tax (unsigned). */
	amount: Scalars['Decimal']['input'];
	/** ID of the sales tax. */
	salesTaxId: Scalars['ID']['input'];
};

/** Input for creating a money transaction. */
export type MoneyTransactionDetails = {
	/** Anchor item. */
	anchor: MoneyTransactionCreateAnchorInput;
	/** Date of the transaction. */
	date: Scalars['Date']['input'];
	/** Description for the transaction. */
	description: Scalars['String']['input'];
	/** ID of the transaction in an external system. If you don't have one, generate a UUID and provide it. */
	externalId: Scalars['String']['input'];
	/** Line items. */
	lineItems: Array<MoneyTransactionCreateLineItemInput>;
	/** Extra notes about the transaction. */
	notes?: InputMaybe<Scalars['String']['input']>;
};

/** Input of the `moneyTransactionsCreate` Mutation */
export type MoneyTransactionsCreateInput = {
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Array of transactions to create. */
	transactions: Array<MoneyTransactionDetails>;
};

/** Output of the `moneyTransactionsCreate` Mutation */
export type MoneyTransactionsCreateOutput = {
	/** Whether or not all transactions were successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Created transactions. */
	transactions?: Maybe<Array<Maybe<Transaction>>>;
};

/** The schema’s entry point for mutations. */
export type Mutation = {
	/** No-op placeholder for code generation. */
	_?: Maybe<Scalars['Boolean']['output']>;
	/** Archive an account. */
	accountArchive?: Maybe<AccountArchiveOutput>;
	/** Create an account. */
	accountCreate?: Maybe<AccountCreateOutput>;
	/** Patch an account. */
	accountPatch?: Maybe<AccountPatchOutput>;
	/** Convert an estimate into an invoice. */
	convertEstimateToInvoice?: Maybe<ConvertEstimateToInvoiceOutput>;
	/** Create a customer. */
	customerCreate?: Maybe<CustomerCreateOutput>;
	/** Delete customer. */
	customerDelete?: Maybe<CustomerDeleteOutput>;
	/** Patch a customer. */
	customerPatch?: Maybe<CustomerPatchOutput>;
	/** Approve an estimate. */
	estimateApprove?: Maybe<EstimateApproveOutput>;
	/** Clone an estimate. */
	estimateClone?: Maybe<EstimateCloneOutput>;
	/** Create an estimate. */
	estimateCreate?: Maybe<EstimateCreateOutput>;
	/** Delete an estimate. */
	estimateDelete?: Maybe<EstimateDeleteOutput>;
	/** Create manual payment for an estimate deposit. */
	estimateDepositPaymentCreateManual?: Maybe<EstimatePaymentCreateManualOutput>;
	/** Send a receipt for an estimate deposit payment. */
	estimateDepositPaymentReceiptSend?: Maybe<EstimateDepositPaymentReceiptSendOutput>;
	/** Update manual payment for an estimate deposit. */
	estimateDepositPaymentUpdateManual?: Maybe<EstimatePaymentUpdateManualOutput>;
	/** Generate a PDF of the estimate. */
	estimateGeneratePdf?: Maybe<EstimateGeneratePdfOutput>;
	/** Mark the estimate as accepted. */
	estimateMarkAccepted?: Maybe<EstimateMarkAcceptedOutput>;
	/** Mark the estimate as sent. */
	estimateMarkSent?: Maybe<EstimateMarkSentOutput>;
	/** Update an estimate. */
	estimatePatch?: Maybe<EstimatePatchOutput>;
	/** Delete estimate manual payment. */
	estimatePaymentDelete?: Maybe<EstimatePaymentDeleteOutput>;
	/** Reset the estimate acceptance. */
	estimateResetAcceptance?: Maybe<EstimateResetAcceptanceOutput>;
	/** Send an estimate. */
	estimateSend?: Maybe<EstimateSendOutput>;
	/** Notify customer */
	estimateSendAcceptanceCustomerEmail?: Maybe<EstimateSendAcceptanceCustomerEmailOutput>;
	/** Approve an invoice. */
	invoiceApprove?: Maybe<InvoiceApproveOutput>;
	/** Clones an invoice. */
	invoiceClone?: Maybe<InvoiceCloneOutput>;
	/** Create an invoice. */
	invoiceCreate?: Maybe<InvoiceCreateOutput>;
	/** Delete an invoice. */
	invoiceDelete?: Maybe<InvoiceDeleteOutput>;
	/** Mark the invoice as sent. */
	invoiceMarkSent?: Maybe<InvoiceMarkSentOutput>;
	/** Patch an invoice. */
	invoicePatch?: Maybe<InvoicePatchOutput>;
	/** Record manual payment. */
	invoicePaymentCreateManual?: Maybe<InvoicePaymentCreateManualOutput>;
	/** Delete invoice manual payment. */
	invoicePaymentDelete?: Maybe<InvoicePaymentDeleteOutput>;
	/** Update Invoice Payment. */
	invoicePaymentPatch?: Maybe<InvoicePaymentPatchOutput>;
	/** Send Invoice Payment Receipt. */
	invoicePaymentReceiptSend?: Maybe<InvoicePaymentReceiptSendOutput>;
	/** Send an invoice. Requires `Business.emailSendEnabled` to be true. */
	invoiceSend?: Maybe<InvoiceSendOutput>;
	/**
	 * Create a money transaction.
	 * @deprecated Not available for public use at this time.
	 */
	moneyDepositTransactionCreate?: Maybe<MoneyDepositTransactionCreateOutput>;
	/** **BETA**: Create money transaction. Requires `isClassicAccounting` to be `false`. */
	moneyTransactionCreate?: Maybe<MoneyTransactionCreateOutput>;
	/** **BETA**: Bulk create money transactions. Requires `isClassicAccounting` to be `false`. */
	moneyTransactionsCreate?: Maybe<MoneyTransactionsCreateOutput>;
	/** Archive a product. */
	productArchive?: Maybe<ProductArchiveOutput>;
	/** Create a product. */
	productCreate?: Maybe<ProductCreateOutput>;
	/** Patch a product. */
	productPatch?: Maybe<ProductPatchOutput>;
	/** Archive a sales tax. */
	salesTaxArchive: SalesTaxArchiveOutput;
	/** Create a sales tax. */
	salesTaxCreate: SalesTaxCreateOutput;
	/** Update a sales tax. */
	salesTaxPatch: SalesTaxPatchOutput;
};

/** The schema’s entry point for mutations. */
export type MutationaccountArchiveArgs = {
	input: AccountArchiveInput;
};

/** The schema’s entry point for mutations. */
export type MutationaccountCreateArgs = {
	input: AccountCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationaccountPatchArgs = {
	input: AccountPatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationconvertEstimateToInvoiceArgs = {
	input: ConvertEstimateToInvoiceInput;
};

/** The schema’s entry point for mutations. */
export type MutationcustomerCreateArgs = {
	input: CustomerCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationcustomerDeleteArgs = {
	input: CustomerDeleteInput;
};

/** The schema’s entry point for mutations. */
export type MutationcustomerPatchArgs = {
	input: CustomerPatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateApproveArgs = {
	input: EstimateApproveInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateCloneArgs = {
	input: EstimateCloneInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateCreateArgs = {
	input: EstimateCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateDeleteArgs = {
	input: EstimateDeleteInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateDepositPaymentCreateManualArgs = {
	input: EstimateDepositPaymentCreateManualInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateDepositPaymentReceiptSendArgs = {
	input: EstimateDepositPaymentReceiptSendInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateDepositPaymentUpdateManualArgs = {
	input: EstimateDepositPaymentUpdateManualInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateGeneratePdfArgs = {
	input: EstimateGeneratePdfInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateMarkAcceptedArgs = {
	input: EstimateMarkAcceptedInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateMarkSentArgs = {
	input: EstimateMarkSentInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimatePatchArgs = {
	input: EstimatePatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimatePaymentDeleteArgs = {
	input: EstimatePaymentDeleteInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateResetAcceptanceArgs = {
	input: EstimateResetAcceptanceInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateSendArgs = {
	input: EstimateSendInput;
};

/** The schema’s entry point for mutations. */
export type MutationestimateSendAcceptanceCustomerEmailArgs = {
	input: EstimateSendAcceptanceCustomerEmailInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceApproveArgs = {
	input: InvoiceApproveInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceCloneArgs = {
	input: InvoiceCloneInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceCreateArgs = {
	input: InvoiceCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceDeleteArgs = {
	input: InvoiceDeleteInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceMarkSentArgs = {
	input: InvoiceMarkSentInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoicePatchArgs = {
	input: InvoicePatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoicePaymentCreateManualArgs = {
	input: InvoicePaymentCreateManualInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoicePaymentDeleteArgs = {
	input: InvoicePaymentDeleteInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoicePaymentPatchArgs = {
	input: InvoicePaymentPatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoicePaymentReceiptSendArgs = {
	input: InvoicePaymentReceiptSendInput;
};

/** The schema’s entry point for mutations. */
export type MutationinvoiceSendArgs = {
	input: InvoiceSendInput;
};

/** The schema’s entry point for mutations. */
export type MutationmoneyDepositTransactionCreateArgs = {
	input: MoneyDepositTransactionCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationmoneyTransactionCreateArgs = {
	input: MoneyTransactionCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationmoneyTransactionsCreateArgs = {
	input: MoneyTransactionsCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationproductArchiveArgs = {
	input: ProductArchiveInput;
};

/** The schema’s entry point for mutations. */
export type MutationproductCreateArgs = {
	input: ProductCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationproductPatchArgs = {
	input: ProductPatchInput;
};

/** The schema’s entry point for mutations. */
export type MutationsalesTaxArchiveArgs = {
	input: SalesTaxArchiveInput;
};

/** The schema’s entry point for mutations. */
export type MutationsalesTaxCreateArgs = {
	input: SalesTaxCreateInput;
};

/** The schema’s entry point for mutations. */
export type MutationsalesTaxPatchArgs = {
	input: SalesTaxPatchInput;
};

/** An estimate created in our new platform (queriable via AREstimate). */
export type NewEstimate = BusinessNode &
	Node & {
		/** Business that the Estimate belongs to */
		business: Business;
		/** Unique identifier for the estimate. */
		id: Scalars['ID']['output'];
	};

/** An object with an `ID`. */
export type Node = {
	/** ID of the object. */
	id: Scalars['ID']['output'];
};

/** An OAuth application. */
export type OAuthApplication = Node & {
	/** The client identifier issued to the client during the registration process. */
	clientId: Scalars['String']['output'];
	/** When the application was created. */
	createdAt: Scalars['DateTime']['output'];
	/** A description of the application. */
	description?: Maybe<Scalars['String']['output']>;
	/**
	 * Additional data for the application.
	 * - If the requested `clientId` does not match that of the current OAuth application, `extraData` will not be returned.
	 */
	extraData?: Maybe<Scalars['JSON']['output']>;
	/** The unique identifier for the application. */
	id: Scalars['ID']['output'];
	/** The URL to the application logo. */
	logoUrl?: Maybe<Scalars['URL']['output']>;
	/** When the application was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** The name of the application. */
	name: Scalars['String']['output'];
};

/** Information about pagination in a connection. */
export type OffsetPageInfo = {
	/** Current page number. */
	currentPage: Scalars['Int']['output'];
	/** Total number of nodes in the connection. */
	totalCount?: Maybe<Scalars['Int']['output']>;
	/** Total number of pages in the connection. */
	totalPages?: Maybe<Scalars['Int']['output']>;
};

/** Forms of business ownership. */
export type OrganizationalType =
	/** Corporation */
	| 'CORPORATION'
	/** Partnership */
	| 'PARTNERSHIP'
	/** Sole Proprietorship */
	| 'SOLE_PROPRIETORSHIP';

/** A percentage discount applied to an estimate. */
export type PercentageEstimateDiscount = EstimateDiscount & {
	/** When the estimate discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the estimate discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
	/** The percentage of the discount. */
	percentage?: Maybe<Scalars['Decimal']['output']>;
};

/** A percentage discount applied to an Invoice. */
export type PercentageInvoiceDiscount = InvoiceDiscount & {
	/** When the invoice discount was created. */
	createdAt: Scalars['DateTime']['output'];
	/** When the invoice discount was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
	/** A description of the discount. */
	name?: Maybe<Scalars['String']['output']>;
	/** The percentage of the discount. */
	percentage?: Maybe<Scalars['Decimal']['output']>;
};

/** Product (or service) that a business sells to a customer or purchases from a vendor. */
export type Product = BusinessNode &
	Node & {
		/** Business that the product belongs to. */
		business: Business;
		/** When the product was created. */
		createdAt: Scalars['DateTime']['output'];
		/** Default sales taxes to apply on product. */
		defaultSalesTaxes: Array<SalesTax>;
		/** Description of the product. */
		description?: Maybe<Scalars['String']['output']>;
		/** The expense account to associate with this product, set when isBought. */
		expenseAccount?: Maybe<Account>;
		/** Unique identifier for the product. */
		id: Scalars['ID']['output'];
		/** The income account to associate with this product, set when isSold. */
		incomeAccount?: Maybe<Account>;
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
		/** Is the product hidden from view by default. */
		isArchived: Scalars['Boolean']['output'];
		/** Is product bought by the business. Allow this product or service to be added to Bills. */
		isBought: Scalars['Boolean']['output'];
		/** Is product sold by the business. Allow this product or service to be added to Invoices. */
		isSold: Scalars['Boolean']['output'];
		/** When the product was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Name of the product. */
		name: Scalars['String']['output'];
		/** Price per unit in the major currency unit. */
		unitPrice: Scalars['Decimal']['output'];
	};

/** Input to the `productArchive` mutation. */
export type ProductArchiveInput = {
	/** The unique identifier for the product. */
	id: Scalars['ID']['input'];
};

/** Output of the `productArchive` mutation. */
export type ProductArchiveOutput = {
	/** Indicates whether the product was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Product that was archived. */
	product?: Maybe<Product>;
};

/** Product connection. */
export type ProductConnection = {
	/** List of products. */
	edges: Array<ProductEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Input to the `productCreate` mutation. */
export type ProductCreateInput = {
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** Default sales taxes to apply on product. */
	defaultSalesTaxIds?: InputMaybe<Array<Scalars['ID']['input']>>;
	/** Product description. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Expense account to associate with this product. Account must be one of subtypes: `EXPENSE`, `COST_OF_GOODS_SOLD`, `PAYMENT_PROCESSING_FEES`, `PAYROLL_EXPENSES`. */
	expenseAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Income account to associate with this product. Account must be one of subtypes: `INCOME`, `DISCOUNTS`, `OTHER_INCOME`. */
	incomeAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Name of the product. */
	name: Scalars['String']['input'];
	/** Price per unit in the major currency unit (rounded to nearest 5 decimal places with ties going away from zero). */
	unitPrice: Scalars['Decimal']['input'];
};

/** Output of the `productCreate` mutation. */
export type ProductCreateOutput = {
	/** Indicates whether the product was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Product that was created. */
	product?: Maybe<Product>;
};

/** Product edge. */
export type ProductEdge = {
	/** A product. */
	node: Product;
};

/** Input to the `productPatch` mutation. */
export type ProductPatchInput = {
	/** Default sales taxes to apply on product. */
	defaultSalesTaxIds?: InputMaybe<Array<Scalars['ID']['input']>>;
	/** Description of the product. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Expense account to associate with this product. Account must be one of subtypes: `EXPENSE`, `COST_OF_GOODS_SOLD`, `PAYMENT_PROCESSING_FEES`, `PAYROLL_EXPENSES`. */
	expenseAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** The unique identifier for the product. */
	id: Scalars['ID']['input'];
	/** Income account to associate with this product. Account must be one of subtypes: `INCOME`, `DISCOUNTS`, `OTHER_INCOME`. */
	incomeAccountId?: InputMaybe<Scalars['ID']['input']>;
	/** Name of the product. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Price per unit in the major currency unit (rounded to nearest 5 decimal places with ties going away from zero). */
	unitPrice?: InputMaybe<Scalars['Decimal']['input']>;
};

/** Output of the `productPatch` mutation. */
export type ProductPatchOutput = {
	/** Indicates whether the product was successfully patched. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Product that was updated. */
	product?: Maybe<Product>;
};

/** Options by which products can be ordered. */
export type ProductSort =
	/** Ascending by creation time. */
	| 'CREATED_AT_ASC'
	/** Descending by creation time. */
	| 'CREATED_AT_DESC'
	/** Ascending by modified time. */
	| 'MODIFIED_AT_ASC'
	/** Descending by modified time. */
	| 'MODIFIED_AT_DESC'
	/** Ascending by name. */
	| 'NAME_ASC'
	/** Descending by name. */
	| 'NAME_DESC';

/** A state/county/province/region. */
export type Province = {
	/** [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) identifier. */
	code: Scalars['String']['output'];
	/** Plain-lanuage representaton. */
	name: Scalars['String']['output'];
	/**
	 * Informal name for identification.
	 * @deprecated Nonstandard values. Use code instead.
	 */
	slug?: Maybe<Scalars['String']['output']>;
};

/** The schema’s entry point for queries. */
export type Query = {
	/** No-op placeholder for code generation. */
	_?: Maybe<Scalars['Boolean']['output']>;
	/** List subtypes of accounts. */
	accountSubtypes: Array<AccountSubtype>;
	/** List types of accounts. */
	accountTypes: Array<AccountType>;
	/** Get a business. */
	business?: Maybe<Business>;
	/** List businesses. */
	businesses?: Maybe<BusinessConnection>;
	/** List countries. */
	countries: Array<Country>;
	/** Get a country. */
	country?: Maybe<Country>;
	/** List currencies. */
	currencies: Array<Currency>;
	/** Get a currency. */
	currency?: Maybe<Currency>;
	/** Get the current OAuth application. */
	oAuthApplication?: Maybe<OAuthApplication>;
	/** Get a province. */
	province?: Maybe<Province>;
	/** The currently authenticated user. */
	user?: Maybe<User>;
};

/** The schema’s entry point for queries. */
export type QuerybusinessArgs = {
	id?: InputMaybe<Scalars['ID']['input']>;
};

/** The schema’s entry point for queries. */
export type QuerybusinessesArgs = {
	isArchived?: InputMaybe<Scalars['Boolean']['input']>;
	page?: InputMaybe<Scalars['Int']['input']>;
	pageSize?: InputMaybe<Scalars['Int']['input']>;
};

/** The schema’s entry point for queries. */
export type QuerycountryArgs = {
	code: CountryCode;
};

/** The schema’s entry point for queries. */
export type QuerycurrencyArgs = {
	code: CurrencyCode;
};

/** The schema’s entry point for queries. */
export type QueryprovinceArgs = {
	code: Scalars['String']['input'];
};

/** A template that can be used to generate and possibly pay an invoice at regular intervals. */
export type RecurringInvoice = BusinessNode &
	Node & {
		/** Business that the RecurringInvoice belongs to */
		business: Business;
		/** Unique identifier for the recurring invoice. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
	};

/** A tax paid to a taxing authority for the sales of certain goods and services. */
export type SalesTax = BusinessNode &
	Node & {
		/** A short form or code representing the sales tax. */
		abbreviation: Scalars['String']['output'];
		/** Business that the sales tax belongs to. */
		business: Business;
		/** When the sales tax was created. */
		createdAt: Scalars['DateTime']['output'];
		/** User defined description for the sales tax. */
		description?: Maybe<Scalars['String']['output']>;
		/** The unique identifier for the sales tax. */
		id: Scalars['ID']['output'];
		/**
		 * The primary key used internally at Wave.
		 * @deprecated Exposed internal IDs will eventually be removed in favor of global ID. Use Node.id instead.
		 */
		internalId?: Maybe<Scalars['String']['output']>;
		/** Is the sales tax hidden from view by default. */
		isArchived: Scalars['Boolean']['output'];
		/** Is a compound tax, or stacked tax. This tax is calculated on top of the subtotal and other tax amounts. */
		isCompound: Scalars['Boolean']['output'];
		/** Is a recoverable tax. It is recoverable if you can deduct the tax that you as a business paid from the tax that you have collected. */
		isRecoverable: Scalars['Boolean']['output'];
		/** When the sales tax was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Name of the tax. */
		name: Scalars['String']['output'];
		/** Tax rate effective on 'for' date, or current date if no parameter, as a decimal (e.g. 0.15 represents 15%). */
		rate: Scalars['Decimal']['output'];
		/** Tax rates with their effective dates of application */
		rates: Array<SalesTaxRate>;
		/** Display tax number beside the tax name on an invoice. */
		showTaxNumberOnInvoices: Scalars['Boolean']['output'];
		/** The tax's issued identification number from a taxing authority. */
		taxNumber?: Maybe<Scalars['String']['output']>;
	};

/** A tax paid to a taxing authority for the sales of certain goods and services. */
export type SalesTaxrateArgs = {
	for?: InputMaybe<Scalars['Date']['input']>;
};

/** Input to the `salesTaxArchive` mutation. */
export type SalesTaxArchiveInput = {
	/** The unique identifier for the sales tax. */
	id: Scalars['ID']['input'];
};

/** Output of the `salesTaxArchive` mutation. */
export type SalesTaxArchiveOutput = {
	/** Indicates whether the sales tax was successfully deleted. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Sales tax that was archived. */
	salesTax?: Maybe<SalesTax>;
};

/** Sales tax connection. */
export type SalesTaxConnection = {
	/** List of sales taxes. */
	edges: Array<SalesTaxEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Input to the `salesTaxCreate` mutation. */
export type SalesTaxCreateInput = {
	/** An short form or code representing the sales tax. Max 10 characters, and MUST BE UNIQUE within business. */
	abbreviation: Scalars['String']['input'];
	/** The unique identifier for the business. */
	businessId: Scalars['ID']['input'];
	/** User defined description for the sales tax. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** Is a compound tax, or stacked tax. This tax is calculated on top of the subtotal and other tax amounts. */
	isCompound?: InputMaybe<Scalars['Boolean']['input']>;
	/** Is a recoverable tax. It is recoverable if you can deduct the tax that you as a business paid from the tax that you have collected. */
	isRecoverable?: InputMaybe<Scalars['Boolean']['input']>;
	/** Name of the tax. */
	name: Scalars['String']['input'];
	/** The current rate, as a decimal (e.g. 0.15 represents 15%; rounded to nearest 6 decimal places with ties going away from zero). */
	rate: Scalars['Decimal']['input'];
	/** Display tax number beside the tax name on an invoice. */
	showTaxNumberOnInvoices?: InputMaybe<Scalars['Boolean']['input']>;
	/** The tax's issued identification number from a taxing authority. */
	taxNumber?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `salesTaxCreate` mutation. */
export type SalesTaxCreateOutput = {
	/** Indicates whether the sales tax was successfully created. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Sales tax that was created. */
	salesTax?: Maybe<SalesTax>;
};

/** Sales tax edge. */
export type SalesTaxEdge = {
	/** A sales tax. */
	node?: Maybe<SalesTax>;
};

/** Input to the `salesTaxPatch` mutation. */
export type SalesTaxPatchInput = {
	/** An short form or code representing the sales tax */
	abbreviation?: InputMaybe<Scalars['String']['input']>;
	/** User defined description for the sales tax. */
	description?: InputMaybe<Scalars['String']['input']>;
	/** The unique identifier for the sales tax. */
	id: Scalars['ID']['input'];
	/** Name of the tax. */
	name?: InputMaybe<Scalars['String']['input']>;
	/** Tax rate information. */
	rates?: InputMaybe<Array<SalesTaxRateInput>>;
	/** Display tax number beside the tax name on an invoice. */
	showTaxNumberOnInvoices?: InputMaybe<Scalars['Boolean']['input']>;
	/** The tax's issued identification number from a taxing authority. */
	taxNumber?: InputMaybe<Scalars['String']['input']>;
};

/** Output of the `salesTaxPatch` mutation. */
export type SalesTaxPatchOutput = {
	/** Indicates whether the sales tax was successfully patched. */
	didSucceed: Scalars['Boolean']['output'];
	/** Mutation validation errors. */
	inputErrors?: Maybe<Array<InputError>>;
	/** Sales tax that was patched. */
	salesTax?: Maybe<SalesTax>;
};

/** A Sales Tax rate with effective date. New entry for each change of rate. */
export type SalesTaxRate = {
	/** Date from which the sales tax rate applies. */
	effective: Scalars['Date']['output'];
	/** Tax rate applying from the effective date as a decimal (e.g. 0.15 represents 15%). */
	rate: Scalars['Decimal']['output'];
};

/** Sales tax rate input for the `salesTaxPatch` mutation */
export type SalesTaxRateInput = {
	/** Date from which the sales tax rate applies. */
	effective: Scalars['Date']['input'];
	/** Tax rate applying from the effective date as a decimal (e.g. 0.15 represents 15%). */
	rate: Scalars['Decimal']['input'];
};

/** Wave's schemas. */
export type Schema =
	/** Available only to approved chatbot integrations. */
	| 'CHATBOT'
	/** Available only to HR Block integration. */
	| 'HRBLOCK'
	/** Available only to Wave. */
	| 'INTERNAL'
	/** Available to all third parties. */
	| 'PUBLIC'
	/** Available only to Wave staff. */
	| 'STAFF';

/** An created transaction. */
export type Transaction = {
	/** Unique identifier for the transaction. */
	id: Scalars['ID']['output'];
};

/** Sales tax input. */
export type TransactionCreateSalesTaxInput = {
	/** Tax Abbreviation. */
	abbreviation: Scalars['String']['input'];
	/** Tax Amount. */
	amount: Scalars['Float']['input'];
};

/** Represents the direction of a transaction. */
export type TransactionDirection =
	/** To put in. */
	| 'DEPOSIT'
	/** To remove from. */
	| 'WITHDRAWAL';

/** Represents the origin of a transaction. */
export type TransactionOrigin =
	/** Manually created transaction. */
	| 'MANUAL'
	/** Transaction created through Zapier. */
	| 'ZAPIER';

/** A user is an individual's account. */
export type User = Node & {
	/** When the user was created. */
	createdAt: Scalars['DateTime']['output'];
	/** The user's primary email address. */
	defaultEmail?: Maybe<Scalars['String']['output']>;
	/** The user's first name. */
	firstName?: Maybe<Scalars['String']['output']>;
	/** The unique identifier for the user. */
	id: Scalars['ID']['output'];
	/** The user's last name. */
	lastName?: Maybe<Scalars['String']['output']>;
	/** When the user was last modified. */
	modifiedAt: Scalars['DateTime']['output'];
};

/** A vendor of the business. */
export type Vendor = BusinessNode &
	Node & {
		/** The address of the vendor. */
		address?: Maybe<Address>;
		/** Business that the vendor belongs to. */
		business: Business;
		/** When the vendor was created. */
		createdAt: Scalars['DateTime']['output'];
		/** Default currency used by the vendor. */
		currency?: Maybe<Currency>;
		/** User defined id for the vendor. Commonly referred to as Account Number. */
		displayId?: Maybe<Scalars['String']['output']>;
		/** Email of the principal vendor. */
		email?: Maybe<Scalars['String']['output']>;
		/** Fax number of the vendor. */
		fax?: Maybe<Scalars['String']['output']>;
		/** The first name of the principal contact. */
		firstName?: Maybe<Scalars['String']['output']>;
		/** Unique identifier for the customer. */
		id: Scalars['ID']['output'];
		/** Internal notes about the vendor. */
		internalNotes?: Maybe<Scalars['String']['output']>;
		/** Whether or not the vendor is archived. */
		isArchived?: Maybe<Scalars['Boolean']['output']>;
		/** The last name of the principal contact. */
		lastName?: Maybe<Scalars['String']['output']>;
		/** The mobile number of the vendor. */
		mobile?: Maybe<Scalars['String']['output']>;
		/** When the vendor was last modified. */
		modifiedAt: Scalars['DateTime']['output'];
		/** Name or business name of the vendor. */
		name: Scalars['String']['output'];
		/** The phone number of the vendor. */
		phone?: Maybe<Scalars['String']['output']>;
		/** Details for shipping to the vendor. */
		shippingDetails?: Maybe<VendorShippingDetails>;
		/** Toll-free number of the vendor. */
		tollFree?: Maybe<Scalars['String']['output']>;
		/** Website address of the vendor. */
		website?: Maybe<Scalars['String']['output']>;
	};

/** Vendor connection. */
export type VendorConnection = {
	/** List of vendors. */
	edges: Array<VendorEdge>;
	/** Information about pagination. */
	pageInfo: OffsetPageInfo;
};

/** Vendor edge. */
export type VendorEdge = {
	/** A vendor. */
	node: Vendor;
};

/** Shipping details related to a vendor. */
export type VendorShippingDetails = {
	/** Address of the vendor. */
	address?: Maybe<Address>;
	/** Delivery instructions for handling. */
	instructions?: Maybe<Scalars['String']['output']>;
	/** Name or business name of the vendor. */
	name?: Maybe<Scalars['String']['output']>;
	/** Telephone number of the vendor. */
	phone?: Maybe<Scalars['String']['output']>;
};
