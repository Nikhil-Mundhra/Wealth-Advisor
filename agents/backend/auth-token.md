# Backend: tokens, sessions and the refresh cookie

## Calls
- `docs/backend/auth-token.md` : token model, rotation outcomes, delivery and cookie attributes
- `docs/frontend/session-flow.md` : the client side of refresh and logout
- `docs/infra/env.md` : `AUTH_*` variables and signing keys

## Rules
- Rotation decisions come only from `decideRotation` (pure, time passed in); the use case applies and persists them.
- Only the SHA-256 hash of a refresh token is stored.
- Cookie attributes are set only in `presentation/cookies/refresh-cookie.ts`; cookie-or-body delivery is decided only in `presentation/delivery/token-delivery.ts`.

## Workflow
- change token, session or cookie behaviour: policy or entity → use case → unit tests (`refresh-rotation.policy.test.ts`, `session.entity.test.ts`) + integration tests (`auth-flow.test.ts`, `refresh-race.test.ts`) → `docs/backend/auth-token.md` → route docs if error ids change → `docs/frontend/session-flow.md` if the client is affected
- new signing keys: `make jwt-keys` → set them in the environment, never in a committed file

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
