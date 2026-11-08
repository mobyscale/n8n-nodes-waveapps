# Wave Webhook Trigger

The Wave Webhook Trigger node starts a workflow when Wave sends a webhook event, for example when a customer pays an invoice or views an estimate.

Wave must reach n8n from the internet over HTTPS. If this is not possible, use the [Wave Trigger](wave-trigger.md). It polls the Wave API.

## Requirements

- A Wave OAuth application. Wave sends webhook events only to OAuth applications.
- Each business must have an active Wave Pro subscription and must connect the application through OAuth2.
- The connection must have the scopes of the events: `invoice:read` for invoice events, `estimate:read` for estimate events and `checkout:read` for `checkout.paid`.

## Setup

Wave has no API to register a webhook. You register the URL in the Wave dashboard.

1. Add the Wave Webhook Trigger node to a workflow.
2. Activate the workflow. Open the node and copy the **Production URL** from **Webhook URLs**.
3. In Wave, open **Tools > Webhooks** for your OAuth application.
4. Paste the URL and select the events. Wave allows one endpoint URL for each OAuth application. To send events to more than one workflow, use one workflow that receives all events and calls the other workflows.
5. Copy the signing secret of the endpoint.
6. In n8n, create a **Wave Webhook Secret API** credential and paste the secret. Select the credential in the node.

The **Test URL** works only while n8n listens for a test event. To test with it, paste the test URL in Wave for the time of the test, then change it back to the production URL.

## Fields

| Field | Description |
|---|---|
| Verify Signature | Check the `x-wave-signature` header with the webhook secret. Default: on |
| Wave Webhook Secret API | The credential with the signing secret. Shown when **Verify Signature** is on |
| Events | The events that start the workflow. Leave empty for all events |
| Add API IDs | Add an `apiIds` object with Wave API IDs. Default: on |
| Fetch Full Record | Load the invoice or the estimate of the event through the Wave API. Default: off |
| Authentication | Full Access Token or OAuth2, for **Fetch Full Record**. Shown when **Fetch Full Record** is on |

## Events

| Resource | Events |
|---|---|
| Invoice | `invoice.approved`, `invoice.overdue`, `invoice.overpaid`, `invoice.paid`, `invoice.partially_paid`, `invoice.sent`, `invoice.viewed` |
| Estimate | `estimate.accepted`, `estimate.approved`, `estimate.expired`, `estimate.overpaid`, `estimate.paid`, `estimate.partially_paid`, `estimate.reset`, `estimate.sent`, `estimate.viewed` |
| Checkout | `checkout.paid` |

The node reads the event type from the `event_type`, `eventType`, `type`, `event` or `event_name` field of the payload. It accepts other spellings of the same event, for example `INVOICE_PAID`.

## Output

The node returns one item for each event. The item is the payload as Wave sends it, plus these fields:

| Field | When | Content |
|---|---|---|
| `apiIds` | **Add API IDs** is on | Wave API IDs: `businessId`, `invoiceId`, `estimateId`, `customerId`, `checkoutId`. Only the IDs that are in the payload |
| `record` | **Fetch Full Record** is on | The full invoice or estimate from the Wave API |
| `recordError` | **Fetch Full Record** is on and the request failed | The error message |

### API IDs

The payload has raw UUIDs, for example `business_id` and `invoice_id`. The Wave API needs other IDs:

- Business: `base64("Business:<business_id>")`
- Invoice: `base64("Business:<business_id>;Invoice:<invoice_id>")`
- Estimate, customer and checkout: the same, with `Estimate`, `Customer` or `Checkout`

The node finds the IDs at any depth of the payload. It accepts names like `invoice_id` and `invoiceId`, and the `id` of an object named `invoice`. You can use `apiIds` directly in the Wave node, for example `{{ $json.apiIds.invoiceId }}`. The Wave node also accepts the raw UUIDs.

## Responses to Wave

Wave retries a request that gets a 5xx response or a timeout, up to 6 times in about 14 hours. Wave does not retry a 4xx response, and suspends the subscription after 10 failures in a row. So the node replies as follows:

| Request | Response | Workflow |
|---|---|---|
| Valid event that you selected | 200 | Starts |
| Valid event that you did not select | 200 | Does not start |
| Signature not valid, or timestamp more than 300 seconds from now | 401 | Does not start |

When **Fetch Full Record** is on, the node replies 200 before it loads the record. If the request fails, the workflow starts with `recordError`.

## Signature

Wave sends two headers:

- `x-wave-signature`: `t=<timestamp>,v1=<hex signature>`
- `x-wave-timestamp`: the timestamp

The signature is the HMAC-SHA256 hex digest of `<timestamp>.<raw request body>`, with the webhook secret as the key. The node uses the raw body exactly as Wave sends it, and compares the signatures in constant time.

## Why the credential is optional

**Verify Signature** is on by default, and then the node needs the **Wave Webhook Secret API** credential. Turn it off only for a test, for example when you send a payload yourself.

**Fetch Full Record** needs a Wave API credential. The node shows the **Authentication** field and the API credential only when this option is on.
