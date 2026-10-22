# Sharing APIs

## POST /api/sharing/create
- responsibility: store a shared plan under the target user's scope and return its token `dewa_sec_<random>` and path `/share/<token>`; `expiresAt` is now + `ttlHours`; the plan snapshot is the target user's rebalance proposal (`POST /api/wealth/optimize`) at creation: current and target weights and the three-pillar rationale; `stressTestScenario` is null; `clientId` optionally selects another user's plan and is accepted only from an advisor or admin caller; `ownerDisplayName` is the request's, else `DEWA client`; `privacyMasked` is stored, and on public read holdings become `Holding N`, ticker symbols are replaced, and currency amounts in the rationale are redacted
- contract: request `CreateShareLinkRequest`, response `CreateShareLinkResponse` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `WL_1001`, `SH_1003`, `CORE_DB_UNCONFIGURED`; auth required Bearer (`backend/docs/auth-token.md` `requireAuth`): no token or an invalid token → `AU_1005`; a non-advisor passing `clientId` → `SH_1003`; an unusable `clientId` → `SH_1003`

## GET /api/sharing/links
- responsibility: return all share links created for the caller or, if the caller is an advisor/admin, for the specified `clientId`
- contract: query `ListSharedPlansQuery`, response `ListSharedPlansResponse` 200, errors `AU_1005`, `SH_1003`, `CORE_DB_UNCONFIGURED`; auth required Bearer

## DELETE /api/sharing/:token
- responsibility: revoke an active share link; only the creator/owner or an assigned advisor/admin may revoke it
- contract: response `RevokeShareLinkResponse` 200, errors `AU_1005`, `SH_1001`, `SH_1003`, `CORE_DB_UNCONFIGURED`; auth required Bearer

## GET /api/sharing/:token
- responsibility: return the shared plan stored under `token`; when `privacyMasked` is true, holdings, ticker symbols, and currency amounts in the rationale are redacted
- contract: request none, response `SharedPlanResponse` 200, errors `SH_1001`, `SH_1002`, `SH_1004`, `CORE_DB_UNCONFIGURED`; auth none
- nested route / query: `:token` the plan's `shareToken`; unknown or revoked → `SH_1001`; past `expiresAt` → `SH_1002`
- rate limiting: up to 60 requests per 60 seconds per IP; exceeding returns `SH_1004` (status 429) with `Retry-After` header
