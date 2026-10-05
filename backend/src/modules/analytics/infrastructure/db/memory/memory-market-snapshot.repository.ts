import type { SnapshotRepository } from '../../../application/ports.ts';
import type { MarketSnapshot } from '../../../domain/market-snapshot.vo.ts';

// SnapshotRepository in process memory; keyed by asOf like the unique index, last write wins.
export class MemoryMarketSnapshotRepository implements SnapshotRepository {
  private readonly snapshots = new Map<string, MarketSnapshot>();

  async upsert(snapshot: MarketSnapshot): Promise<void> {
    this.snapshots.set(snapshot.asOf, snapshot);
  }

  async latest(): Promise<MarketSnapshot | null> {
    const asOf = [...this.snapshots.keys()].sort().at(-1);
    return asOf ? (this.snapshots.get(asOf) ?? null) : null;
  }

  async at(asOf: string): Promise<MarketSnapshot | null> {
    return this.snapshots.get(asOf) ?? null;
  }
}
