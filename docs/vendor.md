# Vendor

A vendor is a person or company that a business buys from. Vendors belong to one business.

The Wave API can only read vendors. It cannot create, change or delete them. Create vendors in the Wave web app.

Every operation has a **Business** field. Get also has a **Vendor** field. You can select the vendor from a list or give its ID.

## Operations

| Operation | Description |
|---|---|
| Get | Get one vendor |
| Get Many | Get the vendors of a business |

Get and Get Many have a **Simplify** option. It is off by default. When you turn it on, the node returns flat values that you can write to a spreadsheet. See [Simplify](development.md#simplify).

## Get Many

| Filter | Description |
|---|---|
| Email | Only vendors with this email address |
| Modified After | Only vendors that changed after this date |
| Modified Before | Only vendors that changed before this date |

Use **Return All** to get all pages, or set a **Limit**.

## Output

The node returns the vendor as Wave sends it. This includes the contact data, address, currency, shipping details, `isArchived`, `createdAt` and `modifiedAt`.
