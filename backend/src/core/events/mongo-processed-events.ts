import type { Collection } from 'mongodb';
import { classifyDbError } from '#core/db/errors/classify-db-error.ts';
import type { Clock } from '#core/time/clock.ts';
import type { MarkResult, ProcessedEvents } from './processed-events.ts';
import type { ProcessedEventDocument } from './processed-events.schema.ts';

// The unique (handler, eventId) index is the guard: an insert either wins or fails as a duplicate key, so two
// concurrent deliveries cannot both see 'first' (a find-then-insert could).
export class MongoProcessedEvents implements ProcessedEvents {
  private readonly collection: () => Promise<Collection<ProcessedEventDocument>>;
  private readonly clock: Clock;

  constructor(collection: () => Promise<Collection<ProcessedEventDocument>>, clock: Clock) {
    this.collection = collection;
    this.clock = clock;
  }

  async markProcessed(handlerName: string, eventId: string): Promise<MarkResult> {
    const collection = await this.collection();
    try {
      await collection.insertOne({ handler: handlerName, eventId, processedAt: this.clock.now() });
      return 'first';
    } catch (error) {
      if (classifyDbError(error) === 'duplicate-key') return 'duplicate';
      throw error;
    }
  }
}
