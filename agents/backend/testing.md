# Backend: tests

## Rules
- Tests live under `backend/test/`, never next to the source.
- Database tests boot through `startTestApp()` (in-memory mongod, or `{ store: 'memory' }`); never use `MONGODB_URI`'s database.
- Time moves only through `FakeClock`; never sleep.

## File structure

```
backend/test/fixtures/market/frankfurter-not-found.json : recorded Frankfurter 404 body (unknown symbol)
backend/test/fixtures/market/frankfurter-range.json : recorded Frankfurter v1 range 2025-01-03..07, EUR base, every quote currency
backend/test/fixtures/market/marketstack-eod-page-1.json : Marketstack v2 /eod page 1 of 2 (documented shape, trimmed)
backend/test/fixtures/market/marketstack-eod-page-2.json : Marketstack v2 /eod page 2 of 2; one row without adj_close
backend/test/fixtures/market/marketstack-error-invalid-key.json : recorded Marketstack error body (invalid_access_key)
backend/test/fixtures/market/marketstack-error-usage-limit.json : Marketstack error body (usage_limit_reached)
backend/test/integration/auth/auth-flow.memory.test.ts : runs the auth-flow suite on the memory store
backend/test/integration/auth/auth-flow.suite.ts : signup, login, me, refresh, reuse detection, logout
backend/test/integration/auth/auth-flow.test.ts : runs the auth-flow suite on mongod
backend/test/integration/auth/refresh-race.test.ts : concurrent refreshes; exactly one wins
backend/test/integration/core/processed-events.test.ts : first vs duplicate marks, concurrent marks; mongo and memory
backend/test/integration/core/request-budget.test.ts : limit, oversize refusal, UTC month rollover, concurrent reserves; mongo and memory
backend/test/integration/market/market-routes.memory.test.ts : runs the market-routes suite on the memory store
backend/test/integration/market/market-routes.suite.ts : quotes, fx (query validation, weekend lookup), refresh (cron auth, backfill, re-run) over fixture providers
backend/test/integration/market/market-routes.test.ts : runs the market-routes suite on mongod
backend/test/support/auth-fixtures.ts : shared session/token fixtures
backend/test/support/fake-clock.ts : clock moved by hand
backend/test/support/market-fixtures.ts : fixture loader, fixture-backed http client, rate and price builders
backend/test/support/test-app.ts : boots the real app on a throwaway mongod or the memory store; fake clock, env, outbound http (offline by default)
backend/test/unit/auth/refresh-rotation.policy.test.ts : every rotation decision
backend/test/unit/auth/session.entity.test.ts : session and email invariants
backend/test/unit/auth/validation.test.ts : email and password rules shared with the contracts
backend/test/unit/core/db/classify-db-error.test.ts : duplicate-key, transient, fatal
backend/test/unit/core/db/data-store.test.ts : store resolution and health without a database
backend/test/unit/core/db/with-read-retry.test.ts : retries transient failures only, up to the policy
backend/test/unit/core/error-catalog.test.ts : code → status mapping, prefix and duplicate checks
backend/test/unit/core/http-client/http-client.test.ts : status, network, timeout and body failures → transient or fatal; no query string in messages
backend/test/unit/core/require-bearer-secret.test.ts : exact bearer passes; wrong, missing, or unset secret → rejected
backend/test/unit/core/route-builder.test.ts : response contract check returns 500 on violation; query contract parses or 400s
backend/test/unit/market/convert.test.ts : convertBatch table: spot, historical, weekend gap, inverse, cross, raw, same currency, missing rate, half to even
backend/test/unit/market/providers.test.ts : Marketstack and Frankfurter adapters vs fixtures: pagination, budget per page, key handling, error mapping
backend/test/unit/market/refresh.test.ts : refresh with fake sources: backfill, incremental range, re-run, quota and provider failures write nothing, one event per refresh; quotes and rates
backend/test/unit/scripts/module-deps.test.ts : edge parsing, allowed/non-public/off-graph imports on a fixture tree, core importing a module, cycle detection
```
