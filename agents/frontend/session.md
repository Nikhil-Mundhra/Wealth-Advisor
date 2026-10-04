# Frontend: session

## Calls
- `docs/frontend/session-flow.md` : load, call, refresh and logout sequence
- `docs/backend/auth-token.md` : token model and refresh cookie

## Rules
- The access token lives only in memory (`session-store.ts`); never in localStorage or any storage JS can read later.
- Refresh is single-flight: only `refreshSession()` calls the refresh endpoint.
- Components read status through `use-session.ts`; logout always clears the local session and the query cache.

## Workflow
- change session behaviour: `session-store.ts` → `session-provider.tsx` if wiring changes → `docs/frontend/session-flow.md`

## File structure

```
frontend/src/features/auth/session/session-provider.tsx : wires the API client to the session; restores it on load
frontend/src/features/auth/session/session-store.ts : in-memory access token, session status, single-flight refresh
frontend/src/features/auth/session/use-session.ts : session status hook
```
