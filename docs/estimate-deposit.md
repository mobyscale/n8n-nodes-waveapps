# Estimate Deposit

An estimate deposit is a payment that a customer makes on an estimate. The Wave API can record, change, delete and send the receipt of a manual deposit. Wave adds card payments by itself.

Wave accepts a deposit only on an estimate that is not a draft. Approve the estimate first (see [Estimate](estimate.md)).

## Operations

| Operation | Description |
|---|---|
| Record Manual Deposit | Record a deposit that the customer paid outside of Wave |
| Get | Get a deposit by its ID |
| Update | Change a manual deposit |
| Delete | Delete a deposit. Returns `{ success: true, id }` |
| Send Receipt | Send the receipt of a deposit by email |

## Fields

| Operation | Field | Notes |
|---|---|---|
| All except Delete | Business | Required |
| Record Manual Deposit, Update, Send Receipt | Estimate | Required. Select it from the list or use its ID |
| Get, Update, Delete, Send Receipt | Deposit ID | Required. The Wave API ID of the deposit |
| Record Manual Deposit | Payment Date | Required |
| Record Manual Deposit | Amount | Required. In major currency units, for example 123.45 |
| Record Manual Deposit | Payment Method | Required. Bank Transfer, Cash, Cheque, Credit Card, Other or Paypal |
| Record Manual Deposit | Additional Fields | Payment Account (a cash or bank account), Memo |
| Update | Update Fields | Amount, Memo, Payment Account, Payment Date, Payment Method |
| Send Receipt | To | Required. Email addresses, separated by commas |
| Send Receipt | Options | Attach PDF, CC Myself, From Address, Message, Subject |

## Output

Record Manual Deposit, Get and Update return the deposit as Wave sends it. Send Receipt returns `{ success: true, estimateId, estimatePaymentId }`.
