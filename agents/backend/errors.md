# Backend: error codes

## Calls
- `docs/shared/errors.md` : prefixes, number bands, code → status → meaning
- `agents/frontend/forms.md` : user-facing text for a code

## Rules
- Domain code throws `DomainError(code, message)` from the module's errors object and never knows HTTP statuses.
- `AppError(status, code, message)` is only for failures at the HTTP edge (bad JSON, failed contract, missing database); an unknown error reaches the client as `CORE_INTERNAL`.
- Codes live in `rules/src/error-codes.ts`; a module's statuses live in `<module>/presentation/<module>-error-statuses.ts`, typed as a full record so a code without a status fails typecheck.
- Codes are part of the API: never reuse or renumber one.

## Workflow
- add an error code: code in `rules/src/error-codes.ts` with the next free number in its band → factory in `<module>/domain/errors/<module>-errors.ts` → status in `<module>/presentation/<module>-error-statuses.ts` → row in `docs/shared/errors.md` → the route docs list the id → user-facing text in the frontend error map
- errors for a new module: prefix in `ERROR_CODE_PREFIXES` and a codes object in `rules/src/error-codes.ts` → statuses file → manifest `errors: { prefix, statuses }` → prefix row in `docs/shared/errors.md`

## File structure

```
backend/src/modules/auth/domain/errors/auth-errors.ts : AU_* DomainError factories
backend/src/modules/auth/presentation/auth-error-statuses.ts : HTTP status for every AU_* code
```
