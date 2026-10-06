# Events

Every event is an `EventEnvelope` (`backend/src/core/events/event-envelope.ts`): `id`, `type`, `version`, `occurredAt`, `correlationId`, `payload`. The bus is in-process (`backend/src/core/events/event-bus.ts`): `publish` awaits each handler in subscription order; a failing handler is logged and does not fail the publisher.

## Catalogue
| Type | Version | Producer | Consumers | Payload | Idempotency key |
|---|---|---|---|---|---|
| `auth.user_signed_up` | 1 | auth (signup) | none | `{ userId }` | envelope `id` |
| `market.data_refreshed` | 1 | market (refresh) | analytics (`analytics.snapshot`: market snapshot upserted by payload `asOf`) | `MarketDataRefreshedPayload` (`contracts/src/events/market-data-refreshed.event.ts`): `asOf`, `symbols`, `fxBase` | envelope `id`, per handler in `processed_events` |

## Idempotency
- A handler calls `markProcessed(handlerName, eventId)` (`backend/src/core/events/processed-events.ts`); the unique index on `processed_events` (`handler`, `eventId`) decides the race.
- Marking before the work and stopping on `duplicate` gives at-most-once: a handler that fails after marking is not re-run for that event id. Marking after a successful write gives at-least-once: a redelivery redoes the work, so the write must be an upsert keyed by the fact.
- Delivery today: the in-process bus runs handlers inside the publisher's request, logs a failing handler and never redelivers; a failed handler's work is redone by the next publish of that fact.

| Handler | Marks | On `duplicate` | Write |
|---|---|---|---|
| `analytics.snapshot` | after the snapshot upsert, or after deciding there are too few observations (a final outcome for that event) | already recomputed; reported only | `market_snapshots` upsert by `asOf` |
- A payload shape is fixed per (`type`, `version`); a breaking change publishes a new version.
