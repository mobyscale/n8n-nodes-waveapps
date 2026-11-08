# Account

An account is one entry in the chart of accounts of a business. Wave sorts accounts by type (for example Income or Expense) and by subtype.

All operations have a **Business** field. To pick an account, use the **Account** field. You can select it from a list or enter its ID.

## Operations

| Operation | Description |
|---|---|
| Archive | Archive an account. Wave cannot delete accounts |
| Create | Create an account. Required: **Name**, **Subtype** |
| Get | Get one account, with its type, subtype and balance |
| Get Many | Get the accounts of the chart of accounts |
| Update | Change the name, description or display ID of an account |

Get and Get Many have a **Simplify** option. It is off by default. When you turn it on, the node returns flat values that you can write to a spreadsheet. See [Simplify](development.md#simplify).

## Fields

| Field | Used in | Description |
|---|---|---|
| Name | Create, Update | The name of the account |
| Subtype | Create | The subtype. The subtype sets the account type. Wave allows fewer subtypes on create than it shows on read |
| Currency | Create (Additional Fields) | The default is the currency of the business |
| Description | Create, Update | A description of the account |
| Display ID | Create, Update | An ID that you define |
| Can Archive | Create (Additional Fields) | Whether a user can archive the account. Only some applications can set this |

### Get Many filters

| Filter | Description |
|---|---|
| Types | Return only accounts of these types |
| Subtypes | Return only accounts of these subtypes |
| Excluded Subtypes | Do not return accounts of these subtypes |
| Is Archived | Return only archived or only active accounts. Without this filter, Wave returns only active accounts |

## Notes

- Wave needs the current sequence number of an account to change it. The Update operation reads it for you.
- Archive returns `{ "success": true, "id": "..." }`.
