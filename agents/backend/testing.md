# Backend: tests

## Rules
- Tests live under `backend/test/`, never next to the source.
- Database tests boot through `startTestApp()` (in-memory mongod, or `{ store: 'memory' }`); never use `MONGODB_URI`'s database.
- Time moves only through `FakeClock`; never sleep.

## File structure

```
backend/test/integration/auth/auth-flow.memory.test.ts : runs the auth-flow suite on the memory store
backend/test/integration/auth/auth-flow.suite.ts : signup, login, me, refresh, reuse detection, logout
backend/test/integration/auth/auth-flow.test.ts : runs the auth-flow suite on mongod
backend/test/integration/auth/refresh-race.test.ts : concurrent refreshes; exactly one wins
backend/test/integration/core/processed-events.test.ts : first vs duplicate marks, concurrent marks; mongo and memory
backend/test/integration/core/request-budget.test.ts : limit, oversize refusal, UTC month rollover, concurrent reserves; mongo and memory
backend/test/support/auth-fixtures.ts : shared session/token fixtures
backend/test/support/fake-clock.ts : clock moved by hand
backend/test/support/test-app.ts : boots the real app on a throwaway mongod or the memory store
backend/test/unit/auth/refresh-rotation.policy.test.ts : every rotation decision
backend/test/unit/auth/session.entity.test.ts : session and email invariants
backend/test/unit/auth/validation.test.ts : email and password rules shared with the contracts
backend/test/unit/core/db/classify-db-error.test.ts : duplicate-key, transient, fatal
backend/test/unit/core/db/data-store.test.ts : store resolution and health without a database
backend/test/unit/core/db/with-read-retry.test.ts : retries transient failures only, up to the policy
backend/test/unit/core/error-catalog.test.ts : code → status mapping, prefix and duplicate checks
backend/test/unit/core/http-client/http-client.test.ts : status, network, timeout and body failures → transient or fatal; no query string in messages
backend/test/unit/core/route-builder.test.ts : response contract check returns 500 on violation
backend/test/unit/scripts/module-deps.test.ts : edge parsing, allowed/non-public/off-graph imports on a fixture tree, cycle detection
```
