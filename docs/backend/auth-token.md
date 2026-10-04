# Auth tokens

Email signup/login with cochika-auth's token model, on Hono + MongoDB.

## Token model
| | Rule |
|---|---|
| Access | EdDSA (Ed25519) JWT; lifetime `AUTH_ACCESS_TOKEN_TTL_SECONDS`. Claims: `iss aud sub iat exp jti token_use roles`; header `kid` |
| Refresh | 32 random bytes, opaque, base64url; only the SHA-256 hex is stored; lifetime `AUTH_REFRESH_TOKEN_TTL_SECONDS`, restarted on every rotation |
| Family | login starts a family; every rotation's child keeps the parent's `familyId` |
| Passwords | scrypt N=2^17 r=8 p=1 (node:crypto; no native addon); parameters stored in each hash |

Defaults: `docs/infra/env.md`.

## Rotation
| Presented refresh token | Outcome |
|---|---|
| active | old session → `ROTATED`; child session created; new token pair |
| rotated within `AUTH_REFRESH_REUSE_GRACE_SECONDS` | `AU_1004`; family kept (client retry) |
| rotated longer ago | whole family revoked (`REUSE_DETECTED`); `AU_1003` |
| unknown, expired, revoked, missing, or user not active | `AU_1003` |
| loser of a concurrent rotation | `AU_1004`; compare-and-set picks exactly one winner |

## Delivery
| `clientType` | Refresh token |
|---|---|
| `WEB` | `refresh_token` cookie: HttpOnly, Secure, SameSite=Lax, Path=/api/auth; `Expires` = session expiry only when `rememberMe`, otherwise a browser-session cookie. Body omits `refreshToken` |
| `IOS`, `ANDROID` | body `refreshToken` |

- refresh and logout read the cookie before the body `refreshToken`.
- logout and logout-all always clear the cookie.
- The server-side session lives the full refresh lifetime whether or not `rememberMe` is set.

## Not in scope yet
Email verification, OAuth, password reset, rate limiting, JWKS, introspection, login audit.
