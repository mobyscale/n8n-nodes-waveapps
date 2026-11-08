# Wave API version

This page records the version of the Wave API that this package was built and tested against. Use it to find what changed when Wave changes the API.

## Why there is no version number

Wave has one public GraphQL endpoint, `https://gql.waveapps.com/graphql/public`. The endpoint has no version in the URL, and the responses have no version header. Wave changes the schema in place and marks old fields with `@deprecated`.

Thus this package records a **schema snapshot** instead of a version number. The snapshot is `schema/wave.graphql`. It is in git, so `git log -- schema/wave.graphql` shows each time that the schema changed.

## Baseline

| Item | Value |
|---|---|
| Package version | 0.1.0 |
| Endpoint | `https://gql.waveapps.com/graphql/public` |
| Schema snapshot date | 2026-11-08 |
| Schema file | `schema/wave.graphql` (6409 lines) |
| Schema SHA-256 | `74c8e40146a62c35fdb105319c9d0e972e37acfb05dea882e0e766e601506150` |
| Root query fields | 11: `oAuthApplication`, `currencies`, `currency`, `countries`, `country`, `province`, `businesses`, `business`, `user`, `accountTypes`, `accountSubtypes` |
| Mutations | 42 |
| Types | 105 object types, 61 input types, 34 enums |
| Fields marked `@deprecated` | 14 |
| Test account plan | Wave Starter, one business |

The SHA-256 is of the file with LF line endings. `npm run schema:update` shows the SHA-256 of the new file.

## Behavior that the schema does not show

The integration tests found these rules on 2026-11-08. A change in one of them can break an operation without a change in the schema.

- Wave sends errors with HTTP status 200. An expired token gives the error code `UNAUTHENTICATED`, not HTTP 401.
- A mutation sends `didSucceed` and `inputErrors`. The node turns `inputErrors` into an error.
- `estimatePatch` sets the fields that you do not send back to their default values. Estimate Update thus sends the current values again.
- A transaction with an External ID that exists already is rejected with "same externalId already exists".
- A batch of transactions (`moneyTransactionsCreate`) succeeds or fails as one unit.
- `productCreate` needs an income account or an expense account.
- A sales tax rate is a history. A rate change adds a rate with an effective date.
- Mark Sent needs an approved invoice or estimate and a `sendMethod`.
- Send and Send Receipt need email sending on the business. The Starter plan cannot send email, so Wave sends `FORBIDDEN`.
- Estimate deposits need a Wave entitlement that the Starter plan does not have.
- The ID of an account has the business last (`Account:{id};Business:{uuid}`). The IDs of invoices, estimates, customers and checkouts have the business first.

## How to compare with a new Wave schema

1. Run `npm run schema:update`. It downloads the schema, writes `schema/wave.graphql` and `nodes/Wave/generated/enums.ts`, and generates the types again.
2. Run `git diff schema/wave.graphql` to see what Wave changed. Look for removed fields, new required arguments, new enum values and new `@deprecated` marks.
3. Run `npm run build`. A type error shows code that uses a field or an input that changed.
4. Run `npm test` and `npm run test:integration`. The integration tests also check the behavior in the list above.
5. Update the baseline table on this page and add a line to `CHANGELOG.md`.
