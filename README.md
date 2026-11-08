# n8n-nodes-waveapps

n8n community nodes for [Wave](https://www.waveapps.com/) accounting. The nodes use the Wave public GraphQL API.

[Installation](#installation) · [Credentials](#credentials) · [Nodes](#nodes) · [Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-waveapps`.

## Credentials

The nodes support a Wave full access token and Wave OAuth2. See [Credentials](docs/credentials.md).

## Nodes

### Wave

Select a resource, then an operation. Fields that refer to Wave records (business, customer, product, account and others) have a searchable list, so you can select a record without its ID.

| Resource | Operations |
|---|---|
| [Account](docs/account.md) | Archive, Create, Get, Get Many, Update |
| [Business](docs/business.md) | Get, Get Invoice and Estimate Settings, Get Many |
| [Custom GraphQL](docs/custom-graphql.md) | Execute |
| [Customer](docs/customer.md) | Create, Delete, Get, Get Many, Update |
| [Estimate](docs/estimate.md) | Approve, Clone, Convert to Invoice, Create, Delete, Generate PDF, Get, Get Many, Mark Accepted, Mark Sent, Reset Acceptance, Send, Send Acceptance Email, Update |
| [Estimate Deposit](docs/estimate-deposit.md) | Delete, Get, Record Manual Deposit, Send Receipt, Update |
| [Invoice](docs/invoice.md) | Approve, Clone, Create, Delete, Get, Get Many, Mark Sent, Send, Update |
| [Invoice Payment](docs/invoice-payment.md) | Delete, Get, Record Manual Payment, Send Receipt, Update |
| [Product / Service](docs/product.md) | Archive, Create, Get, Get Many, Update |
| [Sales Tax](docs/sales-tax.md) | Archive, Create, Get, Get Many, Update |
| [Transaction](docs/transaction.md) | Create, Create Many |
| [User](docs/user.md) | Get Current, Get OAuth Application |
| [Vendor](docs/vendor.md) | Get, Get Many |
| [Reference Data](docs/reference-data.md) | Get Account Subtypes, Get Account Types, Get Countries, Get Country, Get Currencies, Get Currency, Get Province |

## Compatibility

Tested with n8n 2.x and Node.js 22.

## Development

See [Development](docs/development.md).

## Resources

- [Wave developer portal](https://developer.waveapps.com/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE)
