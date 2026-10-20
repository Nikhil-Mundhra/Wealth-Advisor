# Request flow

How one inbound request is processed from the edge to the response, and how the cron-triggered market refresh runs end to end. Module mounting: `backend/docs/module-contract.md`. Error catalogue: `rules/docs/errors.md`.

## Inbound request
1. edge: `infra/docs/routing.md` sends `/api/*` to the backend; every other path to the frontend.
2. app middleware (`backend/src/app.ts`): request logger, then `secureHeaders` (CSP, `X-Frame-Options: DENY`, nosniff, referrer policy) on every path, then CORS on `/api/*`.
3. route order under `/api`: `/health`, `/ai`, each module at its `basePath`, then the `/api/*` 404 fallback; an unmatched API path answers the error contract and never falls through to the SPA.
4. route middleware runs before the handler: the auth guard sets the principal and scopes every later query to it, `requireAdminRole` refuses a principal without the ADMIN role, `requireBearerSecret` compares a machine caller's bearer in constant time.
5. handler pipeline (`backend/src/core/http/route-builder.ts`): query contract, body, handler, response contract, in that order.

| Step | Behaviour |
|---|---|
| query | values arrive as strings; a repeated key keeps its first value |
| body | over 1MB → 413 `CORE_PAYLOAD_TOO_LARGE`; empty body reads as `{}`; unparseable JSON → 400 `CORE_INVALID_JSON` |
| query or body contract failure | one 400 `CORE_VALIDATION_FAILED` carrying every failed field as `{ path, code }`, the code being a validation key (`rules/src/validation-keys.ts`) |
| response contract failure | logged server-side, answered 500 `CORE_INTERNAL`; the issues never reach the client |
| route without `responds()` | 204 |

## Failure processing
The error handler (`backend/src/core/http/error-handler.ts`) is installed on the app and on each module router; every thrown error becomes the error contract (`rules/docs/errors.md`).

| Thrown | Response |
|---|---|
| `AppError` | its own status and code, with `issues[]` when present |
| `DomainError` | status from the error catalog built from the manifests' `errors` prefixes; a 5xx is additionally logged |
| `HTTPException` | the exception's own response |
| anything else | logged as unhandled, answered 500 `CORE_INTERNAL` with a generic message |

## Cron refresh chain
`vercel.json` cron (`0 23 * * 1-5`) → `GET /api/market/refresh` (`contracts/docs/apis/market.md`).

1. `requireBearerSecret`: the bearer must equal `CRON_SECRET` in constant time; an unset secret refuses every call; a missing or different secret → 401 `MK_1001`.
2. range: from the oldest last-stored day, one year back when anything is missing, to today (`backend/src/modules/market/application/refresh-range.ts`).
3. fetch: FX rates first, then end-of-day prices; one `RequestBudget` reservation per Marketstack page; both fetches finish before any write, a provider failure stores nothing.
4. write: both appends are idempotent upserts, keyed by (symbol, date) and (base, quote, date); a re-run stores nothing new.
5. publish: one `market.data_refreshed` v1 per refresh, `asOf` being the latest stored price day (`backend/docs/events.md`).
6. handle: the in-process bus runs `analytics.snapshot` inside the same request — window, align, returns, covariance, upsert `market_snapshots` by `asOf`, then mark the event id; a failing handler is logged and never redelivered, and the next publish recomputes it.
