# Development

This page tells contributors (people and agents) how the package is built. Read it before you add or change a resource.

## Setup

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `WAVE_ACCESS_TOKEN`. Do not commit `.env`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts n8n at `http://localhost:5678` with the nodes loaded and hot reload |
| `npm run build` | Builds the package into `dist` |
| `npm run lint` | Runs the n8n community node lint rules. Fix all errors and warnings |
| `npm test` | Runs the unit tests (no network) |
| `npm run test:integration` | Runs the integration tests against the Wave account in `.env` |
| `npm run schema:update` | Downloads the Wave schema and generates the types again. See [Wave API version](wave-api.md) |

## Layout

```
credentials/                 WaveApi (full access token) and WaveOAuth2Api
nodes/Wave/
  Wave.node.ts               Node class. Sends each item to the resource operation handler
  wave.svg, wave.dark.svg    The only icon files. Other nodes and the credentials use them with
                             relative paths, for example file:../Wave/wave.svg
  resources/<resource>/      One folder per resource: description and operation handlers
  resources/index.ts         The list of resources in the Resource dropdown
  methods/listSearch.ts      Search methods for resource locator lists
  methods/searchHelpers.ts   Shared search code (paging, filter, selected business)
  methods/loadOptions.ts     Dropdown option methods (currencies, countries, provinces, ...)
  shared/descriptions.ts     Field builders: business locator, resource locators, paging, address
  shared/fields.ts           GraphQL selection sets that several resources share
  shared/ids.ts              Wave ID helpers (raw webhook UUID to API ID)
  shared/utils.ts            Parameter helpers, compactInput, error helpers
  transport/index.ts         waveRequest, waveMutation, waveGetAll
  generated/schema.ts        TypeScript types from the Wave schema (generated)
  generated/enums.ts         Wave enum values with descriptions (generated)
schema/wave.graphql          The Wave schema in SDL form (generated)
test/unit/                   Unit tests with a mocked transport
test/integration/            Tests against the live Wave API
docs/                        One page per resource, linked from the README
```

Do not edit the files in `generated/` or `schema/` by hand. Run `npm run schema:update`.

Do not change `eslint.config.mjs`. The `n8n-node lint` strict mode fails when the file is not the default. Check the exit code of `npm run lint`: a strict mode failure does not show a problem count.

### `npm run dev` with npm 12

npm 12 blocks install scripts by default, so the n8n copy that `npm run dev` installs can have no SQLite driver ("SQLite package has not been found installed"). To fix this, approve and rebuild `sqlite3` in the npx cache folder that the error shows (`<npm cache>/_npx/<hash>`):

```
npm install-scripts approve sqlite3
npm rebuild sqlite3
```

## How a resource works

Each resource exports a `ResourceModule` (see `resources/types.ts`):

- `option`: the entry in the Resource dropdown.
- `description`: the node properties of the resource. The first entry must be the `operation` property.
- `operations`: a map from operation value to a handler. A handler gets `{ itemIndex }` and returns an object, a list of objects, or execution data. The node adds `pairedItem`.

Add the module to `resources/index.ts` in alphabetical order of its option name. Keep Reference Data last.

Use `resources/business/index.ts` as the example to copy.

## Rules

### Requests

- Send all requests with `waveRequest` (queries), `waveMutation` (mutations) or `waveGetAll` (paged lists) from `transport`. Do not call `httpRequest` directly.
- Always pass `{ itemIndex }` so that errors show the correct item.
- Send values as GraphQL variables, never by putting them into the query text.
- A mutation must select `didSucceed` and `inputErrors { code message path }`. `waveMutation` turns `inputErrors` into a node error.
- Check each query and mutation against `schema/wave.graphql`. Use the generated types in `generated/schema.ts` for input objects when this helps.

### Fields and UX

- Use `showFor(RESOURCE, [operations])` for `displayOptions`.
- Use `businessLocator(...)` for the business. Read it with `getBusinessId.call(this, itemIndex)`.
- Use `resourceLocator({...})` for every reference to another Wave record (customer, product, account, sales tax, invoice, estimate, vendor). Use the matching search method in `methods/listSearch.ts`. Add a search method if it does not exist.
- For accounts, pick the search method that fits the field: `searchExpenseAccounts`, `searchIncomeAccounts`, `searchPaymentAccounts` or `searchAccounts`.
- Read a locator with `getResourceId.call(this, name, itemIndex, type?)`. Give `type` for invoices, estimates, customers and checkouts, so that raw webhook IDs also work.
- Inside a collection or fixed collection, read a locator value with `getLocatorValue(value)`.
- Use `currencyField()`, `addressFields` (in a collection named `address`) and `enumOptions('EnumName')` for dropdowns. Do not type lists of enum values by hand.
- Put required fields at the top level. Put optional fields in an `Additional Fields` collection (create) or an `Update Fields` collection (update).
- Get Many operations use `paginationFields(...)` and a `Filters` collection.
- Remove empty optional values with `compactInput` before you send them. On a patch, Wave clears a field when it gets `null`, so do not send `null` unless the user asks for it.
- Follow the n8n UX guidelines: title case for display names, sentence case for descriptions and actions, `action` text on each operation.

### Output

- Return the Wave objects as Wave sends them. Do not rename fields.
- Delete and archive operations return `{ success: true, id }` (plus the archived record when Wave returns one).

### Simplify

The **Simplify** option lets users write Wave records to a spreadsheet or a table without a Code node. It is a boolean with the default `false`, so the default output stays the Wave object. The operations Get and Get Many of every resource that returns records have it. The Wave Trigger has it in **Options**.

- `simplifyField(RESOURCE, operations)` in `shared/descriptions.ts` makes the parameter. `Wave.node.ts` applies `simplifyRecord` to the output of Get and Get Many when the parameter is on. A handler does not read the parameter.
- `simplifyRecord` in `shared/simplify.ts` is the only place that decides how a value changes. It works on any depth.
- Money (`value` and `currency`) becomes a number. A `currency` code is added next to it when the record has no `currency` field.
- A currency, province or country becomes its code. An object with `name` and `value` (for example an account type) becomes its `value`.
- An address stays an object with simple values. `addressText` has the address in one line.
- A nested record with an `id` becomes `<key>Id` and `<key>Name`. The shipping details of a customer or vendor become `shipping...` fields.
- A nested `business` object, `minorUnitValue`, `classicId` and `__typename` are removed.
- A string becomes a number only when its field is in `DECIMAL_FIELDS`. These are the fields that `schema/wave.graphql` types as `Decimal`. Add a field to the list when you select a new Decimal field. Do not add IDs, numbers that are labels, postal codes or phone numbers.
- Lists are simplified element by element. Enums, dates and date-times stay strings.

### Tests

- Add unit tests for helpers with logic (input builders, mapping) in `test/unit`.
- Add an integration test file `test/integration/<resource>.test.ts`. Each test creates the records it needs, runs the operation, checks the result and removes what it made in `afterAll` or `afterEach` with `Cleanup`.
- Name every record that a test makes with `uniqueName(...)`, so that leftovers start with `n8n-test`.
- When Wave cannot delete a record (accounts, products, sales taxes, transactions), archive it if possible.
- Use `describe.skipIf(!hasConfig)` so that the tests skip when `.env` is not there.

### Docs

- Add `docs/<resource>.md` with a short description of the resource and a table of its operations and fields.
- Add the link in the README node table.
- Use Simplified Technical English: short sentences, active voice, no em dashes.

### Before you open a pull request

Run `npm run lint`, `npm run build`, `npm test` and `npm run test:integration`. All must pass.
