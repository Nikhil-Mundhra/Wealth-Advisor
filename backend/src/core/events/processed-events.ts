import type { Db } from 'mongodb';
import type { DataStore } from '#core/db/connection/data-store.ts';
import type { Clock } from '#core/time/clock.ts';
import { MemoryProcessedEvents } from './memory-processed-events.ts';
import { MongoProcessedEvents } from './mongo-processed-events.ts';
import { type ProcessedEventDocument, PROCESSED_EVENTS_COLLECTION } from './processed-events.schema.ts';

export type MarkResult = 'first' | 'duplicate';

// Idempotency guard for event handlers: the first mark of (handler, eventId) wins, every later one is a duplicate.
// Where the handler marks sets its delivery guarantee: before the work → at most once (a failure after the mark is
// never retried for that event); after a successful write → at least once (a redelivery redoes the work). Either
// way handler writes stay idempotent (upserts keyed by the fact).
export interface ProcessedEvents {
  markProcessed(handlerName: string, eventId: string): Promise<MarkResult>;
}

export function createProcessedEvents(store: DataStore, db: () => Promise<Db>, clock: Clock): ProcessedEvents {
  if (store === 'memory') return new MemoryProcessedEvents();
  return new MongoProcessedEvents(async () => (await db()).collection<ProcessedEventDocument>(PROCESSED_EVENTS_COLLECTION), clock);
}
