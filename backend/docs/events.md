# Events

Every event is an `EventEnvelope` (`backend/src/core/events/event-envelope.ts`): `id`, `type`, `version`, `occurredAt`, `correlationId`, `payload`. Production runtime uses `DurableOutboxEventBus` (`backend/src/core/events/outbox-bus.ts`) backed by `outbox_events` and `dead_letter_events` with bounded retries and exponential backoff; unit tests may also inject `InProcessEventBus` (`backend/src/core/events/event-bus.ts`).

## Catalogue
| Type | Version | Producer | Consumers | Payload | Idempotency key |
|---|---|---|---|---|---|
| `auth.user_signed_up` | 1 | auth (signup) | none | `{ userId }` | envelope `id` |
| `finance.transaction_ingested` | 1 | finance (ingest) | wealth (`wealth.burn_rate_recalibration`: recomputes burn runway and effective risk score) | `TransactionIngestedPayload` (`contracts/src/events/transaction-ingested.event.ts`): `tenantId`, `userId`, `transactionId`, `category`, `convertedBaseAmount`, `baseCurrency`, `timestamp` | envelope `id`, per handler in `processed_events` |
| `market.data_refreshed` | 1 | market (refresh) | analytics (`analytics.snapshot`: market snapshot upserted by payload `asOf`) | `MarketDataRefreshedPayload` (`contracts/src/events/market-data-refreshed.event.ts`): `asOf`, `symbols`, `fxBase` | envelope `id`, per handler in `processed_events` |

## Idempotency
- A handler calls `markProcessed(handlerName, eventId)` (`backend/src/core/events/processed-events.ts`); the unique index on `processed_events` (`handler`, `eventId`) decides the race.
- Marking before the work and stopping on `duplicate` gives at-most-once: a handler that fails after marking is not re-run for that event id. Marking after a successful write gives at-least-once: a redelivery redoes the work, and an upsert keyed by the fact makes the redo harmless.
- Delivery: `DurableOutboxEventBus` stores events in `outbox_events`, drains pending entries, retries failed deliveries with exponential backoff up to `maxAttempts`, and moves permanently failing events to `dead_letter_events`.

| Handler | Marks | On `duplicate` | Write |
|---|---|---|---|
| `analytics.snapshot` | after the snapshot upsert, or after deciding there are too few observations (a final outcome for that event) | already recomputed; reported only | `market_snapshots` upsert by `asOf` |
| `wealth.burn_rate_recalibration` | after recalculating runway and saving the updated portfolio | already recalibrated; skipped on replay | `portfolios` upsert by `(tenantId, userId)` |
- A payload shape is fixed per (`type`, `version`); a breaking change publishes a new version.
