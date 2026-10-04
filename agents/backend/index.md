# Backend

## Route
- HTTP edge: routes, handlers, use cases → `agents/backend/routes.md`
- errors: codes, statuses → `agents/backend/errors.md`
- persistence and concurrency: collections, indexes, repositories → `agents/backend/persistence.md`
- auth security: tokens, sessions, refresh cookie → `agents/backend/auth-token.md`
- testing → `agents/backend/testing.md`
- module manifest and mounting → `docs/backend/module-contract.md`
- component boundaries → `docs/architecture/c3-backend.md`

## Axes
- contract shapes, dependency direction between workspaces → `agents/shared/index.md`

## Rules
- layers: presentation → application → domain ← infrastructure; presentation may throw domain errors; all may use `core/`; `core/` never imports `modules/`.
- contracts: imported only by presentation, plus error-envelope types in `core/http` and `core/errors`.
- composition: only `<module>.module.ts` constructs concrete classes; `modules/index.ts` lists modules by static import (Vercel bundles only what is imported).
- construction: entities and value objects are built through `finalize()`; never call `postInit()` from a constructor.
- imports: `#core/` for core; `#modules/` only from outside `modules/`; relative inside a module.

## Workflow
- add a module: `<name>.module.ts` → one line in `modules/index.ts` → error prefix and statuses (`agents/backend/errors.md`) → row in `docs/architecture/c3-backend.md`

## File structure

```
backend/package.json : scripts (dev, start, test, db:indexes, keys:generate, db:seed-demo) and #core/#modules import aliases
backend/src/app.ts : createApp(): registers modules, health, error handler; default export is the Vercel entry
backend/src/core/application/use-case.ts : UseCase<Command, Result> interface
backend/src/core/config/env.ts : validates environment variables once (zod)
backend/src/core/crypto/random-token.ts : opaque random token of a given byte length → base64url
backend/src/core/crypto/sha256.ts : SHA-256 → hex
backend/src/core/domain/base-entity.ts : entity base: id + timestamps, finalize() → postInit()
backend/src/core/domain/domain-error.ts : rule refused by the domain, named by a stable code; no HTTP status
backend/src/core/domain/domain-event.ts : event shape (name, occurredAt, payload)
backend/src/core/domain/id-generator.ts : port for new ids, so the domain never sees the database id type
backend/src/core/domain/invariant.ts : throws the given error when an invariant does not hold
backend/src/core/domain/parse-member.ts : narrows a stored string to a const list member, or throws
backend/src/core/domain/value-object.ts : immutable value base: finalize() validates then freezes
backend/src/core/domain/value-rule.ts : normalize/check/reject rule a value object applies to outside input
backend/src/core/errors/app-error.ts : HTTP-edge error with its status known (bad JSON, failed contract, missing database), optional field issues
backend/src/core/errors/error-catalog.ts : code → HTTP status registry per module prefix; rejects foreign or duplicate codes; unknown codes → 500
backend/src/core/events/event-bus.ts : typed in-process publish/subscribe (outbox can replace it later)
backend/src/core/http/error-handler.ts : turns AppError, DomainError (status from the catalog) and unknown errors into the error contract
backend/src/core/http/read-json-body.ts : reads the request body; empty body becomes {}
backend/src/core/http/route-builder.ts : fluent route declaration: method → body contract → middleware → handler → response contract
backend/src/core/http/validate-contract.ts : runs a contract schema; failures become one 400 with every field issue
backend/src/core/module/define-module.ts : module manifest (name, basePath, routes, collections, subscriptions, errors)
backend/src/core/module/module-context.ts : shared dependencies every module receives (db, clock, ids, events)
backend/src/core/module/module-registry.ts : collects manifests; mounts routes, subscribes events, builds the error catalog, lists collections
backend/src/core/persistence/apply-collection-definitions.ts : creates collections, validators, indexes (idempotent)
backend/src/core/persistence/base-repository.ts : collection access + static, inherited lifecycle hooks (timestamps)
backend/src/core/persistence/collection-definition.ts : type for a module's indexes and $jsonSchema validator
backend/src/core/persistence/mapper.ts : Mapper<Entity, Document> interface
backend/src/core/persistence/mongo-client.ts : one MongoClient cached across serverless invocations
backend/src/core/persistence/mongo-errors.ts : detects duplicate-key (unique index) errors
backend/src/core/persistence/object-id-generator.ts : IdGenerator backed by ObjectId hex strings
backend/src/core/registry/strategy-registry.ts : keyed registry for interchangeable implementations (e.g. OAuth providers)
backend/src/core/time/clock.ts : Clock interface and system clock
backend/src/modules/auth/auth.module.ts : composition root: wires repositories → use cases → routes
backend/src/modules/index.ts : explicit list of modules (static imports so Vercel can bundle them)
backend/src/node-server.ts : local Node runner; serves frontend/dist in production mode
backend/tsconfig.json : typecheck settings (erasable syntax only)
```
