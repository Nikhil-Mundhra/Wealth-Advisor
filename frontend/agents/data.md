# Frontend: API calls and server state

## Calls
- `contracts/docs/apis/index.md` : contract and error ids before calling an endpoint
- `frontend/docs/session-flow.md` : how a 401 is refreshed and retried

## Rules
- Every call goes through `lib/api-client.ts`; components use the hooks in `features/<name>/api`, never the endpoint calls.
- Auth plugs into the client only through `setAuthHandlers`.

## File structure

```
frontend/src/features/admin/api/admin-api.ts : admin endpoint calls for tenants, api keys, and model settings
frontend/src/features/auth/api/auth-api.ts : auth endpoint calls typed by contracts
frontend/src/features/auth/api/use-delete-account.ts : delete-account mutation; ends local session and clears query cache
frontend/src/features/auth/api/use-login.ts : login mutation
frontend/src/features/auth/api/use-logout.ts : logout mutation; always ends the local session
frontend/src/features/auth/api/use-me.ts : current-user query
frontend/src/features/auth/api/use-signup.ts : signup mutation, then login with the same credentials; resolves signed-in, or created if that login fails
frontend/src/lib/api-client.ts : fetch wrapper: /api base, contract-validated responses, bearer token, one retry after refresh
frontend/src/lib/api-error.ts : ApiError built from the error contract, with field issues; client-only error codes
frontend/src/lib/query-client.ts : TanStack Query client defaults
```
