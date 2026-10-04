# Frontend: API calls and server state

## Calls
- `docs/shared/apis/index.md` : before calling an endpoint (contract, error ids)
- `docs/frontend/session-flow.md` : how a 401 is refreshed and retried

## Rules
- Every call goes through `lib/api-client.ts`; responses are parsed with their contract. Known exception: `home-page.tsx` placeholder fetches `/api/health` and `/api/ai` directly.
- Endpoint calls live in `features/<name>/api/<name>-api.ts`; components use the query and mutation hooks next to it, never the calls.
- Server state lives in TanStack Query hooks under `features/<name>/api`.
- `lib/` never imports `features/`; auth plugs into the client through `setAuthHandlers`.

## Workflow
- call a new endpoint: contract → `features/<name>/api/<name>-api.ts` → query or mutation hook `use-<action>.ts` → map line

## File structure

```
frontend/src/features/auth/api/auth-api.ts : auth endpoint calls typed by contracts
frontend/src/features/auth/api/use-login.ts : login mutation
frontend/src/features/auth/api/use-logout.ts : logout mutation; always ends the local session
frontend/src/features/auth/api/use-me.ts : current-user query
frontend/src/features/auth/api/use-signup.ts : signup mutation, then login with the same credentials
frontend/src/lib/api-client.ts : fetch wrapper: /api base, contract-validated responses, bearer token, one retry after refresh
frontend/src/lib/api-error.ts : ApiError built from the error contract, with field issues; client-only error codes
frontend/src/lib/query-client.ts : TanStack Query client defaults
```
