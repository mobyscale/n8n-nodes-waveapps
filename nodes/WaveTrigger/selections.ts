/**
 * GraphQL selection sets for the records that the triggers return. The resource modules of the
 * Wave node own them, so the triggers return the same fields as the Get operations.
 */
export { CUSTOMER_FIELDS } from '../Wave/resources/customer';
export { ESTIMATE_FIELDS } from '../Wave/resources/estimate';
export { INVOICE_FIELDS, INVOICE_LIST_FIELDS } from '../Wave/resources/invoice/fields';
export { PRODUCT_FIELDS } from '../Wave/resources/product';
export { SALES_TAX_FIELDS } from '../Wave/resources/salesTax';
export { VENDOR_FIELDS } from '../Wave/resources/vendor';
