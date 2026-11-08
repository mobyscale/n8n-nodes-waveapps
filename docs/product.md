# Product / Service

A product or service is an item that you sell on invoices or buy on bills.

All operations have a **Business** field. To pick a product, use the **Product** field. You can select it from a list or enter its ID.

## Operations

| Operation | Description |
|---|---|
| Archive | Archive a product or service. Wave cannot delete products |
| Create | Create a product or service. Required: **Name**, **Unit Price** |
| Get | Get one product or service |
| Get Many | Get products and services. You can filter and sort the list |
| Update | Change a product or service |

## Fields

| Field | Used in | Description |
|---|---|---|
| Name | Create, Update | The name of the product |
| Unit Price | Create, Update | The price per unit in the major currency unit, for example 12.50 |
| Description | Create, Update | A description of the product |
| Default Sales Taxes | Create, Update | The sales taxes that Wave adds by default. Select each sales tax from a list |
| Income Account | Create, Update | An income account. Wave then marks the product as sold |
| Expense Account | Create, Update | An expense account. Wave then marks the product as bought |

On Create, you must set an income account, an expense account, or both. Wave rejects a product with neither.

On Update, the list of default sales taxes replaces the current list. An empty list removes all default sales taxes.

### Get Many filters

| Filter | Description |
|---|---|
| Is Sold | Return only products that the business sells, or does not sell |
| Is Bought | Return only products that the business buys, or does not buy |
| Is Archived | Return only archived or only active products. Without this filter, Wave returns only active products |
| Modified After | Return products that changed after this date |
| Modified Before | Return products that changed before this date |

The **Sort** field sets the order of the results. The default is newest first.

## Notes

- Archive returns `{ "success": true, "id": "...", "product": { ... } }`.
