import type { SnapshotResponse } from '@wealth-advisor/contracts';
import type { MarketSnapshot } from '../../domain/market-snapshot.vo.ts';

export function toSnapshotResponse(snapshot: MarketSnapshot): SnapshotResponse {
  return {
    asOf: snapshot.asOf,
    symbols: [...snapshot.symbols],
    means: [...snapshot.means],
    volatilities: [...snapshot.volatilities],
    covariance: snapshot.covariance.map((row) => [...row]),
    window: { ...snapshot.window },
    computedAt: snapshot.computedAt.toISOString(),
  };
}
