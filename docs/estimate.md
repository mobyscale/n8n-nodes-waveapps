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

Most operations have a **Business** field and an **Estimate** field. Select the estimate from the list or use its ID.

## Create

| Field | Notes |
|---|---|
| Customer | Required |
| Items | Product, Description, Quantity, Unit Price, Sales Tax, More Sales Tax IDs. Leave **Unit Price** empty to use the price of the product. Leave the taxes empty to use the default taxes of the product |
| Additional Fields | Amount Column Title, Attachment IDs, Currency, Deposit Status, Deposit Unit, Deposit Value, Disable American Express Payments, Disable Bank Payments, Disable Credit Card Payments, Discounts, Don't Carry Over Notes to Invoice, Due Date, Estimate Date, Estimate Number, Exchange Rate, Footer, Hide Amount, Hide Description, Hide Name, Hide Price, Hide Unit, Item Column Title, Memo, PO Number, Price Column Title, Require Terms of Service Agreement, Subheading, Title, Unit Column Title |

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
