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
| Download PDF | Download the PDF of an invoice as binary data |
| Get | Get one invoice with its items, totals, payments, `pdfUrl` and `viewUrl` |
| Get Many | Get the invoices of a business |
| Mark Sent | Mark an invoice as sent. Wave sends no email |
| Send | Send an invoice by email |
| Update | Change the fields of an invoice |

Get and Get Many have a **Simplify** option. It is off by default. When you turn it on, the node returns flat values that you can write to a spreadsheet. See [Simplify](development.md#simplify).

Every operation has a **Business** field.

## Create

| Field | Description |
|---|---|
| Customer | Required. The customer to invoice |
| Match Products By Name | Give each item a product name. See below |
| Default Income Account | Required when you match products by name |
| Items | The line items. See below |
| Additional Fields | Optional values. See below |
| After Create | Approve or send the invoice after Wave creates it. See below |

### Items

Each item has these fields:

| Field | Description |
|---|---|
| Product | Required. The product of the item. With **Match Products By Name**, **Product Name** takes its place |
| Description | Replaces the description of the product |
| Quantity | The number of units. Default is 1 |
| Unit Price | Replaces the price of the product. Leave it empty to use the product price |
| Taxes | A list of sales taxes. Leave it empty to use the default taxes of the product |

### Additional Fields

Status (`Draft` or `Saved`), Currency, Title, Subhead, Invoice Number, PO Number, Invoice Date, Due Date, Exchange Rate, Discounts, Memo, Footer, Disable American Express Payments, Disable Bank Payments, Disable Credit Card Payments, Item Column Title, Unit Column Title, Price Column Title, Amount Column Title, Hide Name, Hide Description, Hide Unit, Hide Price, Hide Amount, and Require Terms of Service Agreement.

If you do not set a value, Wave uses the default of the business. For example, the invoice number is the highest number plus one.

A discount has a type (`Fixed` or `Percentage`), a name and an amount or a percentage. Wave allows one discount for each invoice.

The **Skip If Invoice Number Exists** option in Additional Fields shows when you set an **Invoice Number**. The node then asks Wave for invoices with this number before it creates one. If an invoice with exactly this number exists, the node returns that invoice and creates nothing. It runs no After Create steps. Without an invoice number, the option does nothing.

### Match Products By Name

Wave needs a product on each item. Turn on **Match Products By Name** to give each item a **Product Name** instead of a product. Then **Default Income Account** is required.

For each item, the node does these steps:

1. It looks for an active (not archived) product with the same name. Spaces at the start and end are ignored, and upper and lower case are the same.
2. If there is none, it creates the product. The product gets the name, the **Unit Price** of the item (or `0` when the price is empty) and the default income account.

The node reads the product list of the business once for each run and keeps it in memory. A product that the node creates is added to this list. So 50 items do not mean 50 list calls, and two items with the same new name give one product.

If two active products have the same name, the node uses the oldest one.

### After Create

**After Create** runs more steps after Wave creates the invoice. Wave rejects Mark Sent and Send on a draft, so each step starts with Approve.

| Value | Steps |
|---|---|
| Leave as Draft | None. This is the default |
| Approve | Approve |
| Approve and Mark Sent | Approve, then Mark Sent |
| Approve and Send | Approve, then Send |

The node returns the invoice as Wave has it after the last step.

**Approve and Send** shows the fields of the Send operation. **Send To** is the email address of the customer when you leave it empty.

If a step fails, the error says that the invoice was created and gives its ID. Use the ID to continue. Do not create the invoice again. Wave can send email only when the business has `emailSendEnabled` set to true. When it is false, Send returns `FORBIDDEN` "Action not authorized".

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

## Download PDF

| Field | Description |
|---|---|
| Put Output File in Field | The name of the binary field that gets the PDF. Default is `data` |

The node reads the `pdfUrl` of the invoice and downloads the file. The URL is public, so the node sends no credentials. If the download fails for a Wave URL, the node tries again with the credentials of the node. The output has `invoiceId`, `invoiceNumber` and `pdfUrl`, and the file is in the binary field.

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
