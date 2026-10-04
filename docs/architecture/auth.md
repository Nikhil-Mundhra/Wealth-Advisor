# Auth module

Email signup/login with cochika-auth's token model, on Hono + MongoDB Atlas.

## Token model
| | Rule |
|---|---|
| Access | EdDSA (Ed25519) JWT, 15 min. Claims: `iss aud sub iat exp jti token_use roles` |
| Refresh | 32 random bytes, opaque; only SHA-256 hex is stored; 14 days, expiry slides on rotation |
| Rotation | Old session → `ROTATED`, child keeps `familyId`. Reuse ≤5 s → 409 `AU_1004`; >5 s → family revoked, 401 `AU_1003` |
| Delivery | WEB: `refresh_token` cookie (HttpOnly, Secure, Lax, `Path=/api/auth`). Mobile: response body |
| Passwords | scrypt N=2^17 r=8 p=1 (node:crypto; no native addon) |

## Endpoints (`/api/auth`)
`POST /signup` · `POST /login` · `POST /refresh` · `POST /logout` (auth) · `POST /logout-all` (auth) · `GET /me` (auth)

## Collections
- `users`: account root; embeds `providers[]`, `roles[]`, `consents[]`, `withdrawal`. Unique partial index on active `(providers.type, providers.subject)`.
- `sessions`: one per refresh token. Unique `tokenHash`, `familyId`, `(userId, revokedAt)`, TTL on `purgeAt` (= expiry + 7 d).

Indexes and `$jsonSchema` validators live in `infrastructure/persistence/auth.indexes.ts` and are applied by `make db-indexes`, never per request.

## Layers and dependency rule
```
presentation ──► application ──► domain ◄── infrastructure
                 (ports)                      (implements ports)
everything may use core/; only presentation imports @wealth-advisor/contracts
```
- **contracts/** wire schemas (zod), shared with the frontend.
- **application/dto** command/result objects; **ports** interfaces; **use-cases** one operation per file.
- **domain** entities built via `finalize()` → `postInit()`; pure `refresh-rotation.policy.ts`.
- **infrastructure** Mongo documents, mappers, repositories (compare-and-set instead of `FOR UPDATE`), crypto adapters.
- **auth.module.ts** is the only file that wires concrete classes.

Runtime constraints: Node runs `.ts` by stripping types, so no decorators, `enum`, parameter properties or namespaces.

## Environment
| Var | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes (except `/api/health`) | Atlas connection string |
| `AUTH_JWT_PRIVATE_KEY` / `AUTH_JWT_PUBLIC_KEY` | yes in production | `make jwt-keys`; dev falls back to an ephemeral pair |
| `MONGODB_DB_NAME`, `AUTH_JWT_ISSUER/AUDIENCE/KEY_ID`, `AUTH_*_TTL_SECONDS`, `AUTH_REFRESH_REUSE_GRACE_SECONDS` | no | defaults in `core/config/env.ts` |

## Not in scope yet
Email verification, OAuth, password reset, rate limiting, JWKS, introspection, login audit.
