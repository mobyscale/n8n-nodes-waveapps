# Sales Tax

A sales tax is a tax that you add to products and invoice items. A sales tax can have different rates for different dates.

All operations have a **Business** field. To pick a sales tax, use the **Sales Tax** field. You can select it from a list or enter its ID.

## Operations

| Operation | Description |
|---|---|
| Archive | Archive a sales tax. Wave cannot delete sales taxes |
| Create | Create a sales tax. Required: **Name**, **Abbreviation**, **Rate** |
| Get | Get one sales tax, with its current rate and its rate history |
| Get Many | Get sales taxes. You can filter the list |
| Update | Change a sales tax or give it a new rate |

## Fields

| Field | Used in | Description |
|---|---|---|
| Name | Create, Update | The name of the tax |
| Abbreviation | Create, Update | A short code with at most 10 characters. It must be unique in the business |
| Rate | Create, Update | The rate as a decimal. For example, 0.15 is 15% |
| Rate Effective Date | Update | The date from which the new rate applies. The default is today |
| Description | Create, Update | A description of the tax |
| Tax Number | Create, Update | The identification number from the tax authority |
| Show Tax Number on Invoices | Create, Update | Whether to show the tax number beside the tax name on an invoice |
| Is Compound | Create | Whether Wave calculates the tax on top of the subtotal and the other taxes |
| Is Recoverable | Create | Whether you can deduct the tax that you paid from the tax that you collected |

### Get Many filters

| Filter | Description |
|---|---|
| Is Archived | Return only archived or only active sales taxes. Without this filter, Wave returns only active sales taxes |
| Modified After | Return sales taxes that changed after this date |
| Modified Before | Return sales taxes that changed before this date |

## Notes

- A sales tax keeps a history of rates, each with an effective date. The first rate starts at 0001-01-01. When you set **Rate**, the node adds a new rate to the history from the **Rate Effective Date**. Wave rejects a date that already has a rate.
- Archive returns `{ "success": true, "id": "...", "salesTax": { ... } }`.
