# @mobyscale/n8n-nodes-waveapps

[![npm](https://img.shields.io/npm/v/@mobyscale/n8n-nodes-waveapps)](https://www.npmjs.com/package/@mobyscale/n8n-nodes-waveapps)

n8n community nodes for [Wave](https://www.waveapps.com/) accounting. The nodes use the Wave public GraphQL API.

[Installation](#installation) · [Credentials](#credentials) · [Nodes](#nodes) · [Development](#development)

<img width="1273" height="822" alt="image" src="https://github.com/user-attachments/assets/95a0dfec-8972-4ed4-9aa8-76efee19d35b" />

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `@mobyscale/n8n-nodes-waveapps`.

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
| [Customer](docs/customer.md) | Create, Create or Update, Delete, Get, Get Many, Update |
| [Estimate](docs/estimate.md) | Approve, Clone, Convert to Invoice, Create, Delete, Generate PDF, Get, Get Many, Mark Accepted, Mark Sent, Reset Acceptance, Send, Send Acceptance Email, Update |
| [Estimate Deposit](docs/estimate-deposit.md) | Delete, Get, Record Manual Deposit, Send Receipt, Update |
| [Invoice](docs/invoice.md) | Approve, Clone, Create, Delete, Download PDF, Get, Get Many, Mark Sent, Send, Update |
| [Invoice Payment](docs/invoice-payment.md) | Delete, Get, Record Manual Payment, Send Receipt, Update |
| [Product / Service](docs/product.md) | Archive, Create, Get, Get Many, Update |
| [Sales Tax](docs/sales-tax.md) | Archive, Create, Get, Get Many, Update |
| [Transaction](docs/transaction.md) | Create, Create Many |
| [User](docs/user.md) | Get Current, Get OAuth Application |
| [Vendor](docs/vendor.md) | Get, Get Many |
| [Reference Data](docs/reference-data.md) | Get Account Subtypes, Get Account Types, Get Countries, Get Country, Get Currencies, Get Currency, Get Province |

### Wave Trigger

Starts a workflow when a customer, estimate, invoice, product, sales tax or vendor is created or updated. The node polls the Wave API, so it does not need a public URL. See [Wave Trigger](docs/wave-trigger.md).

### Wave Webhook Trigger

Starts a workflow when Wave sends a webhook event, for example `invoice.paid` or `estimate.viewed`. You register the URL of the node in the Wave dashboard. The node checks the signature of each event and adds the Wave API IDs to the output. See [Wave Webhook Trigger](docs/wave-webhook-trigger.md).

## Compatibility

Tested with n8n 2.x and Node.js 22.

Built against the Wave GraphQL schema of 2026-11-08. Wave does not version its API. See [Wave API version](docs/wave-api.md) for the baseline and for how to compare it with a new schema.

## Development

See [Development](docs/development.md).

## Resources

- [Wave developer portal](https://developer.waveapps.com/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE)
