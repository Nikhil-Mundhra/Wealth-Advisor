import type { Collection, Document, Filter, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import type { Clock } from '#core/time/clock.ts';

export interface TimestampedDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export type InsertHook = (document: TimestampedDocument, now: Date) => void;
export type UpdateHook = (set: Record<string, unknown>, now: Date) => void;

interface HookSet {
  insert: InsertHook[];
  update: UpdateHook[];
}

export type CollectionProvider<D extends Document> = () => Promise<Collection<D>>;

// Hooks are registered per class and inherited down the class chain: BaseRepository's run first, then each
// subclass's. Keying by constructor keeps one repository's hooks from leaking into a sibling, which a single
// shared static array would do.
const hookRegistry = new WeakMap<object, HookSet>();

function hooksOf(owner: object): HookSet {
  let hooks = hookRegistry.get(owner);
  if (!hooks) {
    hooks = { insert: [], update: [] };
    hookRegistry.set(owner, hooks);
  }
  return hooks;
}

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
    for (const hook of this.resolveHooks().insert) hook(document, now);
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

  private toSetUpdate(set: Record<string, unknown>): UpdateFilter<D> {
    const now = this.clock.now();
    for (const hook of this.resolveHooks().update) hook(set, now);
    return { $set: set } as UpdateFilter<D>;
  }

  protected async findOneDocument(filter: Filter<D>): Promise<D | null> {
    const collection = await this.collection();
    return (await collection.findOne(filter)) as D | null;
  }

  private resolveHooks(): HookSet {
    const chain: object[] = [];
    for (let owner: object | null = this.constructor; owner && owner !== Function.prototype; owner = Object.getPrototypeOf(owner)) {
      chain.unshift(owner);
    }
    const resolved: HookSet = { insert: [], update: [] };
    for (const owner of chain) {
      const hooks = hookRegistry.get(owner);
      if (!hooks) continue;
      resolved.insert.push(...hooks.insert);
      resolved.update.push(...hooks.update);
    }
    return resolved;
  }
}

// Every document gets timestamps without each repository repeating it.
BaseRepository.onInsert((document, now) => {
  document.createdAt ??= now;
  document.updatedAt = now;
}).onUpdate((set, now) => {
  set.updatedAt = now;
});
