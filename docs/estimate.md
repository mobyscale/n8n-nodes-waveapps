# Estimate

An estimate is a price offer for a customer. It lists products, quantities and prices. You can send it, mark it as accepted and convert it to an invoice. Deposits that customers pay on an estimate are in [Estimate Deposit](estimate-deposit.md).

## Operations

| Operation | Description |
|---|---|
| Approve | Approve an estimate |
| Clone | Create a copy of an estimate |
| Convert to Invoice | Create an invoice from an estimate. Returns `{ success, estimateId, invoiceId }` |
| Create | Create an estimate |
| Delete | Delete an estimate. Returns `{ success: true, id }` |
| Generate PDF | Generate the PDF of an estimate and return its URL. **Download PDF** also returns the file as binary data |
| Get | Get an estimate. Options: **Embed Attachments**, **Embed History**, **Embed Deposit Payments** |
| Get Many | Get many estimates. See the filters below |
| Mark Accepted | Mark an estimate as accepted |
| Mark Sent | Mark an estimate as sent. Fields: **Send Method**, **Sent At** |
| Reset Acceptance | Remove the accepted state of an estimate |
| Send | Send an estimate by email |
| Send Acceptance Email | Send the customer an email that confirms the acceptance |
| Update | Change an estimate |

Get and Get Many have a **Simplify** option. It is off by default. When you turn it on, the node returns flat values that you can write to a spreadsheet. See [Simplify](development.md#simplify).

Most operations have a **Business** field and an **Estimate** field. Select the estimate from the list or use its ID.

## Create

| Field | Notes |
|---|---|
| Customer | Required |
| Match Products By Name | Give each item a product name. See below |
| Default Income Account | Required when you match products by name |
| Items | Product (or Product Name), Name, Description, Quantity, Unit Price and Taxes. Add one entry to **Taxes** for each sales tax. Leave **Unit Price** empty to use the price of the product. Leave the taxes empty to use the default taxes of the product |
| Additional Fields | Amount Column Title, Attachment IDs, Currency, Deposit Status, Deposit Unit, Deposit Value, Disable American Express Payments, Disable Bank Payments, Disable Credit Card Payments, Discounts, Don't Carry Over Notes to Invoice, Due Date, Estimate Date, Estimate Number, Exchange Rate, Footer, Hide Amount, Hide Description, Hide Name, Hide Price, Hide Unit, Item Column Title, Memo, PO Number, Price Column Title, Require Terms of Service Agreement, Subheading, Title, Unit Column Title |

### Match Products By Name

Wave needs a product on each item. Turn on **Match Products By Name** to give each item a **Product Name** instead of a product. Then **Default Income Account** is required.

For each item, the node does these steps:

1. It looks for an active (not archived) product with the same name. Spaces at the start and end are ignored, and upper and lower case are the same.
2. If there is none, it creates the product. The product gets the name, the **Unit Price** of the item (or `0` when the price is empty) and the default income account.

The node reads the product list of the business once for each run and keeps it in memory. A product that the node creates is added to this list. So 50 items do not mean 50 list calls, and two items with the same new name give one product.

If two active products have the same name, the node uses the oldest one.

### After Create

**After Create** runs more steps after Wave creates the estimate. Wave rejects Mark Sent and Send on a draft, so each step starts with Approve.

| Value | Steps |
|---|---|
| Leave as Draft | None. This is the default |
| Approve | Approve |
| Approve and Mark Sent | Approve, then Mark Sent |
| Approve and Send | Approve, then Send |

The node returns the estimate as Wave has it after the last step.

**Approve and Send** shows the fields of the Send operation. **Send To** is the email address of the customer when you leave it empty.

If a step fails, the error says that the estimate was created and gives its ID. Use the ID to continue. Do not create the estimate again. Wave can send email only when the business has `emailSendEnabled` set to true. When it is false, Send returns `FORBIDDEN` "Action not authorized".

The **More Sales Tax IDs** field is removed. Add one entry to the **Taxes** list of an item for each sales tax instead.

## Update

The **Update Fields** collection has the same fields as **Additional Fields**, plus **Customer**, **Status** and **Items**. **Items** replaces all items of the estimate.

Wave resets an optional field that it does not get. The node reads the estimate first and sends the current values for all fields that you do not change.

## Get Many

| Field | Notes |
|---|---|
| Return All, Limit | Paging |
| Sort | One value, for example Created At Desc (default) or Estimate Number Asc |
| Filters | Amount Due, Customer, Currency, Estimate Date From, Estimate Date To, Estimate Number, Modified After, Modified Before, Status |

## Send

| Field | Notes |
|---|---|
| To | Required. Email addresses, separated by commas |
| Options | Attach PDF, CC Myself, From Address, Hide Grand Total, Include Attachments, Message, Subject |

## Notes about the Wave API

- Deposit settings need a Wave plan with online payments. Wave rejects them with "does not have entitlement" on other plans.
- Wave rejects Send, Send Acceptance Email and Mark Accepted with "Action not authorized" when email sending is not enabled for the business.
- Wave does not accept a deposit payment on a draft estimate.
- The PDF URL that Generate PDF returns is only valid for a short time. Use **Download PDF** to keep the file.
