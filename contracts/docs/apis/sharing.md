# Sharing APIs

## POST /api/sharing/create
- responsibility: store a shared plan under the demo account and return its token `dewa_sec_<random>` and path `/share/<token>`; `expiresAt` is now + `ttlHours`; the plan snapshot and `ownerDisplayName` are fixed values, not read from the caller's portfolio
- contract: request `CreateShareLinkRequest`, response `CreateShareLinkResponse` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `CORE_DB_UNCONFIGURED`; auth none

## GET /api/sharing/:token
- responsibility: return the shared plan stored under `token`
- contract: request none, response `SharedPlanResponse` 200, errors `SH_1001`, `SH_1002`, `CORE_DB_UNCONFIGURED`; auth none
- nested route / query: `:token` the plan's `shareToken`; unknown → `SH_1001`; past `expiresAt` → `SH_1002`
