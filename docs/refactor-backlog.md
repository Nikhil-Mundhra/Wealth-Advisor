# Refactor backlog

Surveyed 2026-10-06 · scope backend/src + contracts/src (focus: core/events, core/http-client, core/http, core/time, modules/market, modules/analytics) · 184 files

Unrooted paths are under `backend/src/`.
Baseline: tests 180 green · 5023 lines · 313 comment lines · history 73 commits (61 on main, 12 on feat/market-data; thin)

## Open

### R17 · Duplicate code + global config · composition roots · store selection
status   planned
evidence 5 sites choose memory vs mongo (market.module.ts:32-37 x2, analytics.module.ts:22-25, core processed-events.ts:19, request-budget.ts:15) plus auth.module.ts:40,43, in two shapes; market and analytics read global env() although ModuleContext exists for injected dependencies
remedy   add `store` to ModuleContext (resolved once in app.ts and the test app); Extract Function selectStore
expect   one resolution of the data store; module roots stop reading env() for it
safety   SAFE · verify: full suite on both stores (auth-flow, market routes, analytics snapshot)
blocked  none
first seen 2026-10-06

### R23 · Refused bequest · market and analytics value objects · *.of via ValueObject.fromStored
status   planned
evidence value-object.ts:6-7 defines fromStored as data the system wrote earlier; Price, FxRate, Valuation and MarketSnapshot build fresh provider or computed data through it; Money's MONEY_RULE checks what Money.postInit checks again
remedy   add ValueObject.create (postInit only) and use it for fresh data; drop MONEY_RULE's duplicate checks
expect   the entry point names match their meaning; one check per invariant
safety   SAFE if additive (fromStored and fromInput unchanged for auth) · verify: npm test
blocked  none
first seen 2026-10-06

## Done

### R22 · Dead code · backend/src/modules/market/domain/tracked-symbols.ts · assetClassOf; money.vo.ts · Money.toMajorRatio
closed 2026-11-15 — deleted uncalled `assetClassOf` and `Money.toMajorRatio`, made `Money.fromRatio` private.

### R25 · Magic literal · ISO date pattern in 4 places
closed 2026-11-15 — exported shared `ISO_DATE_PATTERN` from `core/time/calendar-date.ts` across price, fx rate, and market snapshot schemas.

### R26 · Duplicate code · date reductions
closed 2026-11-15 — extracted `minDate` and `maxDate` into `core/time/calendar-date.ts`, unifying reductions across rate-window, refresh-range, and market.api.

### R16 · Data clump · DateRange
closed 2026-11-15 — exported parameter type `DateRange` in `core/time/calendar-date.ts` and shared across market application services.

### R18 · Duplicate code · fact repository append
closed 2026-11-15 — extracted shared `appendFacts` helper in `backend/src/modules/market/infrastructure/db/repositories/append-facts.ts` unifying MongoPriceRepository and MongoFxRateRepository $setOnInsert semantics.

### R28 · Feature envy · MarketApi.rates
closed 2026-11-15 — added `RateTable.quotesFor(base, date)`, moving quote resolution to the domain and eliminating quote iteration envy from MarketApi.

### R29 · Inappropriate intimacy · fx-rate.mapper.ts
closed 2026-11-15 — explicit field enumeration in `fxRateMapper.toDocument` matching priceMapper pattern.

### R1 · Dead code · User.isActive
closed 2026-10-06 by 105fd36 (verified absent: grep -w isActive outside sessions returns nothing)

### R2 · Dead code · ERROR_CODE_PREFIXES.core
closed 2026-10-06 by 1b9dbfc (fixed before the first commit; the prefix map holds auth, market, analytics only)

### R3 · Long parameter list (boolean mode flag) · setFields({ many })
closed 2026-10-06 by 1b9dbfc (fixed before the first commit; no setFields in history)

### R31 · Comments (misleading) · backend/src/modules/analytics/analytics.api.ts:32 · onMarketDataRefreshed
closed 2026-10-06 by 080f852 — the comment and backend/docs/events.md now describe in-process delivery (logged, never redelivered)

## Dropped

### R4 · Primitive obsession · backend/src/modules/auth/infrastructure/db/* · id string <-> ObjectId
dropped 2026-10-04 — 7 `new ObjectId(s)` sites are plain library use, not repeated knowledge; a 1:1 wrapper adds a file hop (KISS). Revisit if id validation is needed at more than findActiveById.

### R5 · Long parameter list · backend/src/modules/auth/infrastructure/crypto/scrypt-password-hasher.ts:14 · derive
dropped 2026-10-04 — private helper, 2 callers; folding keyLength into scrypt options reads no better (KISS)

### R6 · Long parameter list (boolean) · backend/src/modules/auth/presentation/mappers/result-to-contract.mapper.ts:10 · toTokenPairResponse
dropped 2026-10-04 — 1 caller; two functions to remove one flag costs more than it fixes

### R7 · Dead code · backend/src/core/registry/strategy-registry.ts · StrategyRegistry
dropped 2026-10-04 — deliberate future seam (user direction: "think in terms of the future"; the backend file map lists it for OAuth providers). Re-check when the first OAuth provider lands; delete if still unused then.
re-checked 2026-10-06 — still 0 callers; the market slice chose a closed ConversionMode union over the registry. Still a seam for OAuth providers and allocation strategies.

### R8 · Dead code · backend/src/core/http/route-builder.ts:48-58 · RouteBuilder.put / patch / delete
dropped 2026-10-04 — builder verb set kept complete for upcoming modules (same direction as R7)

### R9 · Dead code · backend/src/core/domain/base-entity.ts, value-object.ts · BaseEntity.equals, BaseEntity.updatedAt, ValueObject.toString, ValueObject.equals
dropped 2026-10-04 — base-class API the user asked for; ValueObject.equals pinned by backend/test/unit/auth/session.entity.test.ts:53

### R10 · Speculative generality · backend/src/core/events/event-bus.ts, core/module/* · event subscriptions
dropped 2026-10-04 — deliberate seam for a later outbox (documented in the backend file map); 0 subscribers today. Re-check when a second module exists.
re-checked 2026-10-06 — analytics subscribes to market.data_refreshed (analytics.module.ts:34): the seam is in use.

### R11 · Speculative generality · backend/src/modules/auth/application/ports/* · 4 single-implementation ports
dropped 2026-10-04 — user-approved architecture; dependency rule documented in docs/architecture/c3-backend.md (Components, Depends on)

### R12 · Speculative generality · backend/src/core/db/repository/lifecycle-hooks.ts · static onInsert/onUpdate hook registry
dropped 2026-10-04 — user explicitly requested attachable static hooks (builder pattern)

### R13 · Speculative generality · backend/src/core/domain/id-generator.ts · IdGenerator
dropped 2026-10-04 — keeps the domain off the database id type (reason stated in the file)

### R14 · Lazy class · backend/src/modules/auth/application/use-cases/* · 5 use-case classes
dropped 2026-10-04 — one-class-per-use-case is the approved layout

### R15 · Feature envy · backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts:12 · decideRotation
dropped 2026-10-04 — extracted on purpose as a pure policy (backend/src/modules/auth/domain/policies/refresh-rotation.policy.ts); table-tested in backend/test/unit/auth/refresh-rotation.policy.test.ts; handles a null session

### R19 · Speculative generality · backend/src/modules/market/market.api.ts:92 · MarketApi.convert (+ rate-window.ts, ConvertInput)
dropped 2026-10-06 — 0 callers today, but the finance slice (burn rate, dashboard raw + converted view) is the planned first caller and convertBatch is tested. Re-check when finance lands; delete if still unused.

### R20 · Speculative generality · backend/src/core/http-client/http-client.ts:6 · HttpClientError.kind / .status
dropped 2026-10-06 — kind is the transient/fatal contract the spec defines and its tests pin; the retry consumer is the next provider user. Re-check when a second provider integration lands.

### R21 · Speculative generality · backend/src/modules/analytics/analytics.api.ts:45 · markProcessed after the work
dropped 2026-10-06 — documented preparation for a redelivering transport (backend/docs/events.md); costs one insert per refresh.

### R24 · Duplicate code · `broken` invariant helper in 4 value objects
dropped 2026-10-06 — a one-line closure per file; a shared helper adds an import and a hop for no measured gain (KISS).

### R27 · Duplicate code · analytics snapshot mappers (contract vs document)
dropped 2026-10-06 — coincidence, not duplication: the wire contract and the stored document change for different reasons.

### R30 · Shotgun surgery · MarketSnapshot and Price field additions (7 and 6 files)
dropped 2026-10-06 — inherent to the decided layering (value object, document, schema, mapper, contract); the reducible part is R18 (thin history).

### R32 · bug, not a smell · analytics/application/snapshot-inputs.ts · adjusted and raw closes mixed within one series
dropped 2026-10-06 — fixed by 080f852 (one price basis per symbol; snapshot-inputs.test.ts).

### R33 · bug, not a smell · market/domain/convert.ts · one overflowing conversion threw for the whole batch
dropped 2026-10-06 — fixed by 080f852 (out-of-range fails only its item; convert.test.ts).

### R34 · bug, not a smell · market/application/refresh-range.ts:16 · a tracked symbol the provider never returns forces a one-year backfill every run
dropped 2026-10-06 — design question, not a smell: about 44 of 100 monthly Marketstack requests at worst. Open question for the user (per-symbol ranges, or excluding a symbol after a failed backfill).

## Refused
