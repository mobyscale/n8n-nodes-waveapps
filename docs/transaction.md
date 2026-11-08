# Transaction

A transaction records money that goes into or out of an account, for example a bank payment for an expense. The Wave API can create transactions. It cannot read, list, change or delete them. To change or delete a transaction, use the Wave web app.

Wave creates transactions with this API only for businesses that do not use classic accounting.

## How a transaction works

A transaction has two sides:

- The **anchor**: the bank, cash or credit card account. The anchor has an amount and a direction: **Deposit** (money in) or **Withdrawal** (money out).
- The **line items**: the category side, for example an expense account or an income account. Each line item has an account, an amount and a balance type.

The line item amounts must add up to the anchor amount. If they do not, Wave rejects the transaction ("under balanced" or "over balanced").

## Operations

| Operation | Description |
|---|---|
| Create | Create one transaction for each input item |
| Create Many | Create one transaction for each input item, in batch requests. One node run sends all items in as few requests as possible |

## Fields

Create and Create Many have the same fields.

| Field | Description |
|---|---|
| **Business** | The business of the transaction |
| **Mode** | **Simple** or **Advanced**. See below |
| **Anchor Account** | The bank, cash or credit card account. See [Anchor accounts](#anchor-accounts) |
| **Date** | The date of the transaction. Wave keeps only the date |
| **Description** | The description of the transaction. Wave does not accept an empty description |
| **Amount** | The total amount, including taxes. Use a positive number |
| **External ID** | Your ID for the transaction. See [External ID](#external-id) |
| Additional Fields | **Notes**. In simple mode also **Customer** and **Sales Taxes** |
| Options (Create Many) | **Batch Size**: the number of transactions in one request. The default is 20 and the maximum is 50 |

### Simple mode

Select **Type**:

- **Expense**: money goes out of the anchor account. Select the **Expense Account**.
- **Income**: money comes into the anchor account. Select the **Income Account**.

The node sets the direction and the balance type for you. The full amount goes to the one category account.

### Advanced mode

Set the **Direction** of the anchor and add the **Line Items**. Each line item has:

| Field | Description |
|---|---|
| **Account** | The category account |
| **Amount** | The amount of the line, including its taxes |
| **Balance** | How the account changes. See [Balance types](#balance-types) |
| Description | A description of the line |
| Customer | The customer of the line |
| Sales Taxes | The taxes that are part of the line amount |

A line item cannot use a bank, cash, credit card, loan or money in transit account. Wave returns "This value is invalid". The API cannot record a transfer between two of these accounts.

If you add no line items, Wave puts the full amount in **Uncategorized Expense** or **Uncategorized Income**.

## Balance types

| Balance | Effect |
|---|---|
| Increase | Increases the account in its normal direction. Use it for a normal expense or income |
| Decrease | Decreases the account. Use it for a refund, for example a deposit that decreases an expense account |
| Debit | Debits the account. For an expense account, this is the same as Increase |
| Credit | Credits the account. For an income account, this is the same as Increase |

Use **Increase** and **Decrease**. Then you do not have to know the normal balance of each account.

The debits and credits must balance. For example, a withdrawal from the bank account with an expense line item set to **Decrease** fails ("must have at least one debit and credit line item").

## Sales taxes

The line amount **includes** the tax. Do not add the tax to the amount. For example, an expense of 11.00 with 1.00 tax is one line item with amount 11.00 and a tax amount of 1.00, and the anchor amount is 11.00.

You must give the tax amount. Wave does not calculate it from the tax rate.

| Line type | What Wave does with the tax |
|---|---|
| Income | Moves the tax amount from the income account to the sales tax account |
| Expense, recoverable tax | Moves the tax amount from the expense account to the sales tax account |
| Expense, tax that is not recoverable | Keeps the full amount in the expense account |

The tax amount cannot be more than the line amount.

## Anchor accounts

The anchor account list shows the account subtypes that Wave accepts as the anchor:

- Cash and bank, credit card, loans, money in transit
- Other current assets, other long-term assets, property, plant and equipment, inventory
- Vendor prepayments and credits, customer prepayments and credits
- Other current liabilities, other long-term liabilities
- Due to you and other owners, business owner contributions and drawings

Wave does not accept accounts receivable, accounts payable, payroll liabilities, retained earnings, income or expense accounts as the anchor.

## External ID

Wave needs an External ID for each transaction. When the field is empty, the node uses a random ID.

Wave rejects a transaction when another transaction in the business has the same External ID ("A transaction with the same externalId already exists"). Use a stable ID from the source system, for example the ID of the bank transaction or the order. Then you can run the workflow again without duplicates: the transactions that exist already fail, and the new ones are created. Turn on **Continue On Fail** (On Error: Continue) to keep the other items running.

The output of each transaction includes the `externalId` that the node sent.

## Create Many

Create Many puts all input items in batch requests. The items can use different businesses. The node sends one or more batches for each business.

- Wave creates all transactions in a batch, or none of them.
- If one transaction in a batch is not valid, Wave rejects the full batch. The error message does not always tell which transaction has the problem. Use Create with the same items to find it.
- If two items have the same External ID, the node fails the second item before it sends the batch.
- Large batches can time out. A batch that timed out can still be created in Wave. Run it again with the same External IDs: Wave rejects the transactions that exist.
- With Continue On Fail, each item of a failed batch gets an output item with the error.

## Output

Create returns the Wave mutation output and the External ID:

```json
{
  "didSucceed": true,
  "inputErrors": [],
  "transaction": { "id": "QnVzaW5lc3M6..." },
  "externalId": "bank-feed-12345"
}
```

Create Many returns one item for each transaction, paired with its input item:

```json
{
  "didSucceed": true,
  "transaction": { "id": "QnVzaW5lc3M6..." },
  "externalId": "bank-feed-12345"
}
```

Wave rounds amounts to the precision of the currency.
