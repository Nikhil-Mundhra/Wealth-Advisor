import type { AnyBulkWriteOperation, Collection } from 'mongodb';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';
import type { Clock } from '#core/time/clock.ts';
import type { FxRateRepository } from '../../../application/ports.ts';
import type { FxRate } from '../../../domain/fx-rate.vo.ts';
import type { FxRateDocument } from '../documents/fx-rate.document.ts';
import { fxRateMapper } from '../mappers/fx-rate.mapper.ts';

// Same append semantics as MongoPriceRepository, keyed by (base, quote, date).
export class MongoFxRateRepository implements FxRateRepository {
  private readonly collection: () => Promise<Collection<FxRateDocument>>;
  private readonly clock: Clock;

  constructor(collection: () => Promise<Collection<FxRateDocument>>, clock: Clock) {
    this.collection = collection;
    this.clock = clock;
  }

  async append(rates: readonly FxRate[]): Promise<number> {
    if (rates.length === 0) return 0;
    const now = this.clock.now();
    const operations: AnyBulkWriteOperation<FxRateDocument>[] = rates.map((rate) => ({
      updateOne: {
        filter: { base: rate.base, quote: rate.quote, date: rate.date },
        update: { $setOnInsert: fxRateMapper.toDocument(rate, now) },
        upsert: true,
      },
    }));
    const result = await (await this.collection()).bulkWrite(operations, { ordered: false });
    return result.upsertedCount;
  }

  async latestDate(): Promise<string | null> {
    const latest = await withReadRetry(async () => (await this.collection()).findOne({}, { sort: { date: -1 }, projection: { date: 1 } }));
    return latest?.date ?? null;
  }

  async between(from: string, to: string): Promise<FxRate[]> {
    const documents = await withReadRetry(async () =>
      (await this.collection()).find({ date: { $gte: from, $lte: to } }).sort({ date: 1 }).toArray(),
    );
    return documents.map((document) => fxRateMapper.toDomain(document));
  }
}
