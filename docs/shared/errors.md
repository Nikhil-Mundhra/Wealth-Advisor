# Errors

Every non-2xx API body is `ErrorResponse` (`contracts/src/common/error.contract.ts`): `code`, `message` (developer text, not UI copy), optional `issues[]` of `{ path, code }` where `code` is a validation key (`rules/src/validation-keys.ts`).

## Prefixes
| Prefix | Owner | Codes defined in | Statuses defined in |
|---|---|---|---|
| `CORE_` | backend core | `rules/src/error-codes.ts` (`CORE_ERROR_CODES`) | thrown with the status at the HTTP edge (`AppError`) |
| `AU_` | auth module | `rules/src/error-codes.ts` (`AUTH_ERROR_CODES`) | `backend/src/modules/auth/presentation/auth-error-statuses.ts` |

- Module prefixes are listed in `ERROR_CODE_PREFIXES` (`rules/src/error-codes.ts`); each module registers its prefix and statuses in its manifest's `errors`, collected into the error catalog at startup (`backend/src/core/errors/error-catalog.ts`).
- A module code outside its prefix, or registered twice, stops the app at startup; an unregistered code is answered as 500.
- Client-only codes, never sent by the server: `NETWORK_ERROR`, `CONTRACT_MISMATCH` (`frontend/src/lib/api-error.ts`).

## Number bands
| Band | Meaning |
|---|---|
| `<PREFIX>_1001`–`<PREFIX>_1899` | client error |
| `<PREFIX>_1900`–`<PREFIX>_1999` | server error |

Codes are part of the API: never reused or renumbered.

## Catalogue
| Code | Status | Meaning |
|---|---|---|
| `CORE_INVALID_JSON` | 400 | request body is not valid JSON |
| `CORE_VALIDATION_FAILED` | 400 | body fails its contract; `issues` lists every failed field |
| `CORE_NOT_FOUND` | 404 | unmatched `/api/*` path or method |
| `CORE_INTERNAL` | 500 | unhandled error or response-contract violation; details logged, not sent |
| `CORE_DB_UNCONFIGURED` | 503 | `MONGODB_URI` is not set |
| `AU_1001` | 409 | an account with this email already exists |
| `AU_1002` | 401 | invalid email or password |
| `AU_1003` | 401 | refresh token invalid, expired, revoked or reused after the grace window |
| `AU_1004` | 409 | refresh token already rotated; use the latest token |
| `AU_1005` | 401 | missing or invalid access token |
| `AU_1006` | 400 | email address is invalid |
| `AU_1007` | 400 | password does not meet the password policy |
| `AU_1900` | 500 | auth invariant violated |
| `AU_1901` | 503 | token signing keys are not configured |
