import type { MarketSnapshot } from '../domain/market-snapshot.vo.ts';

// One snapshot per asOf: upsert replaces the stored one, so recomputing a data date (a redelivered event, or a
// later backfill of older closes) converges on the latest computation instead of piling up versions.
export interface SnapshotRepository {
  upsert(snapshot: MarketSnapshot): Promise<void>;
  latest(): Promise<MarketSnapshot | null>;
  at(asOf: string): Promise<MarketSnapshot | null>;
}
