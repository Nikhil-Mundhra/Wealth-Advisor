# Backend: db

## Calls
- `docs/backend/collections.md` : collections, indexes, TTL
- `docs/infra/env.md` : `DATA_STORE`, `MONGODB_*`

## Rules
- connection: only `mongo-client.ts` constructs a `MongoClient`; options come from `connection-options.ts`.
- store: `<module>.module.ts` picks repositories through `resolveDataStore`; every repository port has a Mongo and a memory implementation.
- store: memory is for local runs and tests; never in production.
- write: writes that must not race use conditional filters (compare-and-set), never read-then-write.
- write: classify driver errors with `classifyDbError`; never match error messages.
- retry: connect and reads go through `withReadRetry`; the app never retries a write.
- schema: one `<collection>.schema.ts` per collection; its validator requires every field the mapper writes.
- schema: indexes and validators are applied by `make db-indexes`, never per request.

## Workflow
- collection or index change: `<collection>.schema.ts` → `<module>-collections.ts` (core: `backend/src/core/db/schema/core-collections.ts`) → `make db-indexes` → `docs/backend/collections.md`
- repository port change: Mongo and memory implementations in the same change; the auth-flow suite runs on both.

## File structure

```
backend/src/core/db/connection/connection-options.ts : MongoClient options (pool size, server selection timeout, app name)
backend/src/core/db/connection/data-store.ts : resolves mongo or memory from env; refuses memory in production
backend/src/core/db/connection/database-health.ts : database status for /api/health (up, down, unconfigured, memory)
backend/src/core/db/connection/mongo-client.ts : one MongoClient cached across serverless invocations
backend/src/core/db/errors/classify-db-error.ts : driver error → duplicate-key, transient or fatal
backend/src/core/db/ids/object-id-generator.ts : IdGenerator backed by ObjectId hex strings
backend/src/core/db/mapping/mapper.ts : Mapper<Entity, Document> interface
backend/src/core/db/repository/base-repository.ts : collection access; applies lifecycle hooks on insert and update
backend/src/core/db/repository/lifecycle-hooks.ts : static, inherited insert/update hooks (timestamps)
backend/src/core/db/retry/retry-policy.ts : read retry attempts, backoff, retryable errors
backend/src/core/db/retry/with-read-retry.ts : runs a read or connect under the retry policy
backend/src/core/db/schema/apply-collection-definitions.ts : creates collections, validators, indexes (idempotent)
backend/src/core/db/schema/collection-definition.ts : type for a collection's indexes and $jsonSchema validator
backend/src/core/db/schema/core-collections.ts : collection definitions owned by core mechanisms (processed events, request budgets)
backend/src/core/db/schema/nullable.ts : $jsonSchema type that also allows null
backend/src/modules/auth/application/ports/session-repository.port.ts : session persistence contract (compare-and-set)
backend/src/modules/auth/application/ports/user-repository.port.ts : user persistence contract
backend/src/modules/auth/infrastructure/db/documents/session.document.ts : stored shape of sessions (incl. purgeAt)
backend/src/modules/auth/infrastructure/db/documents/user.document.ts : stored shape of users
backend/src/modules/auth/infrastructure/db/mappers/session.mapper.ts : SessionDocument ↔ Session
backend/src/modules/auth/infrastructure/db/mappers/user.mapper.ts : UserDocument ↔ User
backend/src/modules/auth/infrastructure/db/memory/memory-session.repository.ts : session repository in memory; same compare-and-set semantics
backend/src/modules/auth/infrastructure/db/memory/memory-user.repository.ts : user repository in memory; active-provider uniqueness
backend/src/modules/auth/infrastructure/db/repositories/mongo-session.repository.ts : session repository; conditional updates replace FOR UPDATE
backend/src/modules/auth/infrastructure/db/repositories/mongo-user.repository.ts : user repository on Mongo
backend/src/modules/auth/infrastructure/db/schema/auth-collections.ts : the auth module's collection definitions
backend/src/modules/auth/infrastructure/db/schema/sessions.schema.ts : sessions indexes (unique tokenHash, TTL) and $jsonSchema
backend/src/modules/auth/infrastructure/db/schema/users.schema.ts : users indexes (partial unique provider) and $jsonSchema
backend/src/modules/auth/infrastructure/db/seed/demo-user.seed.ts : creates the demo account if missing (memory store and seed script)
backend/src/modules/market/infrastructure/db/documents/fx-rate.document.ts : stored shape of fx_rates
backend/src/modules/market/infrastructure/db/documents/price.document.ts : stored shape of prices (money as amount + currency)
backend/src/modules/market/infrastructure/db/mappers/fx-rate.mapper.ts : FxRateDocument ↔ FxRate
backend/src/modules/market/infrastructure/db/mappers/price.mapper.ts : PriceDocument ↔ Price
backend/src/modules/market/infrastructure/db/mappers/stored-currency.ts : stored currency code → Currency, or corruption error
backend/src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts : fx rate repository in memory; first write per (base, quote, date) wins
backend/src/modules/market/infrastructure/db/memory/memory-price.repository.ts : price repository in memory; first write per (symbol, date) wins
backend/src/modules/market/infrastructure/db/repositories/mongo-fx-rate.repository.ts : fx rate repository on Mongo; append = $setOnInsert upserts
backend/src/modules/market/infrastructure/db/repositories/mongo-price.repository.ts : price repository on Mongo; append = $setOnInsert upserts; latest per symbol by aggregation
backend/src/modules/market/infrastructure/db/schema/fx-rates.schema.ts : fx_rates indexes (unique base+quote+date, date) and $jsonSchema
backend/src/modules/market/infrastructure/db/schema/market-collections.ts : the market module's collection definitions
backend/src/modules/market/infrastructure/db/schema/prices.schema.ts : prices indexes (unique symbol+date) and $jsonSchema
backend/src/scripts/ensure-indexes.ts : applies every module's collection definitions (deploy step)
backend/src/scripts/seed-demo-user.ts : seeds the demo account into Mongo (refuses NODE_ENV=production)
```
