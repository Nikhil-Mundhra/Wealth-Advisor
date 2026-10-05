import type { Collection } from 'mongodb';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';
import type { SnapshotRepository } from '../../../application/ports.ts';
import type { MarketSnapshot } from '../../../domain/market-snapshot.vo.ts';
import type { MarketSnapshotDocument } from '../documents/market-snapshot.document.ts';
import { marketSnapshotMapper } from '../mappers/market-snapshot.mapper.ts';

// Upsert is one replaceOne keyed by asOf: a recomputation replaces the stored snapshot whole, and the server
// retries the duplicate-key race of two concurrent upserts on the unique asOf index itself.
export class MongoMarketSnapshotRepository implements SnapshotRepository {
  private readonly collection: () => Promise<Collection<MarketSnapshotDocument>>;

  constructor(collection: () => Promise<Collection<MarketSnapshotDocument>>) {
    this.collection = collection;
  }

  async upsert(snapshot: MarketSnapshot): Promise<void> {
    await (await this.collection()).replaceOne({ asOf: snapshot.asOf }, marketSnapshotMapper.toDocument(snapshot), { upsert: true });
  }

  async latest(): Promise<MarketSnapshot | null> {
    const document = await withReadRetry(async () => (await this.collection()).findOne({}, { sort: { asOf: -1 } }));
    return document ? marketSnapshotMapper.toDomain(document) : null;
  }

  async at(asOf: string): Promise<MarketSnapshot | null> {
    const document = await withReadRetry(async () => (await this.collection()).findOne({ asOf }));
    return document ? marketSnapshotMapper.toDomain(document) : null;
  }
}
