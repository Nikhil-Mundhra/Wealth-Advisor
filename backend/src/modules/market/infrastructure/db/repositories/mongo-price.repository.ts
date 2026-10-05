import type { AnyBulkWriteOperation, Collection } from 'mongodb';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';
import type { Clock } from '#core/time/clock.ts';
import type { PriceRepository } from '../../../application/ports.ts';
import type { Price } from '../../../domain/price.vo.ts';
import type { PriceDocument } from '../documents/price.document.ts';
import { priceMapper } from '../mappers/price.mapper.ts';

// Append is an upsert with $setOnInsert keyed by (symbol, date): an existing fact is left untouched and not
// counted, and the server retries the duplicate-key race of two concurrent upserts on the unique index itself.
export class MongoPriceRepository implements PriceRepository {
  private readonly collection: () => Promise<Collection<PriceDocument>>;
  private readonly clock: Clock;

  constructor(collection: () => Promise<Collection<PriceDocument>>, clock: Clock) {
    this.collection = collection;
    this.clock = clock;
  }

  async append(prices: readonly Price[]): Promise<number> {
    if (prices.length === 0) return 0;
    const now = this.clock.now();
    const operations: AnyBulkWriteOperation<PriceDocument>[] = prices.map((price) => ({
      updateOne: {
        filter: { symbol: price.symbol, date: price.date },
        update: { $setOnInsert: priceMapper.toDocument(price, now) },
        upsert: true,
      },
    }));
    const result = await (await this.collection()).bulkWrite(operations, { ordered: false });
    return result.upsertedCount;
  }

  async latestPerSymbol(symbols: readonly string[]): Promise<Price[]> {
    const documents = await withReadRetry(async () =>
      (await this.collection())
        .aggregate<{ latest: PriceDocument }>([
          { $match: { symbol: { $in: [...symbols] } } },
          { $sort: { symbol: 1, date: -1 } },
          { $group: { _id: '$symbol', latest: { $first: '$$ROOT' } } },
        ])
        .toArray(),
    );
    return documents.map(({ latest }) => priceMapper.toDomain(latest));
  }

  async history(symbols: readonly string[], from: string, to: string): Promise<Price[]> {
    const documents = await withReadRetry(async () =>
      (await this.collection())
        .find({ symbol: { $in: [...symbols] }, date: { $gte: from, $lte: to } })
        .sort({ symbol: 1, date: 1 })
        .toArray(),
    );
    return documents.map((document) => priceMapper.toDomain(document));
  }
}
