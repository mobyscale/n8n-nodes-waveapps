# Invoice

An invoice is a bill that you send to a customer. Each invoice belongs to one business and one customer. Wave calculates the totals from the items, taxes and discount.

Select the invoice with the **Invoice** field. You can pick it from a list or enter its ID. A raw invoice ID from a webhook payload also works.

## Operations

| Operation | Description |
|---|---|
| Approve | Approve a draft invoice |
| Clone | Create a copy of an invoice |
| Create | Create an invoice for a customer |
| Delete | Delete an invoice. Returns `{ success: true, id }` |
| Get | Get one invoice with its items, totals, payments, `pdfUrl` and `viewUrl` |
| Get Many | Get the invoices of a business |
| Mark Sent | Mark an invoice as sent. Wave sends no email |
| Send | Send an invoice by email |
| Update | Change the fields of an invoice |

Every operation has a **Business** field.

## Create

| Field | Description |
|---|---|
| Customer | Required. The customer to invoice |
| Items | The line items. See below |
| Additional Fields | Optional values. See below |

### Items

Each item has these fields:

| Field | Description |
|---|---|
| Product | Required. The product of the item |
| Description | Replaces the description of the product |
| Quantity | The number of units. Default is 1 |
| Unit Price | Replaces the price of the product. Leave it empty to use the product price |
| Taxes | A list of sales taxes. Leave it empty to use the default taxes of the product |

### Additional Fields

Status (`Draft` or `Saved`), Currency, Title, Subhead, Invoice Number, PO Number, Invoice Date, Due Date, Exchange Rate, Discounts, Memo, Footer, Disable American Express Payments, Disable Bank Payments, Disable Credit Card Payments, Item Column Title, Unit Column Title, Price Column Title, Amount Column Title, Hide Name, Hide Description, Hide Unit, Hide Price, Hide Amount, and Require Terms of Service Agreement.

If you do not set a value, Wave uses the default of the business. For example, the invoice number is the highest number plus one.

A discount has a type (`Fixed` or `Percentage`), a name and an amount or a percentage. Wave allows one discount for each invoice.

## Update

**Update Fields** has the same fields as Additional Fields, plus **Customer**. Wave changes only the fields that you set.

If you set **Items**, the new items replace all existing items of the invoice.

## Get Many

You can use these filters:

| Filter | Description |
|---|---|
| Amount Due | Invoices with exactly this amount due |
| Customer | Invoices of one customer |
| Currency | Invoices in one currency |
| Invoice Date Start / End | Invoices dated in this range |
| Invoice Number | Invoices with a number that contains this text |
| Modified After / Before | Invoices that were changed in this time range |
| Source ID | Invoices that were made from one source |
| Status | Invoices with one status |

**Sort** sets the order of the result. The default is `Created At Desc`. Wave does not fill the `payments` field in a list. Use Get to read the payments of an invoice.

## Mark Sent

| Field | Description |
|---|---|
| Send Method | Required. How you sent the invoice, for example `Marked Sent` or `Export Pdf` |
| Sent At | When you sent the invoice. Default is now |

## Send

| Field | Description |
|---|---|
| To | Required. Email addresses, separated by commas |
| Attach PDF | Attach a PDF of the invoice |
| CC Myself | Send a copy to the sender |
| From Address | The sender address |
| Message | The message text |
| Subject | The subject line |

Wave can send email only when the business has `emailSendEnabled` set to true. Use **Business > Get** to check it. Approve the invoice before you send it.
