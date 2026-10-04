# Auth APIs

## POST /api/auth/signup
- nested route / query: none
- responsibility: create an email account; issues no tokens
- contract: request `SignupRequest`, response `SignupResponse` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1006`, `AU_1007`, `AU_1001`, `CORE_DB_UNCONFIGURED`; auth none

## POST /api/auth/login
- nested route / query: none
- responsibility: verify email and password and issue a token pair
- contract: request `LoginRequest`, response `TokenPairResponse` 200, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1002`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth none; delivery by `clientType`: WEB refresh cookie (`docs/backend/auth-token.md`), IOS/ANDROID body `refreshToken`

## POST /api/auth/refresh
- nested route / query: none
- responsibility: rotate the refresh token and issue a new token pair
- contract: request `RefreshRequest`, response `TokenPairResponse` 200, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1003`, `AU_1004`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth refresh token: cookie wins over body `refreshToken`; a malformed cookie means no token; no token → `AU_1003`; delivery as login

## POST /api/auth/logout
- nested route / query: none
- responsibility: revoke the current session; idempotent
- contract: request `LogoutRequest`, response none 204, errors `AU_1005`, `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer (checked before the body); refresh token: cookie wins over body `refreshToken`; a malformed cookie means no token; no token → no revocation; always clears the refresh cookie

## POST /api/auth/logout-all
- nested route / query: none
- responsibility: revoke every session of the caller
- contract: request none, response none 204, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer; always clears the refresh cookie

## GET /api/auth/me
- nested route / query: none
- responsibility: return the caller's account
- contract: request none, response `MeResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer
