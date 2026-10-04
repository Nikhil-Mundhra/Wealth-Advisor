# Backend

## Route
- adding a module → `agents/backend/modules.md`
- adding or changing a route or use case → `agents/backend/routes.md`
- adding an error code → `agents/backend/errors.md`
- collections, indexes, repositories → `agents/backend/persistence.md`
- tokens, sessions, refresh cookie → `agents/backend/auth-token.md`
- writing tests → `agents/backend/testing.md`
- component boundaries → `docs/architecture/c3-backend.md`

## Rules
- Layers: presentation → application → domain ← infrastructure; all may use `core/`; `core/` never imports `modules/`.
- Only presentation imports `@wealth-advisor/contracts`, plus `core/http` and `core/errors` for error-envelope types; only `<module>.module.ts` constructs concrete classes.
- Any layer may import `@wealth-advisor/rules` (constants and pure functions shared with contracts and frontend).
- File suffix names the layer: `.routes` `.use-case` `.command` `.result` `.port` `.entity` `.vo` `.policy` `.document` `.mapper` `.repository`.
- Entities and value objects are built by static factories that call `finalize()` → `postInit()`; never call `postInit()` from a constructor.
- Node strips types at runtime: no decorators, `enum`, parameter properties or namespaces; imports use `.ts` and the `#core/` `#modules/` aliases.
- delete: grep → unlink callers → delete → re-grep → `make test` → remove the map line.

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
backend/src/node-server.ts : local Node runner; serves frontend/dist in production mode
backend/tsconfig.json : typecheck settings (erasable syntax only)
```
