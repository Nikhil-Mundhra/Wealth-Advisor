import { MARKET_HISTORY_DAYS } from '@wealth-advisor/rules';
import { addDays, type DateRange, maxDate, minDate } from '#core/time/calendar-date.ts';
import type { Price } from '../domain/price.vo.ts';

export type { DateRange } from '#core/time/calendar-date.ts';

// Starts at the oldest "last stored day" across every tracked symbol and the FX series, inclusive, so a day the
// provider had only partly published is fetched again (append ignores what is already stored). Anything missing
// means a full backfill; the start never reaches past the provider's one year of history.
export function refreshRange(latest: readonly Price[], fxLatest: string | null, symbols: readonly string[], asOf: string): DateRange {
  const earliest = addDays(asOf, -MARKET_HISTORY_DAYS);
  const stored = new Map(latest.map((price) => [price.symbol, price.date]));
  if (fxLatest === null || symbols.some((symbol) => !stored.has(symbol))) return { from: earliest, to: asOf };
  const oldest = minDate([fxLatest, ...stored.values()]) ?? earliest;
  return { from: oldest < earliest ? earliest : oldest, to: asOf };
}

export function latestDate(prices: readonly Price[]): string | null {
  return maxDate(prices.map((price) => price.date));
}
