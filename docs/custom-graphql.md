# Custom GraphQL

Send your own GraphQL query or mutation to the Wave API. Use it for data or mutations that the other resources do not have. The request uses the credential of the node.

## Operations

| Operation | Description | Fields |
|---|---|---|
| Execute | Send a query or a mutation and return the response data | **Query**, Variables, Options |

## Fields

| Field | Description |
|---|---|
| **Query** | The GraphQL query or mutation |
| Variables | The GraphQL variables as a JSON object, for example `{ "id": "QnVzaW5lc3M6..." }` |
| Options | **Return Mutation Output Only**. See below |

Put values in **Variables**, not in the query text. Then you do not have to escape quotes, and you can use expressions in the variables.

## Output

The node returns the `data` object of the response as one item. For example, the query `query { user { id } }` returns `{ "user": { "id": "..." } }`.

When Wave returns GraphQL errors, the node fails with the error messages.

### Return Mutation Output Only

When this option is on, the node returns only the value of the first field in `data`:

- For a mutation, this is the mutation output, for example `{ "didSucceed": true, "inputErrors": [], "customer": { ... } }`.
- When the output has `didSucceed: false`, the node fails with the input errors from Wave. Select `didSucceed` and `inputErrors { code message path }` in the mutation to get these messages.
- When the value is a list of objects, the node returns one item for each object.

## Example

Create a customer:

```graphql
mutation($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    didSucceed
    inputErrors { code message path }
    customer { id name }
  }
}
```

Variables:

```json
{ "input": { "businessId": "QnVzaW5lc3M6...", "name": "Example customer" } }
```

See the [Wave developer portal](https://developer.waveapps.com/) for the API reference and the API playground.
