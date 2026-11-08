# Invoice Payment

An invoice payment is money that a customer paid for an invoice. The Wave API can record payments that were made outside of Wave. It cannot create card payments.

## Operations

| Operation | Description |
|---|---|
| Delete | Delete a manual payment. Returns `{ success: true, id }` |
| Get | Get one payment |
| Record Manual Payment | Record a payment for an invoice |
| Send Receipt | Send the receipt of a payment by email |
| Update | Change a manual payment |

Get has a **Simplify** option. It is off by default. When you turn it on, the node returns flat values that you can write to a spreadsheet. See [Simplify](development.md#simplify).

Every operation has a **Business** field.

## Select a payment

Wave has no list of all payments. The **Payment** field gets its list from one invoice:

- For Get, Update and Delete, select an invoice in the optional **Invoice** field. Then open the **Payment** list.
- For Send Receipt, the required **Invoice** field also fills the list.
- You can also use **By ID** and enter the payment ID.

## Record Manual Payment

| Field | Description |
|---|---|
| Invoice | Required. The invoice that the payment is for |
| Payment Account | Required. The account that receives the payment, for example a bank account |
| Amount Type | `Custom Amount` (default) uses the **Amount** field. `Full Balance` pays the amount due of the invoice |
| Amount | Required for Custom Amount. The amount in the currency of the invoice |
| Payment Date | Required. The date of the payment |
| Payment Method | Required. `Bank Transfer`, `Cash`, `Cheque`, `Credit Card`, `Other`, `Paypal` or `Unspecified` |
| Exchange Rate | Required by Wave. Default is `1`. Wave uses it only when the invoice and the payment account have different currencies |
| Memo | Optional note (in Additional Fields) |
| Send Receipt | Send the receipt by email after Wave records the payment. Default is off |
| Receipt To | Email addresses, separated by commas. Leave it empty to use the email address of the customer |
| Receipt Options | Attach PDF, CC Myself, From Address, Message and Subject |

### Pay in full

With **Amount Type** set to `Full Balance`, the node reads `amountDue.value` of the invoice and uses it as the amount. If the amount due is 0, the node stops with an error and records no payment.

### Send a receipt

When **Send Receipt** is on, the node calls the receipt mutation after it records the payment. The node returns the payment. If the receipt fails, the error says that the payment was recorded and gives the payment ID. Do not record the payment again. Wave can send email only when the business has `emailSendEnabled` set to true. When it is false, Wave returns `FORBIDDEN` "Action not authorized".

## Update

**Update Fields** can set Amount, Exchange Rate, Memo, Payment Account, Payment Date and Payment Method. Wave changes only the fields that you set.

## Send Receipt

| Field | Description |
|---|---|
| Invoice | Required. The invoice of the payment |
| Payment | Required. The payment |
| To | Required. Email addresses, separated by commas |
| Attach PDF | Attach a PDF of the invoice |
| CC Myself | Send a copy to the sender |
| From Address | The sender address |
| Message | The message text |
| Subject | The subject line |
