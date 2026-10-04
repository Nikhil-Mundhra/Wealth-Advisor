# Backend structure

```
backend/package.json : scripts (dev, start, test, db:indexes, keys:generate) and #core/#modules import aliases
backend/src/app.ts : createApp(): registers modules, health, error handler; default export is the Vercel entry
backend/src/core/application/use-case.ts : UseCase<Command, Result> interface
backend/src/core/config/env.ts : validates environment variables once (zod)
backend/src/core/crypto/random-token.ts : 32-byte opaque token → base64url
backend/src/core/crypto/sha256.ts : SHA-256 → hex
backend/src/core/domain/base-entity.ts : entity base: id + timestamps, finalize() → postInit()
backend/src/core/domain/domain-event.ts : event shape (name, occurredAt, payload)
backend/src/core/domain/id-generator.ts : port for new ids, so the domain never sees the database id type
backend/src/core/domain/value-object.ts : immutable value base: finalize() validates then freezes
backend/src/core/errors/app-error.ts : error with HTTP status and code
backend/src/core/errors/error-codes.ts : per-module code prefixes and core codes
backend/src/core/events/event-bus.ts : typed in-process publish/subscribe (outbox can replace it later)
backend/src/core/http/error-handler.ts : turns any thrown error into the error contract
backend/src/core/http/read-json-body.ts : reads the request body; empty body becomes {}
backend/src/core/http/route-builder.ts : fluent route declaration: method → body contract → middleware → handler → response contract
backend/src/core/http/validate-contract.ts : runs a contract schema; failures become one 400
backend/src/core/module/define-module.ts : module manifest (name, basePath, routes, collections, subscriptions)
backend/src/core/module/module-context.ts : shared dependencies every module receives (db, clock, ids, events)
backend/src/core/module/module-registry.ts : collects manifests; mounts routes, subscribes events, lists collections
backend/src/core/persistence/apply-collection-definitions.ts : creates collections, validators, indexes (idempotent)
backend/src/core/persistence/base-repository.ts : collection access + static, inherited lifecycle hooks (timestamps)
backend/src/core/persistence/collection-definition.ts : type for a module's indexes and $jsonSchema validator
backend/src/core/persistence/mapper.ts : Mapper<Entity, Document> interface
backend/src/core/persistence/mongo-client.ts : one MongoClient cached across serverless invocations
backend/src/core/persistence/mongo-errors.ts : detects duplicate-key (unique index) errors
backend/src/core/persistence/object-id-generator.ts : IdGenerator backed by ObjectId hex strings
backend/src/core/registry/strategy-registry.ts : keyed registry for interchangeable implementations (e.g. OAuth providers)
backend/src/core/time/clock.ts : Clock interface and system clock
backend/src/modules/auth/application/config/token-config.ts : refresh TTL and reuse grace period
backend/src/modules/auth/application/dto/get-me.query.ts : current user id
backend/src/modules/auth/application/dto/login.command.ts : login input
backend/src/modules/auth/application/dto/logout.command.ts : one session or all sessions
backend/src/modules/auth/application/dto/refresh.command.ts : raw refresh token
backend/src/modules/auth/application/dto/signup.command.ts : signup input
backend/src/modules/auth/application/dto/signup.result.ts : signup output
backend/src/modules/auth/application/dto/token-pair.result.ts : access + refresh token, delivery hints
backend/src/modules/auth/application/dto/user-profile.result.ts : public user view
backend/src/modules/auth/application/ports/access-token-signer.port.ts : sign/verify JWT contract
backend/src/modules/auth/application/ports/password-hasher.port.ts : hash/verify contract
backend/src/modules/auth/application/ports/session-repository.port.ts : session persistence contract (compare-and-set)
backend/src/modules/auth/application/ports/user-repository.port.ts : user persistence contract
backend/src/modules/auth/application/use-cases/get-me.use-case.ts : current user profile
backend/src/modules/auth/application/use-cases/issue-token-pair.ts : shared step: store session, sign access token
backend/src/modules/auth/application/use-cases/login.use-case.ts : check credentials (uniform 401), start a token family
backend/src/modules/auth/application/use-cases/logout.use-case.ts : revoke one session or all of a user's sessions
backend/src/modules/auth/application/use-cases/refresh-tokens.use-case.ts : apply the rotation policy and persist it
backend/src/modules/auth/application/use-cases/signup.use-case.ts : create an email account; duplicate → AU_1001
backend/src/modules/auth/auth.module.ts : composition root: wires repositories → use cases → routes
backend/src/modules/auth/domain/entities/session.entity.ts : refresh session: start family, rotate, revoke
backend/src/modules/auth/domain/entities/user.entity.ts : User with embedded providers/roles; invariants in postInit
backend/src/modules/auth/domain/errors/auth-errors.ts : AU_* error codes
backend/src/modules/auth/domain/events/user-signed-up.event.ts : emitted after signup
backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts : ROTATE | ALREADY_ROTATED | REUSE_DETECTED | INVALID
backend/src/modules/auth/domain/value-objects/email.vo.ts : normalized, validated email
backend/src/modules/auth/domain/value-objects/role.vo.ts : USER | ADMIN
backend/src/modules/auth/domain/value-objects/token-hash.vo.ts : SHA-256 hex of a refresh token
backend/src/modules/auth/infrastructure/crypto/ed25519-jwt-signer.ts : EdDSA access tokens with cochika's claim set
backend/src/modules/auth/infrastructure/crypto/jwt-key-loader.ts : loads PEM keys, or an ephemeral pair in dev
backend/src/modules/auth/infrastructure/crypto/scrypt-password-hasher.ts : scrypt (node:crypto) password hashing
backend/src/modules/auth/infrastructure/persistence/auth.indexes.ts : indexes and $jsonSchema for users and sessions
backend/src/modules/auth/infrastructure/persistence/documents/session.document.ts : stored shape of sessions (incl. purgeAt)
backend/src/modules/auth/infrastructure/persistence/documents/user.document.ts : stored shape of users
backend/src/modules/auth/infrastructure/persistence/mappers/session.mapper.ts : SessionDocument ↔ Session
backend/src/modules/auth/infrastructure/persistence/mappers/user.mapper.ts : UserDocument ↔ User
backend/src/modules/auth/infrastructure/persistence/mongo-session.repository.ts : session repository; conditional updates replace FOR UPDATE
backend/src/modules/auth/infrastructure/persistence/mongo-user.repository.ts : user repository on Mongo
backend/src/modules/auth/presentation/cookies/refresh-cookie.ts : set/read/clear refresh_token (HttpOnly, Secure, Lax, /api/auth)
backend/src/modules/auth/presentation/delivery/token-delivery.ts : refresh token to cookie (WEB) or body (mobile)
backend/src/modules/auth/presentation/mappers/contract-to-command.mapper.ts : request contract → command DTO
backend/src/modules/auth/presentation/mappers/result-to-contract.mapper.ts : result DTO → response contract
backend/src/modules/auth/presentation/middleware/require-auth.ts : verifies the Bearer access token; sets the principal
backend/src/modules/auth/presentation/routes/auth.routes.ts : signup, login, refresh, logout, logout-all
backend/src/modules/auth/presentation/routes/me.routes.ts : GET /me
backend/src/modules/index.ts : explicit list of modules (static imports so Vercel can bundle them)
backend/src/node-server.ts : local Node runner; serves frontend/dist in production mode
backend/src/scripts/ensure-indexes.ts : applies every module's collection definitions (deploy step)
backend/src/scripts/generate-jwt-keypair.ts : prints a new Ed25519 key pair as env lines
backend/test/integration/auth/auth-flow.test.ts : signup, login, me, refresh, reuse detection, logout
backend/test/integration/auth/refresh-race.test.ts : concurrent refreshes; exactly one wins
backend/test/support/auth-fixtures.ts : shared session/token fixtures
backend/test/support/fake-clock.ts : clock moved by hand
backend/test/support/test-app.ts : boots the real app against a throwaway mongod
backend/test/unit/auth/refresh-rotation.policy.test.ts : every rotation decision
backend/test/unit/auth/session.entity.test.ts : session and email invariants
backend/tsconfig.json : typecheck settings (erasable syntax only)
```
