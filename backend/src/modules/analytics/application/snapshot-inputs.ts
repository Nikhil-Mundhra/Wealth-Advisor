import { SNAPSHOT_WINDOW_DAYS } from '@wealth-advisor/rules';
import { addDays } from '#core/time/calendar-date.ts';
import type { Price } from '../../market/public.ts';
import type { PricePoint } from '../domain/returns.ts';

// step: the calendar window of closes a snapshot for asOf reads, both ends inclusive.
export function snapshotWindow(asOf: string): { readonly from: string; readonly to: string } {
  return { from: addDays(asOf, -SNAPSHOT_WINDOW_DAYS), to: asOf };
}

// step: one point per close, on one price basis per symbol. The adjusted close folds splits and dividends into the
// price, so its log return is the total return; a symbol uses it only when every close in the window has one,
// because switching basis mid-series turns the cumulative adjustment into a fake one-day return. Amounts stay in
// minor units: a log return is a ratio, so the unit cancels.
export function toPricePoints(prices: readonly Price[]): PricePoint[] {
  const partiallyAdjusted = new Set(prices.filter((price) => price.adjClose === null).map((price) => price.symbol));
  return prices.map((price) => ({
    symbol: price.symbol,
    date: price.date,
    value: (partiallyAdjusted.has(price.symbol) ? price.close : (price.adjClose ?? price.close)).amount,
  }));
}
