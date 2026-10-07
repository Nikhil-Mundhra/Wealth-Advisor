# Errors

Every non-2xx API body is `ErrorResponse` (`contracts/src/common/error.contract.ts`): `code`, `message` (developer text, not UI copy), optional `issues[]` of `{ path, code }` where `code` is a validation key (`rules/src/validation-keys.ts`).

## Prefixes
| Prefix | Owner | Codes defined in | Statuses defined in |
|---|---|---|---|
| `CORE_` | backend core | `rules/src/error-codes.ts` (`CORE_ERROR_CODES`) | thrown with the status at the HTTP edge (`AppError`) |
| `AU_` | auth module | `rules/src/error-codes.ts` (`AUTH_ERROR_CODES`) | `backend/src/modules/auth/presentation/auth-error-statuses.ts` |
| `MK_` | market module | `rules/src/error-codes.ts` (`MARKET_ERROR_CODES`) | `backend/src/modules/market/presentation/market-error-statuses.ts` |
| `AN_` | analytics module | `rules/src/error-codes.ts` (`ANALYTICS_ERROR_CODES`) | `backend/src/modules/analytics/presentation/analytics-error-statuses.ts` |
| `AD_` | admin module | `rules/src/error-codes.ts` (`ADMIN_ERROR_CODES`) | `backend/src/modules/admin/presentation/admin-error-statuses.ts` |
| `FN_` | finance module | `rules/src/error-codes.ts` (`FINANCE_ERROR_CODES`) | `backend/src/modules/finance/presentation/finance-error-statuses.ts` |
| `WL_` | wealth module | `rules/src/error-codes.ts` (`WEALTH_ERROR_CODES`) | `backend/src/modules/wealth/presentation/wealth-error-statuses.ts` |
| `AV_` | advisory module | `rules/src/error-codes.ts` (`ADVISORY_ERROR_CODES`) | `backend/src/modules/advisory/presentation/advisory-error-statuses.ts` |
| `SH_` | sharing module | `rules/src/error-codes.ts` (`SHARING_ERROR_CODES`) | `backend/src/modules/sharing/presentation/sharing-error-statuses.ts` |

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
| `AU_1008` | 401 | passkey verification failed |
| `AU_1900` | 500 | auth invariant violated |
| `AU_1901` | 503 | token signing keys are not configured |
| `MK_1001` | 401 | cron secret missing or wrong |
| `MK_1900` | 500 | market invariant violated (stored or computed market data breaks a rule) |
| `MK_1901` | 502 | market data provider unavailable, answered an error, or sent data that breaks a market invariant |
| `MK_1902` | 503 | market data provider's monthly request quota is spent |
| `MK_1903` | 503 | market data provider is not configured (missing access key) |
| `AN_1001` | 404 | no market snapshot computed yet, or none for the asked `asOf` |
| `AN_1900` | 500 | analytics invariant violated (a computed or stored snapshot breaks a rule) |
| `AD_1001` | 404 | no tenant with the given `tenantId` |
| `AD_1002` | 404 | no API key with the given id, or (`mongo` store) the key is already revoked |
| `AD_1003` | 409 | a tenant with this `slug` already exists |
| `AD_1004` | 403 | admin role required |
| `AD_1005` | 400 | LLM provider not in `LLM_PROVIDERS` |
| `AD_1900` | 500 | admin invariant violated |
| `FN_1001` | 404 | account not found |
| `FN_1002` | 400 | currency not supported |
| `FN_1900` | 500 | finance invariant violated (a write's tenant or user scope id is unusable) |
| `WL_1001` | 404 | no portfolio for the caller's scope |
| `WL_1002` | 404 | asset product not found |
| `WL_1003` | 401 | trade request carries no passkey `signature` or `credentialId` |
| `WL_1004` | 403 | passkey assertion invalid |
| `WL_1005` | 403 | a trade's asset is not held, or its `targetWeight` differs from the stored target weight by more than 0.001 |
| `WL_1900` | 500 | wealth invariant violated (a ledger write's tenant or user scope id is unusable) |
| `AV_1001` | 503 | LLM gateway unavailable |
| `AV_1002` | 400 | unsupported model |
| `AV_1900` | 500 | advisory invariant violated |
| `SH_1001` | 404 | no shared plan for the token |
| `SH_1002` | 410 | shared plan expired |
| `SH_1900` | 500 | sharing invariant violated (a write's tenant or user scope id is unusable) |

- Defined with a status but thrown by no code path: `AU_1008`, `AD_1004`, `AD_1900`, `FN_1001`, `FN_1002`, `WL_1002`, `WL_1004`, `AV_1001`, `AV_1002`, `AV_1900`.
