# Errors

Every non-2xx API body is `ErrorResponse` (`contracts/src/common/error.contract.ts`): `code`, `message` (developer text, not UI copy), optional `issues[]` of `{ path, code }` where `code` is a validation key (`rules/src/validation-keys.ts`).

## Prefixes
| Prefix | Owner | Codes defined in | Statuses defined in |
|---|---|---|---|
| `CORE_` | backend core | `rules/src/error-codes.ts` (`CORE_ERROR_CODES`) | thrown with the status at the HTTP edge (`AppError`) |
| `AU_` | auth module | `rules/src/error-codes.ts` (`AUTH_ERROR_CODES`) | `backend/src/modules/auth/presentation/auth-error-statuses.ts` |
| `MK_` | market module | `rules/src/error-codes.ts` (`MARKET_ERROR_CODES`) | `backend/src/modules/market/presentation/market-error-statuses.ts` |
| `AN_` | analytics module | `rules/src/error-codes.ts` (`ANALYTICS_ERROR_CODES`) | the analytics module's manifest `errors` (module not built yet) |

- Module prefixes are listed in `ERROR_CODE_PREFIXES` (`rules/src/error-codes.ts`); each module registers its prefix and statuses in its manifest's `errors`, collected into the error catalog at startup (`backend/src/core/errors/error-catalog.ts`).
- A module code outside its prefix, or registered twice, stops the app at startup; an unregistered code is answered as 500.
- Client-only codes, never sent by the server: `NETWORK_ERROR`, `CONTRACT_MISMATCH` (`frontend/src/lib/api-error.ts`).

## Number bands
| Band | Meaning |
|---|---|
| `<PREFIX>_1001`–`<PREFIX>_1899` | client error |
| `<PREFIX>_1900`–`<PREFIX>_1999` | server error |

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
| `MK_1001` | 401 | cron secret missing or wrong |
| `MK_1900` | 500 | market invariant violated (stored or computed market data breaks a rule) |
| `MK_1901` | 502 | market data provider unavailable, answered an error, or sent data that breaks a market invariant |
| `MK_1902` | 503 | market data provider's monthly request quota is spent |
| `MK_1903` | 503 | market data provider is not configured (missing access key) |
| `AN_1001` | 404 | no market snapshot computed yet |
