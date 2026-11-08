# Business

A business is a company in Wave. Most Wave records belong to one business, so most operations of the Wave node have a **Business** field.

You can set the business in three ways:

- **From List**: select a business that the credential can access.
- **By ID**: the Wave API ID (for example `QnVzaW5lc3M6...`) or the raw business UUID from a webhook payload.
- **By URL**: any Wave web app URL that contains the business, for example `https://next.waveapps.com/<uuid>/dashboard`.

## Operations

| Operation | Description |
|---|---|
| Get | Get a business, with its address, currency and contact data |
| Get Invoice and Estimate Settings | Get the accent color and logo URL that the business uses on invoices and estimates |
| Get Many | Get the businesses that the credential can access. Filter: **Is Archived** |

The Wave API cannot create, change or delete businesses.
