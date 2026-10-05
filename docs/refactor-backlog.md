# Refactor backlog

Surveyed 2026-10-04 · scope backend/src + contracts/src · 85 files
Baseline: tests 23 green · 2251 lines · 123 comment lines · history 1 commit (6e9711d; most of scope uncommitted)

## Open

### R1 · Dead code · backend/src/modules/auth/domain/entities/user.entity.ts:113 · User.isActive
status   planned
evidence grep -w isActive: User definition only; repositories filter status in the query
remedy   delete
expect   -3 lines
safety   SAFE · verify: tsc, npm test, grep -w isActive returns Session sites only
blocked  none
first seen 2026-10-04

### R2 · Dead code · backend/src/core/errors/error-codes.ts:3 · ERROR_CODE_PREFIXES.core
status   planned
evidence only ERROR_CODE_PREFIXES.auth is read (auth-errors.ts:4); CoreErrorCodes writes 'CORE_' literals
remedy   delete the `core` entry (reshaped by principles: deriving CoreErrorCodes from it would make codes ungreppable)
expect   -1 line
safety   SAFE · verify: tsc, npm test
blocked  none
first seen 2026-10-04

### R3 · Long parameter list (boolean mode flag) · backend/src/core/persistence/base-repository.ts:61 · setFields({ many })
status   planned
evidence `many` switches updateOne/updateMany; 2 callers pass many:true (mongo-session.repository.ts:50,54), 4 use the default
remedy   Replace Parameter with Explicit Methods (setOne / setMany) -> refactor-simplifying-method
expect   options parameter removed; 6 call sites, 3 files
safety   SAFE · verify: npm test (race, reuse-detection, logout-all and login tests cover every caller)
blocked  none
first seen 2026-10-04

## Done

## Dropped

### R4 · Primitive obsession · backend/src/modules/auth/infrastructure/persistence/* · id string <-> ObjectId
dropped 2026-10-04 — 7 `new ObjectId(s)` sites are plain library use, not repeated knowledge; a 1:1 wrapper adds a file hop (KISS). Revisit if id validation is needed at more than findActiveById.

### R5 · Long parameter list · backend/src/modules/auth/infrastructure/crypto/scrypt-password-hasher.ts:14 · derive
dropped 2026-10-04 — private helper, 2 callers; folding keyLength into scrypt options reads no better (KISS)

### R6 · Long parameter list (boolean) · backend/src/modules/auth/presentation/mappers/result-to-contract.mapper.ts:10 · toTokenPairResponse
dropped 2026-10-04 — 1 caller; two functions to remove one flag costs more than it fixes

### R7 · Dead code · backend/src/core/registry/strategy-registry.ts · StrategyRegistry
dropped 2026-10-04 — deliberate future seam (user direction: "think in terms of the future"; file map lists it for OAuth providers). Re-check when the first OAuth provider lands; delete if still unused then.

### R8 · Dead code · backend/src/core/http/route-builder.ts:48-58 · RouteBuilder.put / patch / delete
dropped 2026-10-04 — builder verb set kept complete for upcoming modules (same direction as R7)

### R9 · Dead code · backend/src/core/domain/base-entity.ts, value-object.ts · BaseEntity.equals, BaseEntity.updatedAt, ValueObject.toString, ValueObject.equals
dropped 2026-10-04 — base-class API the user asked for; ValueObject.equals pinned by test/unit/auth/session.entity.test.ts:53

### R10 · Speculative generality · backend/src/core/events/event-bus.ts, core/module/* · event subscriptions
dropped 2026-10-04 — deliberate seam for a later outbox (documented in file map); 0 subscribers today. Re-check when a second module exists.

### R11 · Speculative generality · backend/src/modules/auth/application/ports/* · 4 single-implementation ports
dropped 2026-10-04 — user-approved architecture; dependency rule documented in docs/architecture/c3-backend.md (Components, Depends on)

### R12 · Speculative generality · backend/src/core/persistence/base-repository.ts:42-90 · static onInsert/onUpdate hook registry
dropped 2026-10-04 — user explicitly requested attachable static hooks (builder pattern)

### R13 · Speculative generality · backend/src/core/domain/id-generator.ts · IdGenerator
dropped 2026-10-04 — keeps the domain off the database id type (reason stated in the file)

### R14 · Lazy class · backend/src/modules/auth/application/use-cases/* · 5 use-case classes
dropped 2026-10-04 — one-class-per-use-case is the approved layout

### R15 · Feature envy · backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts:12 · decideRotation
dropped 2026-10-04 — extracted on purpose as a pure policy (backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts); table-tested in test/unit/auth/refresh-rotation.policy.test.ts; handles a null session

## Refused
