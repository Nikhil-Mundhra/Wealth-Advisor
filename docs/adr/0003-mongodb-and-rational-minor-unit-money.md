# ADR-0002: MongoDB Transactional Outbox and Dead-Letter Queue Over Dedicated Brokers

- Status: Accepted
- Date: 2026-11-14

## Context

Ingesting a transaction in `finance` can push a household below its 6-month (family) or 3-month (individual) cash runway floor and require portfolio risk recalibration in `wealth`. Running downstream recalibrations synchronously couples write latency to consumer availability, while an unpersisted in-process event bus loses events if a subscriber fails or the process restarts. Meanwhile, live production runs on Vercel serverless + MongoDB Atlas M0 at zero infrastructure budget.

## Decision

Implement `DurableOutboxEventBus` (`backend/src/core/events/outbox-bus.ts`) backed by `outbox_events` and `dead_letter_events` collections (`backend/src/core/events/outbox.schema.ts`), paired with consumer-side deduplication via `processed_events` (`backend/src/core/events/processed-events.ts`):

- Publishers (`finance.ingestTransaction`, `market.refresh`) append envelopes with `status: 'PENDING'`, bounded `maxAttempts`, and exponential backoff `nextAttemptAt`.
- Consumers (`analytics.snapshot`, `wealth.burn_rate_recalibration`) mark processed `(handler, eventId)` pairs under a unique index to guarantee idempotency across retries.
- Events exhausting `maxAttempts` move atomically to `dead_letter_events` and increment Prometheus `dlq_events_total`.
- An identical in-memory outbox store (`createMemoryOutboxStore`) backs local `DATA_STORE=memory` runs and deterministic tests.

## Alternatives Considered

- **RabbitMQ / Apache Kafka / Managed Pub/Sub:** Strong partitioning and consumer groups, but adds stateful broker operations, memory footprint, and fixed hosting cost incompatible with Atlas M0 / Always Free targets.
- **BullMQ + Redis:** Fast job queues, yet introduces a second persistence engine to size, secure, and back up alongside MongoDB.

## Consequences

- **Positive:** Zero additional moving infrastructure parts; single backup and security perimeter inside MongoDB; durable retry and dead-letter visibility exposed on `/api/metrics`.
- **Negative / Exit Criteria:** Polling `outbox_events` on MongoDB adds index write amplification (`outbox_events` + `processed_events`) per event. If sustained event throughput exceeds roughly `500 events/s` or requires partitioned competing workers across regions, replace `OutboxStore` behind the `EventBus` port with NATS JetStream or GCP Pub/Sub.
