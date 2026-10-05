# Backend: error codes

## Calls
- `docs/shared/errors.md` : prefixes, number bands, code → status → meaning

## Rules
- Domain code throws through a factory in `<module>/domain/errors/<module>-errors.ts`, never `new DomainError` directly, and never knows HTTP statuses.
- `AppError` is only for failures at the HTTP edge (bad JSON, failed contract, missing database).

## Workflow
- new code: `rules/src/error-codes.ts` → factory → `<module>/presentation/<module>-error-statuses.ts` → `docs/shared/errors.md` → route docs → frontend error map if user-facing
- new module: prefix in `ERROR_CODE_PREFIXES` → manifest `errors: { prefix, statuses }`

## File structure

```
backend/src/modules/analytics/domain/errors/analytics-errors.ts : AN_* DomainError factories
backend/src/modules/analytics/presentation/analytics-error-statuses.ts : HTTP status for every AN_* code
backend/src/modules/auth/domain/errors/auth-errors.ts : AU_* DomainError factories
backend/src/modules/auth/presentation/auth-error-statuses.ts : HTTP status for every AU_* code
backend/src/modules/market/domain/errors/market-errors.ts : MK_* DomainError factories
backend/src/modules/market/presentation/market-error-statuses.ts : HTTP status for every MK_* code
```
