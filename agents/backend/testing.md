# Backend: tests

## Rules
- Tests live under `backend/test/`, never next to the source.
- Database tests boot an in-memory mongod through `startTestApp()`; never use `MONGODB_URI`'s database.
- Time moves only through `FakeClock`; never sleep.

## File structure

```
backend/test/integration/auth/auth-flow.test.ts : signup, login, me, refresh, reuse detection, logout
backend/test/integration/auth/refresh-race.test.ts : concurrent refreshes; exactly one wins
backend/test/support/auth-fixtures.ts : shared session/token fixtures
backend/test/support/fake-clock.ts : clock moved by hand
backend/test/support/test-app.ts : boots the real app against a throwaway mongod
backend/test/unit/auth/document-validators.test.ts : DB validators require and type exactly the fields the mappers write
backend/test/unit/auth/refresh-rotation.policy.test.ts : every rotation decision
backend/test/unit/auth/session.entity.test.ts : session and email invariants
backend/test/unit/auth/validation.test.ts : email and password rules shared with the contracts
backend/test/unit/core/error-catalog.test.ts : code → status mapping, prefix and duplicate checks
backend/test/unit/core/route-builder.test.ts : response contract check returns 500 on violation
```
