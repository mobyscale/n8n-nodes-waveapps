# Customer

A customer is a person or company that buys from a business. Customers belong to one business.

Every operation has a **Business** field. Operations that work on one customer also have a **Customer** field. You can select the customer from a list or give its ID. A raw customer ID from a webhook also works.

## Operations

| Operation | Description |
|---|---|
| Create | Create a customer. Only **Name** is required |
| Create or Update | Find a customer and update it, or create it when none matches. See [Create or Update](#create-or-update) |
| Delete | Delete a customer. The node returns `{ success: true, id }` |
| Get | Get one customer |
| Get Many | Get the customers of a business |
| Update | Change fields of a customer. The node sends only the fields that you set |

## Fields

### Create (Additional Fields) and Update (Update Fields)

| Field | Description |
|---|---|
| Address | Address line 1 and 2, city, country, province or state, postal code |
| Currency | The default currency of the customer |
| Display ID | Your own ID for the customer, also called the account number |
| Email | Email address of the main contact |
| Fax | Fax number |
| First Name | First name of the main contact |
| Internal Notes | Notes that the customer does not see |
| Last Name | Last name of the main contact |
| Mobile | Mobile number of the main contact |
| Name | Update only. The new name of the customer |
| Phone | Phone number |
| Shipping Details | Name, phone, delivery instructions and address for shipping |
| Toll Free | Toll-free number |
| Website | Website address |

An empty field is not sent. On Update, Wave keeps the fields that you do not set.

### Create or Update

This operation has the same fields as Create: **Name** is required, and **Additional Fields** are the same. It also has **Match By**:

| Match By | How the node finds the customer |
|---|---|
| Email (default) | Uses the **Email** in Additional Fields. Wave does the search |
| Name | Uses **Name**. The node reads all customers and compares the names. It ignores case and outer spaces |
| Display ID | Uses the **Display ID** in Additional Fields. The node reads all customers and compares the IDs. The match is exact |

Name and Display ID need more requests when the business has many customers.

- If the value to match is empty, the node fails with a message.
- If one customer matches, the node updates it with the fields that you set. Empty fields do not clear values in Wave.
- If no customer matches, the node creates the customer.
- If more than one customer matches, the node fails. The message lists the matching IDs.

The node returns the customer, as Create and Update do.

### Get Many

| Filter | Description |
|---|---|
| Email | Only customers with this email address |
| Is Archived | Only archived customers (true) or only active customers (false) |
| Modified After | Only customers that changed after this date |
| Modified Before | Only customers that changed before this date |

| Option | Description |
|---|---|
| Sort | The order of the results. The default is Name Ascending |

Use **Return All** to get all pages, or set a **Limit**.

## Output

The node returns the customer as Wave sends it. This includes the contact data, address, currency, shipping details, `outstandingAmount`, `overdueAmount`, `isArchived`, `isActive`, `createdAt` and `modifiedAt`.
