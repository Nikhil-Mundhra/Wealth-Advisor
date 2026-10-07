# Backend

## Route
- HTTP edge: routes, handlers, use cases → `backend/agents/routes.md`
- errors: codes, statuses → `backend/agents/errors.md`
- db: connection, store, write, retry, schema → `backend/agents/db.md`
- auth security: tokens, sessions, refresh cookie → `backend/agents/auth-token.md`
- testing → `backend/agents/testing.md`
- module manifest and mounting → `backend/docs/module-contract.md`
- module boundaries: allowed imports between modules → `backend/docs/module-dependencies.md`
- events: envelope, catalogue, idempotency → `backend/docs/events.md`
- component boundaries → `docs/architecture/c3-backend.md`
- backend facts: collections, schema, planned collections, auth tokens → `backend/docs/index.md`

## Axes
- contract shapes → `contracts/AGENTS.md`

## Rules
- paths: unrooted `core/` and `modules/` paths in this guide are under `backend/src/`.
- layers: presentation → application → domain ← infrastructure; presentation may throw domain errors; all may use `core/`; `core/` never imports `modules/`.
- contracts: imported only by presentation, plus error-envelope types in `core/http` and `core/errors`, plus event payload schemas (`contracts/src/events/`) in application.
- core: mechanisms only (events, http, db, time, crypto); no domain concept (money, price, currency, snapshot, portfolio).
- module API: new modules build theirs with `create<Name>Api(deps)` in `<name>.api.ts`: one orchestrating function per use case calling standalone step functions in order, dependencies by closure; auth keeps its use-case classes.
- boundaries: a module imports another only through its `public.ts`, only along an edge in `backend/docs/module-dependencies.md`; `make deps-lint` checks both, and that `core/` imports no module.
- events: facts cross modules as `EventEnvelope`s built by `createEnvelope`; questions are synchronous calls through `public.ts`; every handler guards with `markProcessed` and keeps its writes idempotent.
- outbound http: through `core/http-client`; a metered provider call reserves its `RequestBudget` first.
- composition: only `<module>.module.ts` constructs concrete classes; `modules/index.ts` lists modules by static import.
- construction: entities and value objects are built through `finalize()`; never call `postInit()` from a constructor.
- advisory: the model narrates engine results only; weights, returns, variances and runway reach the response as structured fields from deterministic engines, never parsed from model text.
- execution: a route that writes the sandbox ledger verifies the passkey assertion signature before any write; a field-presence check is not verification.
- imports: `#core/` for core; `#modules/` only from outside `modules/`; relative inside a module.

## Workflow
- add a module: `<name>.module.ts` → one line in `modules/index.ts` → error prefix and statuses (`backend/agents/errors.md`) → row in `docs/architecture/c3-backend.md` → its edges in `backend/docs/module-dependencies.md`
- add or version an event: payload schema in `contracts/src/events/` → row in `backend/docs/events.md`
- add a cross-module edge: row in `backend/docs/module-dependencies.md` → `make deps-lint`

## File structure

```
backend/package.json : scripts (dev, start, test, db:indexes, keys:generate, db:seed-demo) and #core/#modules import aliases
backend/scripts/module-deps.mjs : fails on a cross-module import of a file other than public.ts, an import along an edge not in backend/docs/module-dependencies.md, a cycle in that edge list, or any core import of a module file
backend/src/app.ts : createApp(): registers modules, health, error handler; default export is the Vercel entry
backend/src/core/application/use-case.ts : UseCase<Command, Result> interface
backend/src/core/config/env.ts : validates environment variables once (zod)
backend/src/core/crypto/constant-time-equal.ts : string equality in constant time (SHA-256 digests, timingSafeEqual)
backend/src/core/crypto/random-token.ts : opaque random token of a given byte length → base64url
backend/src/core/crypto/sha256.ts : SHA-256 → hex
backend/src/core/domain/base-entity.ts : entity base: id + timestamps, finalize() → postInit()
backend/src/core/domain/domain-error.ts : rule refused by the domain, named by a stable code; no HTTP status
backend/src/core/domain/id-generator.ts : port for new ids; no database id type
backend/src/core/domain/invariant.ts : throws the given error when an invariant does not hold
backend/src/core/domain/parse-member.ts : narrows a stored string to a const list member, or throws
backend/src/core/domain/value-object.ts : immutable value base: finalize() validates then freezes
backend/src/core/domain/value-rule.ts : normalize/check/reject rule a value object applies to outside input
backend/src/core/errors/app-error.ts : HTTP-edge error with its status known (bad JSON, failed contract, missing database), optional field issues
backend/src/core/errors/error-catalog.ts : code → HTTP status registry per module prefix; rejects foreign or duplicate codes; unknown codes → 500
backend/src/core/events/event-bus.ts : in-process publish/subscribe of envelopes by type; handler failures logged, never thrown
backend/src/core/events/event-envelope.ts : EventEnvelope (id, type, version, occurredAt, correlationId, payload) and createEnvelope
backend/src/core/events/memory-processed-events.ts : processed-event marks in memory; same first/duplicate semantics
backend/src/core/events/mongo-processed-events.ts : processed-event marks on Mongo; the unique index decides the race
backend/src/core/events/processed-events.schema.ts : processed_events collection: unique (handler, eventId) and $jsonSchema
backend/src/core/events/processed-events.ts : ProcessedEvents port (markProcessed → first | duplicate) and store-based factory
backend/src/core/http-client/http-client.ts : getJson over fetch with a timeout; failures → transient or fatal HttpClientError, URL query never in messages
backend/src/core/http-client/memory-request-budget.ts : monthly request budget in memory; same limit semantics
backend/src/core/http-client/mongo-request-budget.ts : monthly request budget on Mongo; one conditional $inc per reservation
backend/src/core/http-client/request-budget-rules.ts : UTC month key and reservation argument checks shared by both stores
backend/src/core/http-client/request-budget.ts : RequestBudget port (reserve provider, count, monthly limit) and store-based factory
backend/src/core/http-client/request-budgets.schema.ts : request_budgets collection: one counter per provider and month, $jsonSchema
backend/src/core/http/error-handler.ts : turns AppError, DomainError (status from the catalog) and unknown errors into the error contract
backend/src/core/http/read-json-body.ts : reads the request body; empty body becomes {}
backend/src/core/http/require-bearer-secret.ts : machine-caller middleware: Bearer must equal a shared secret (constant time); unset secret refuses all
backend/src/core/http/route-builder.ts : fluent route declaration: method → query contract → body contract → middleware → handler → response contract
backend/src/core/http/validate-contract.ts : runs a contract schema; failures become one 400 with every field issue
backend/src/core/module/define-module.ts : module manifest (name, basePath, routes, collections, subscriptions, errors)
backend/src/core/module/module-context.ts : shared dependencies every module receives (db, clock, ids, events, outbound http)
backend/src/core/module/module-registry.ts : collects manifests; mounts routes, subscribes events, builds the error catalog, lists core and module collections
backend/src/core/registry/strategy-registry.ts : keyed registry for interchangeable implementations (e.g. OAuth providers)
backend/src/core/time/calendar-date.ts : UTC calendar dates as YYYY-MM-DD: from an instant, validity, add days
backend/src/core/time/clock.ts : Clock interface and system clock
backend/src/modules/admin/admin.api.ts : createAdminApi: tenants, api keys, model provider settings
backend/src/modules/admin/admin.module.ts : composition root: store-selected tenant/key repos → api, routes, manifest
backend/src/modules/admin/application/ports.ts : TenantRepository, ApiKeyRepository, AdminSettingsRepository ports
backend/src/modules/admin/public.ts : the admin surface other modules may import
backend/src/modules/advisory/advisory.api.ts : createAdvisoryApi: multilingual copilot chat, proposal cards, calculation shield
backend/src/modules/advisory/advisory.module.ts : composition root: llm gateway, mock adapter → api, routes, manifest
backend/src/modules/advisory/domain/calculation-shield.ts : shieldText keeps model text only when every number in it matches an engine fact; factNumbers reads facts from text
backend/src/modules/advisory/domain/llm-gateway.ts : multi-provider LLM gateway and mock deterministic adapter; live replies pass through the calculation shield
backend/src/modules/advisory/public.ts : the advisory surface other modules may import
backend/src/modules/analytics/analytics.api.ts : createAnalyticsApi: onMarketDataRefreshed (work, then mark), latestSnapshot, snapshotAt
backend/src/modules/analytics/analytics.module.ts : composition root: store-selected snapshot repository, processed events → api, routes, market.data_refreshed subscription, manifest
backend/src/modules/analytics/application/ports.ts : SnapshotRepository (one snapshot per asOf; upsert replaces)
backend/src/modules/analytics/application/read-refreshed-event.ts : subscribed event type; step: v1 market.data_refreshed payload checked against its contract, null for another version
backend/src/modules/analytics/application/snapshot-inputs.ts : step: 365-day window ending at asOf; prices → points (adjusted close only when every close of the symbol has one, else close)
backend/src/modules/analytics/domain/covariance.ts : annualized sample covariance of aligned return series; exactly symmetric
backend/src/modules/analytics/domain/market-snapshot.vo.ts : MarketSnapshot: asOf, symbols, means, volatilities, covariance, window, computedAt; square, symmetric, finite
backend/src/modules/analytics/domain/measure-snapshot.ts : aligned closes → snapshot, or insufficient below the minimum observations
backend/src/modules/analytics/domain/returns.ts : alignment on dates every symbol has, daily log returns, annualized mean
backend/src/modules/analytics/public.ts : the analytics surface other modules may import (api type, MarketSnapshot type)
backend/src/modules/auth/auth.module.ts : composition root: wires repositories → use cases → routes
backend/src/modules/finance/application/ports.ts : AccountRepository, TransactionRepository ports
backend/src/modules/finance/domain/burn-rate-calculator.ts : monthly inflow/outflow averaged over the calendar months present, runway from the base-currency reserves it is given, household mode multipliers
backend/src/modules/finance/finance.api.ts : createFinanceApi: accounts valued into the base currency (null when unvalued), transactions, burn rate and runway orchestrators
backend/src/modules/finance/finance.module.ts : composition root: store-selected account and transaction repos → api, routes, manifest
backend/src/modules/finance/public.ts : the finance surface other modules may import
backend/src/modules/index.ts : explicit, statically imported module list; builds market first and hands its api to analytics
backend/src/modules/market/application/ports.ts : PriceSource, FxSource, PriceRepository, FxRateRepository (append-only facts)
backend/src/modules/market/application/publish-refreshed.ts : step: checks the v1 payload, publishes market.data_refreshed
backend/src/modules/market/application/rate-window.ts : step: stored-rate date window a conversion needs (lookback for weekends and holidays)
backend/src/modules/market/application/refresh-range.ts : step: refresh range from the oldest last-stored day (one year back when anything is missing); latest date of prices
backend/src/modules/market/domain/convert.ts : convertBatch: spot, historical, raw; half-to-even to the minor unit; a missing rate or out-of-range result fails only its item
backend/src/modules/market/domain/decimal.ts : exact rational arithmetic (bigint) and round half to even
backend/src/modules/market/domain/fx-rate.vo.ts : FxRate: base, quote, date, rate > 0, source
backend/src/modules/market/domain/money.vo.ts : Money: integer minor units + currency; provider decimals → minor units
backend/src/modules/market/domain/price.vo.ts : Price: symbol, date, close, adjusted close, source
backend/src/modules/market/domain/rate-table.ts : rate lookup on or before a day: direct, inverse, or crossed through a stored base
backend/src/modules/market/domain/tracked-symbols.ts : tracked ETFs and their asset classes; FX base (EUR) and Frankfurter v1 quote currencies excluding AED
backend/src/modules/market/domain/valuation.vo.ts : Valuation: original, converted, rate, rate date, mode (provenance of a conversion)
backend/src/modules/market/infrastructure/providers/frankfurter-fx-source.ts : FxSource over Frankfurter v1 (ECB) range endpoint
backend/src/modules/market/infrastructure/providers/marketstack-price-source.ts : PriceSource over Marketstack v2 /eod; one budget reservation per page; missing key → MK_1903
backend/src/modules/market/infrastructure/providers/provider-call.ts : provider call → parsed body; network, status, error-body, shape and invalid-value failures → MK_1901
backend/src/modules/market/market.api.ts : createMarketApi: refresh, quotes, history, rates, convert orchestrators
backend/src/modules/market/market.module.ts : composition root: store-selected repositories, provider adapters, request budget → api, routes, manifest
backend/src/modules/market/public.ts : the market surface other modules may import (api type, domain types, tracked symbols)
backend/src/modules/sharing/application/ports.ts : SharedPlanRepository port
backend/src/modules/sharing/public.ts : the sharing surface other modules may import
backend/src/modules/sharing/sharing.api.ts : createSharingApi: share link creation with TTL, masked public plan resolution
backend/src/modules/sharing/sharing.module.ts : composition root: store-selected shared plan repo → api, routes, manifest
backend/src/modules/wealth/application/ports.ts : AssetProductRepository, PortfolioRepository, SandboxLedgerRepository, PasskeyVerifier ports
backend/src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts : PasskeyVerifier that refuses every assertion; no passkey registration exists
backend/src/modules/wealth/public.ts : the wealth surface other modules may import
backend/src/modules/wealth/wealth.api.ts : createWealthApi: products, portfolio, optimizer, sandbox trade execution, ledger
backend/src/modules/wealth/wealth.module.ts : composition root: store-selected wealth repos → api, routes, manifest
backend/src/node-server.ts : local Node runner; serves frontend/dist in production mode
backend/tsconfig.json : typecheck settings (erasable syntax only)
```
