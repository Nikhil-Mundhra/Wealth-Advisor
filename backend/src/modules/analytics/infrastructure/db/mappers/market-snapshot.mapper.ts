import { MarketSnapshot } from '../../../domain/market-snapshot.vo.ts';
import type { MarketSnapshotDocument } from '../documents/market-snapshot.document.ts';

export const marketSnapshotMapper = {
  toDocument(snapshot: MarketSnapshot): MarketSnapshotDocument {
    return {
      asOf: snapshot.asOf,
      symbols: [...snapshot.symbols],
      means: [...snapshot.means],
      volatilities: [...snapshot.volatilities],
      covariance: snapshot.covariance.map((row) => [...row]),
      window: { ...snapshot.window },
      computedAt: snapshot.computedAt,
    };
  },

  toDomain(document: MarketSnapshotDocument): MarketSnapshot {
    return MarketSnapshot.of({
      asOf: document.asOf,
      symbols: document.symbols,
      means: document.means,
      volatilities: document.volatilities,
      covariance: document.covariance,
      window: { from: document.window.from, to: document.window.to, observations: document.window.observations },
      computedAt: document.computedAt,
    });
  },
};
