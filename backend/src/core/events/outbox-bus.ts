import type { Db } from 'mongodb';
import type { EventBus, EventHandler } from '#core/events/event-bus.ts';
import type { EventEnvelope } from '#core/events/event-envelope.ts';
import {
  DEAD_LETTER_EVENTS_COLLECTION,
  type DeadLetterEventDocument,
  OUTBOX_EVENTS_COLLECTION,
  type OutboxEventDocument,
} from '#core/events/outbox.schema.ts';
import type { Clock } from '#core/time/clock.ts';
import { systemClock } from '#core/time/clock.ts';

export interface OutboxStats {
  readonly pending: number;
  readonly delivered: number;
  readonly deadLettered: number;
}

export interface OutboxStore {
  enqueue(doc: Omit<OutboxEventDocument, '_id'>): Promise<void>;
  findDue(now: Date, limit: number): Promise<OutboxEventDocument[]>;
  markDelivered(eventId: string, now: Date): Promise<void>;
  markRetry(eventId: string, attempts: number, nextAttemptAt: Date, lastError: string, now: Date): Promise<void>;
  moveToDeadLetter(doc: Omit<DeadLetterEventDocument, '_id'>, now: Date): Promise<void>;
  stats(): Promise<OutboxStats>;
  listDeadLetters(): Promise<DeadLetterEventDocument[]>;
}

const CLAIM_LEASE_MS = 30_000;

export function createMemoryOutboxStore(): OutboxStore {
  const outbox = new Map<string, OutboxEventDocument>();
  const dlq: DeadLetterEventDocument[] = [];

  return {
    async enqueue(doc) {
      if (!outbox.has(doc.eventId)) {
        outbox.set(doc.eventId, { ...doc });
      }
    },
    async findDue(now, limit) {
      const due = Array.from(outbox.values())
        .filter((d) => d.status === 'PENDING' && d.nextAttemptAt.getTime() <= now.getTime())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, limit);
      // Reserve a short visibility lease so concurrent drainOnce() calls do not pick up the same rows.
      const leaseUntil = new Date(now.getTime() + CLAIM_LEASE_MS);
      for (const row of due) {
        outbox.set(row.eventId, { ...row, nextAttemptAt: leaseUntil, updatedAt: now });
      }
      return due;
    },
    async markDelivered(eventId, now) {
      const existing = outbox.get(eventId);
      if (existing) {
        outbox.set(eventId, { ...existing, status: 'DELIVERED', updatedAt: now });
      }
    },
    async markRetry(eventId, attempts, nextAttemptAt, lastError, now) {
      const existing = outbox.get(eventId);
      if (existing) {
        outbox.set(eventId, { ...existing, attempts, nextAttemptAt, lastError, updatedAt: now });
      }
    },
    async moveToDeadLetter(doc, now) {
      const existing = outbox.get(doc.eventId);
      if (existing) {
        outbox.set(doc.eventId, {
          ...existing,
          status: 'DEAD_LETTERED',
          attempts: doc.attempts,
          lastError: doc.lastError,
          updatedAt: now,
        });
      }
      dlq.unshift({ ...doc });
    },
    async stats() {
      let pending = 0;
      let delivered = 0;
      let deadLettered = 0;
      for (const row of outbox.values()) {
        if (row.status === 'PENDING') pending += 1;
        else if (row.status === 'DELIVERED') delivered += 1;
        else if (row.status === 'DEAD_LETTERED') deadLettered += 1;
      }
      return { pending, delivered, deadLettered };
    },
    async listDeadLetters() {
      return [...dlq];
    },
  };
}

export function createMongoOutboxStore(db: () => Promise<Db>): OutboxStore {
  const outboxCol = async () => (await db()).collection<OutboxEventDocument>(OUTBOX_EVENTS_COLLECTION);
  const dlqCol = async () => (await db()).collection<DeadLetterEventDocument>(DEAD_LETTER_EVENTS_COLLECTION);

  return {
    async enqueue(doc) {
      await (await outboxCol()).updateOne(
        { eventId: doc.eventId },
        { $setOnInsert: doc },
        { upsert: true },
      );
    },
    async findDue(now, limit) {
      const col = await outboxCol();
      const leaseUntil = new Date(now.getTime() + CLAIM_LEASE_MS);
      const claimed: OutboxEventDocument[] = [];
      for (let i = 0; i < limit; i += 1) {
        const doc = await col.findOneAndUpdate(
          { status: 'PENDING', nextAttemptAt: { $lte: now } },
          { $set: { nextAttemptAt: leaseUntil, updatedAt: now } },
          { sort: { createdAt: 1 }, returnDocument: 'before' },
        );
        if (!doc) break;
        claimed.push(doc);
      }
      return claimed;
    },
    async markDelivered(eventId, now) {
      await (await outboxCol()).updateOne(
        { eventId },
        { $set: { status: 'DELIVERED', updatedAt: now } },
      );
    },
    async markRetry(eventId, attempts, nextAttemptAt, lastError, now) {
      await (await outboxCol()).updateOne(
        { eventId },
        { $set: { attempts, nextAttemptAt, lastError, updatedAt: now } },
      );
    },
    async moveToDeadLetter(doc, now) {
      await (await dlqCol()).insertOne(doc);
      await (await outboxCol()).updateOne(
        { eventId: doc.eventId },
        {
          $set: {
            status: 'DEAD_LETTERED',
            attempts: doc.attempts,
            lastError: doc.lastError,
            updatedAt: now,
          },
        },
      );
    },
    async stats() {
      const col = await outboxCol();
      const [pending, delivered, deadLettered] = await Promise.all([
        col.countDocuments({ status: 'PENDING' }),
        col.countDocuments({ status: 'DELIVERED' }),
        col.countDocuments({ status: 'DEAD_LETTERED' }),
      ]);
      return { pending, delivered, deadLettered };
    },
    async listDeadLetters() {
      return (await dlqCol()).find().sort({ failedAt: -1 }).limit(100).toArray();
    },
  };
}

export interface DurableOutboxOptions {
  readonly store?: OutboxStore;
  readonly clock?: Clock;
  readonly maxAttempts?: number;
  readonly retryBackoffMs?: number;
  readonly autoDrain?: boolean;
}

/**
 * MongoDB/in-memory backed transactional outbox EventBus with bounded retries and DLQ routing.
 */
export class DurableOutboxEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly store: OutboxStore;
  private readonly clock: Clock;
  private readonly maxAttempts: number;
  private readonly retryBackoffMs: number;
  private readonly autoDrain: boolean;

  constructor(options?: DurableOutboxOptions) {
    this.store = options?.store ?? createMemoryOutboxStore();
    this.clock = options?.clock ?? systemClock;
    this.maxAttempts = options?.maxAttempts ?? 3;
    this.retryBackoffMs = options?.retryBackoffMs ?? 1000;
    this.autoDrain = options?.autoDrain ?? true;
  }

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(event: EventEnvelope): Promise<void> {
    const now = this.clock.now();
    await this.store.enqueue({
      eventId: event.id,
      type: event.type,
      version: event.version,
      occurredAt: event.occurredAt.toISOString(),
      correlationId: event.correlationId,
      payload: event.payload,
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });

    if (this.autoDrain) {
      await this.drainOnce(20);
    }
  }

  async drainOnce(limit = 50): Promise<{ delivered: number; retried: number; deadLettered: number }> {
    const now = this.clock.now();
    const due = await this.store.findDue(now, limit);
    let delivered = 0;
    let retried = 0;
    let deadLettered = 0;

    for (const row of due) {
      const envelope: EventEnvelope = {
        id: row.eventId,
        type: row.type,
        version: row.version,
        occurredAt: new Date(row.occurredAt),
        correlationId: row.correlationId,
        payload: row.payload,
      };
      const listeners = this.handlers.get(row.type) ?? [];

      try {
        for (const handler of listeners) {
          await handler(envelope);
        }
        await this.store.markDelivered(row.eventId, now);
        delivered += 1;
      } catch (error) {
        const nextAttempts = row.attempts + 1;
        const message = error instanceof Error ? error.message : String(error);
        if (nextAttempts >= this.maxAttempts) {
          await this.store.moveToDeadLetter(
            {
              eventId: row.eventId,
              type: row.type,
              version: row.version,
              correlationId: row.correlationId,
              payload: row.payload,
              attempts: nextAttempts,
              lastError: message,
              failedAt: now,
            },
            now,
          );
          deadLettered += 1;
        } else {
          const delayMs = this.retryBackoffMs * Math.pow(2, nextAttempts - 1);
          const nextAttemptAt = new Date(now.getTime() + delayMs);
          await this.store.markRetry(row.eventId, nextAttempts, nextAttemptAt, message, now);
          retried += 1;
        }
      }
    }

    return { delivered, retried, deadLettered };
  }

  async stats(): Promise<OutboxStats> {
    return this.store.stats();
  }

  async deadLetters(): Promise<DeadLetterEventDocument[]> {
    return this.store.listDeadLetters();
  }
}
