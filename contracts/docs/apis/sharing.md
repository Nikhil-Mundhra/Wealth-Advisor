# Sharing APIs

## POST /api/sharing/create
- responsibility: store a shared plan under the caller's scope and return its token `dewa_sec_<random>` and path `/share/<token>`; `expiresAt` is now + `ttlHours`; the plan snapshot is the caller's rebalance proposal (`POST /api/wealth/optimize`) at creation: current and target weights and the three-pillar rationale; `stressTestScenario` is null; `ownerDisplayName` is the request's, else `DEWA client`; `privacyMasked` is stored and echoed, nothing is redacted
- contract: request `CreateShareLinkRequest`, response `CreateShareLinkResponse` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `WL_1001`, `CORE_DB_UNCONFIGURED`; auth required Bearer (`backend/docs/auth-token.md` `requireAuth`): no token or an invalid token → `AU_1005`

## GET /api/sharing/:token
- responsibility: return the shared plan stored under `token`
- contract: request none, response `SharedPlanResponse` 200, errors `SH_1001`, `SH_1002`, `CORE_DB_UNCONFIGURED`; auth none
- nested route / query: `:token` the plan's `shareToken`; unknown → `SH_1001`; past `expiresAt` → `SH_1002`
