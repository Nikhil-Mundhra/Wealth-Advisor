# Auth APIs

## POST /api/auth/signup
- nested route / query: none
- responsibility: create an email account; issues no tokens
- contract: request `SignupRequest`, response `SignupResponse` 201, errors `CORE_INVALID_JSON 400`, `CORE_VALIDATION_FAILED 400`, `AU_1006 400`, `AU_1001 409`, `CORE_DB_UNCONFIGURED 503`; auth none

## POST /api/auth/login
- nested route / query: none
- responsibility: verify email and password and issue a token pair
- contract: request `LoginRequest`, response `TokenPairResponse` 200, errors `CORE_INVALID_JSON 400`, `CORE_VALIDATION_FAILED 400`, `AU_1002 401`, `AU_1901 503`, `CORE_DB_UNCONFIGURED 503`; auth none; `clientType` WEB sets `refresh_token` cookie (HttpOnly, Secure, SameSite=Lax, Path=/api/auth; Expires only when `rememberMe`) and omits `refreshToken` from the body, IOS/ANDROID return `refreshToken` in the body

## POST /api/auth/refresh
- nested route / query: none
- responsibility: rotate the refresh token and issue a new token pair
- contract: request `RefreshRequest`, response `TokenPairResponse` 200, errors `CORE_INVALID_JSON 400`, `CORE_VALIDATION_FAILED 400`, `AU_1003 401`, `AU_1004 409`, `AU_1901 503`, `CORE_DB_UNCONFIGURED 503`; auth refresh token, `refresh_token` cookie read before body `refreshToken`, neither present → `AU_1003 401`; WEB re-sets the cookie, IOS/ANDROID return `refreshToken` in the body

## POST /api/auth/logout
- nested route / query: none
- responsibility: revoke the current session; idempotent
- contract: request `LogoutRequest`, response none 204, errors `AU_1005 401`, `CORE_INVALID_JSON 400`, `CORE_VALIDATION_FAILED 400`, `AU_1901 503`, `CORE_DB_UNCONFIGURED 503`; auth Bearer (checked before the body); refresh token from `refresh_token` cookie, else body `refreshToken`, absent → no revocation; always clears the `refresh_token` cookie (Path=/api/auth)

## POST /api/auth/logout-all
- nested route / query: none
- responsibility: revoke every session of the caller
- contract: request none, response none 204, errors `AU_1005 401`, `AU_1901 503`, `CORE_DB_UNCONFIGURED 503`; auth Bearer; always clears the `refresh_token` cookie (Path=/api/auth)

## GET /api/auth/me
- nested route / query: none
- responsibility: return the caller's account
- contract: request none, response `MeResponse` 200, errors `AU_1005 401`, `AU_1901 503`, `CORE_DB_UNCONFIGURED 503`; auth Bearer
