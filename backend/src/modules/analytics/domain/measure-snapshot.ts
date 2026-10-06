import { SNAPSHOT_MIN_OBSERVATIONS } from '@wealth-advisor/rules';
import { annualizedCovariance } from './covariance.ts';
import { MarketSnapshot } from './market-snapshot.vo.ts';
import { type AlignedSeries, annualizedMean, logReturns } from './returns.ts';

export type SnapshotMeasurement =
  | { readonly kind: 'measured'; readonly observations: number; readonly snapshot: MarketSnapshot }
  | { readonly kind: 'insufficient'; readonly observations: number };

// Aligned closes → snapshot, or `insufficient` (not a throw) when fewer than SNAPSHOT_MIN_OBSERVATIONS returns
// remain: too little data is an expected state of a young store, not a failure.
export function measureSnapshot(series: AlignedSeries, asOf: string, computedAt: Date): SnapshotMeasurement {
  const observations = Math.max(series.dates.length - 1, 0);
  if (observations < SNAPSHOT_MIN_OBSERVATIONS) return { kind: 'insufficient', observations };
  const returns = series.values.map(logReturns);
  const covariance = annualizedCovariance(returns);
  const snapshot = MarketSnapshot.of({
    asOf,
    symbols: series.symbols,
    means: returns.map(annualizedMean),
    volatilities: covariance.map((row, i) => Math.sqrt(row[i])),
    covariance,
    window: { from: series.dates[0], to: series.dates[series.dates.length - 1], observations },
    computedAt,
  });
  return { kind: 'measured', observations, snapshot };
}
