# Wave Trigger

The Wave Trigger node starts a workflow when a record in a Wave business is created or updated. The node polls the Wave API. It does not need a public URL, so it works on every n8n instance.

Use the [Wave Webhook Trigger](wave-webhook-trigger.md) for invoice, estimate and checkout events such as "invoice paid" or "estimate viewed". The polling trigger cannot see these events. It only sees that a record changed.

## Fields

| Field | Description |
|---|---|
| Authentication | Full Access Token or OAuth2. See [Credentials](credentials.md) |
| Business | The business to watch. Select it from the list, or give its ID or a Wave web app URL |
| Resource | Customer, Estimate, Invoice, Product, Sales Tax or Vendor |
| Event | Created, Updated, or Created or Updated |
| Filters | Optional filters. The filters depend on the resource (see below) |
| Poll Times | How often n8n checks Wave for changes |

### Filters

| Resource | Filters |
|---|---|
| Customer | Archived, Email |
| Estimate | Currency, Customer, Status |
| Invoice | Currency, Customer, Status |
| Product | Archived, Is Bought, Is Sold |
| Sales Tax | Archived |
| Vendor | Email |

**Archived** has three values: Active and Archived (the default), Active Only and Archived Only. Wave lists only active products and sales taxes when no value is sent, so the node always sends the value. Archiving a record is an update.

## Output

The node returns one item for each record. The item is the Wave record as the Wave API sends it, with all of its fields. Invoices and estimates include the customer (ID, name and email) and the line items.

## How the node finds changes

- Each Wave list has a `modifiedAtAfter` filter. The node reads all records that changed after the last poll.
- A record is **created** when its `createdAt` is after the last poll. Otherwise it is **updated**.
- The node reads 10 seconds more than the time since the last poll. This prevents lost changes when the clocks of n8n and Wave are not the same. The node keeps the `id` and `modifiedAt` of the records that it returned, and does not return the same change two times.
- The node keeps the last poll time and the recent record keys in the static data of the workflow.

### First poll

On the first poll after you activate the workflow, the node saves the time and returns nothing. Changes after that time start the workflow. When you change the business or the resource, the node starts again in the same way.

### Manual test

When you select **Fetch Test Event** (manual mode), the node returns the newest record that matches the resource and the filters. For the **Created** event, this is the record that was created last. For the other events, it is the record that was changed last. A manual test does not change the saved poll time.

## Limits

- Wave does not tell the node which fields changed.
- Wave does not send deleted records, so the node cannot see deletions.
- Vendors and sales taxes have no sort in the Wave API. In a manual test, the node reads all vendors or sales taxes to find the newest one.
