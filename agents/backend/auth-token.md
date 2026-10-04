# Backend: tokens, sessions and the refresh cookie

## Calls
- `docs/backend/auth-token.md` : token model, rotation outcomes, delivery and cookie attributes
- `docs/infra/env.md` : signing keys and TTLs

## Rules
- Rotation decisions come only from `decideRotation` (pure, time passed in).
- Cookie attributes are set only in `refresh-cookie.ts`; cookie-or-body delivery is decided only in `token-delivery.ts`.
- `make jwt-keys` output goes to the environment, never into a committed file.

## Workflow
- behaviour change → policy/entity unit tests + `auth-flow`/`refresh-race` → `docs/backend/auth-token.md` → `docs/frontend/session-flow.md` if the client is affected

## File structure

```
backend/src/modules/auth/application/config/token-config.ts : refresh TTL and reuse grace period
backend/src/modules/auth/application/ports/access-token-signer.port.ts : sign/verify JWT contract
backend/src/modules/auth/application/ports/password-hasher.port.ts : hash/verify contract
backend/src/modules/auth/application/use-cases/issue-token-pair.ts : shared step: store session, sign access token
backend/src/modules/auth/application/use-cases/login.use-case.ts : check credentials (uniform 401), start a token family
backend/src/modules/auth/application/use-cases/logout.use-case.ts : revoke one session or all of a user's sessions
backend/src/modules/auth/application/use-cases/refresh-tokens.use-case.ts : apply the rotation policy and persist it
backend/src/modules/auth/domain/entities/session.entity.ts : refresh session: start family, rotate, revoke
backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts : ROTATE | ALREADY_ROTATED | REUSE_DETECTED | INVALID
backend/src/modules/auth/domain/value-objects/token-hash.vo.ts : SHA-256 hex of a refresh token
backend/src/modules/auth/infrastructure/crypto/ed25519-jwt-signer.ts : EdDSA access tokens with cochika's claim set
backend/src/modules/auth/infrastructure/crypto/jwt-key-loader.ts : loads PEM keys, or an ephemeral pair in dev
backend/src/modules/auth/infrastructure/crypto/scrypt-password-hasher.ts : scrypt (node:crypto) password hashing
backend/src/modules/auth/presentation/cookies/refresh-cookie.ts : set/read/clear the refresh_token cookie
backend/src/modules/auth/presentation/delivery/token-delivery.ts : refresh token to cookie (WEB) or body (mobile)
backend/src/modules/auth/presentation/middleware/require-auth.ts : verifies the Bearer access token; sets the principal
backend/src/scripts/generate-jwt-keypair.ts : prints a new Ed25519 key pair as env lines
```
