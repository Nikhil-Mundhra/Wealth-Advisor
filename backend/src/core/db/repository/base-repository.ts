import type { Collection, Document, Filter, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import type { Clock } from '#core/time/clock.ts';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';
import { type InsertHook, type TimestampedDocument, type UpdateHook, hooksOf, resolveHooks } from './lifecycle-hooks.ts';

export type { TimestampedDocument };

export type CollectionProvider<D extends Document> = () => Promise<Collection<D>>;

export abstract class BaseRepository<D extends TimestampedDocument> {
  protected readonly collection: CollectionProvider<D>;
  protected readonly clock: Clock;

  protected constructor(collection: CollectionProvider<D>, clock: Clock) {
    this.collection = collection;
    this.clock = clock;
  }

  // Chainable: SomeRepository.onInsert(a).onUpdate(b)
  static onInsert<T extends object>(this: T, hook: InsertHook): T {
    hooksOf(this).insert.push(hook);
    return this;
  }

  static onUpdate<T extends object>(this: T, hook: UpdateHook): T {
    hooksOf(this).update.push(hook);
    return this;
  }

  protected async insertDocument(document: D): Promise<void> {
    const now = this.clock.now();
    for (const hook of resolveHooks(this.constructor).insert) hook(document, now);
    const collection = await this.collection();
    await collection.insertOne(document as OptionalUnlessRequiredId<D>);
  }

  // Returns 1 if a document matched, else 0; callers use it as a compare-and-set result.
  protected async setOne(filter: Filter<D>, set: Record<string, unknown>): Promise<number> {
    const collection = await this.collection();
    const result = await collection.updateOne(filter, this.toSetUpdate(set));
    return result.matchedCount;
  }

  // Returns the number of documents matched.
  protected async setMany(filter: Filter<D>, set: Record<string, unknown>): Promise<number> {
    const collection = await this.collection();
    const result = await collection.updateMany(filter, this.toSetUpdate(set));
    return result.matchedCount;
  }

  // Returns the number of documents deleted.
  protected async deleteOne(filter: Filter<D>): Promise<number> {
    const collection = await this.collection();
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  }

  // Returns the number of documents deleted.
  protected async deleteMany(filter: Filter<D>): Promise<number> {
    const collection = await this.collection();
    const result = await collection.deleteMany(filter);
    return result.deletedCount;
  }

  private toSetUpdate(set: Record<string, unknown>): UpdateFilter<D> {
    const now = this.clock.now();
    for (const hook of resolveHooks(this.constructor).update) hook(set, now);
    return { $set: set } as UpdateFilter<D>;
  }

  protected async findOneDocument(filter: Filter<D>): Promise<D | null> {
    return withReadRetry(async () => {
      const collection = await this.collection();
      return (await collection.findOne(filter)) as D | null;
    });
  }
}

// Every document gets timestamps without each repository repeating it.
BaseRepository.onInsert((document, now) => {
  document.createdAt ??= now;
  document.updatedAt = now;
}).onUpdate((set, now) => {
  set.updatedAt = now;
});
