# Credentials

The Wave node supports two types of credentials. Select the type in the **Authentication** field of the node.

## Full Access Token (`Wave API`)

A full access token gives access to all businesses of the Wave user that made it. Use it for your own Wave account.

1. Sign in to the [Wave developer portal](https://developer.waveapps.com/).
2. Open **Manage Applications** and select or create an application.
3. Create a full access token.
4. In n8n, create a **Wave API** credential and paste the token.

## OAuth2 (`Wave OAuth2 API`)

Use OAuth2 when other Wave users connect their accounts, or when you need webhooks. Wave sends webhook events only to applications that a user authorized with OAuth2.

1. In the Wave developer portal, open **Manage Applications** and select or create an application.
2. Copy the **OAuth Redirect URL** from the n8n credential and add it to the redirect URIs of the application. The host and port must match exactly.
3. In n8n, create a **Wave OAuth2 API** credential. Paste the client ID and the client secret.
4. Change the scopes if you need less access. The default scopes give full access.
5. Select **Connect my account** and approve the access in Wave.

Notes:

- Wave lets users connect only businesses that have an active Pro or Wave Advisor subscription.
- Wave reports an expired access token in the response body, not with HTTP status 401. The node finds this error, refreshes the token and sends the request again.

### Scopes

| Scope | Gives access to |
|---|---|
| `account:*` | Chart of accounts |
| `business:*` | Businesses |
| `checkout:*` | Checkouts (needed for the `checkout.paid` webhook) |
| `customer:*` | Customers |
| `estimate:*` | Estimates |
| `invoice:*` | Invoices and invoice payments |
| `product:*` | Products and services |
| `sales_tax:*` | Sales taxes |
| `transaction:*` | Money transactions |
| `user:*` | The connected user |
| `vendor:*` | Vendors |

`write` does not include `read`. Use `<resource>:*` for full access to a resource.
