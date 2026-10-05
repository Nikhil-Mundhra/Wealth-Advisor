import { TRADING_DAYS_PER_YEAR } from '@wealth-advisor/rules';
import { invariant } from '#core/domain/invariant.ts';
import { AnalyticsErrors } from './errors/analytics-errors.ts';

export interface PricePoint {
  readonly symbol: string;
  readonly date: string;
  readonly value: number;
}

// values[i] is the series of symbols[i], one entry per date in `dates` (ascending).
export interface AlignedSeries {
  readonly symbols: readonly string[];
  readonly dates: readonly string[];
  readonly values: readonly (readonly number[])[];
}

// Keeps only the dates on which every symbol has a price. A date one symbol lacks (a holiday on its exchange, a
// missing provider row) is dropped for all, so each return spans the same two dates in every series and the
// covariance compares like with like.
export function alignSeries(points: readonly PricePoint[], symbols: readonly string[]): AlignedSeries {
  const bySymbol = new Map(symbols.map((symbol) => [symbol, new Map<string, number>()]));
  for (const point of points) bySymbol.get(point.symbol)?.set(point.date, point.value);
  const series = [...bySymbol.values()];
  const candidates = [...new Set(points.map((point) => point.date))].sort();
  const dates = symbols.length === 0 ? [] : candidates.filter((date) => series.every((prices) => prices.has(date)));
  return { symbols: [...symbols], dates, values: series.map((prices) => dates.map((date) => prices.get(date) as number)) };
}

// Daily log returns ln(p[t] / p[t-1]); one fewer than the prices.
export function logReturns(prices: readonly number[]): number[] {
  invariant(
    prices.every((price) => Number.isFinite(price) && price > 0),
    () => AnalyticsErrors.invariantViolated('log returns need finite positive prices'),
  );
  return prices.slice(1).map((price, index) => Math.log(price / prices[index]));
}

// Mean daily log return × trading days: log returns add over time, so the yearly figure is a plain multiple.
export function annualizedMean(returns: readonly number[]): number {
  invariant(returns.length > 0, () => AnalyticsErrors.invariantViolated('a mean needs at least one return'));
  return (returns.reduce((sum, value) => sum + value, 0) / returns.length) * TRADING_DAYS_PER_YEAR;
}
