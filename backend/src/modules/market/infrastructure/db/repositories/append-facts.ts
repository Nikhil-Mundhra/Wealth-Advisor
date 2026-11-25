import type { AnyBulkWriteOperation, Collection, Filter, MatchKeysAndValues } from 'mongodb';

// Shared append-only semantics for fact collections: an existing fact is left untouched and not
// counted, and the server retries the duplicate-key race of two concurrent upserts on the unique index.
export async function appendFacts<TDomain, TDoc extends object>(
  collection: Collection<TDoc>,
  items: readonly TDomain[],
  filterOf: (item: TDomain) => Filter<TDoc>,
  toDocument: (item: TDomain, createdAt: Date) => TDoc,
  now: Date,
): Promise<number> {
  if (items.length === 0) return 0;
  const operations: AnyBulkWriteOperation<TDoc>[] = items.map((item) => ({
    updateOne: {
      filter: filterOf(item),
      update: { $setOnInsert: toDocument(item, now) as MatchKeysAndValues<TDoc> },
      upsert: true,
    },
  }));
  const result = await collection.bulkWrite(operations, { ordered: false });
  return result.upsertedCount;
}
