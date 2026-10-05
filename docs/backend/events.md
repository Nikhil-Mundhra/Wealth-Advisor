# Events

Every event is an `EventEnvelope` (`backend/src/core/events/event-envelope.ts`): `id`, `type`, `version`, `occurredAt`, `correlationId`, `payload`. The bus is in-process (`backend/src/core/events/event-bus.ts`): `publish` awaits each handler in subscription order; a failing handler is logged and does not fail the publisher.

## Catalogue
| Type | Version | Producer | Consumers | Payload | Idempotency key |
|---|---|---|---|---|---|
| `auth.user_signed_up` | 1 | auth (signup) | none | `{ userId }` | envelope `id` |
| `market.data_refreshed` | 1 | market (refresh) | analytics (snapshot) | `MarketDataRefreshedPayload` (`contracts/src/events/market-data-refreshed.event.ts`): `asOf`, `symbols`, `fxBase` | envelope `id`, per handler in `processed_events` |

## Idempotency
- A handler calls `markProcessed(handlerName, eventId)` (`backend/src/core/events/processed-events.ts`) before its work and stops on `duplicate`; the unique index on `processed_events` (`handler`, `eventId`) decides the race.
- The mark is taken before the work, so a handler that fails after marking is not re-run for that event id; handler writes are upserts keyed by the fact (for example a snapshot by `asOf`), so the next event converges.
- A payload shape is fixed per (`type`, `version`); a breaking change publishes a new version.
