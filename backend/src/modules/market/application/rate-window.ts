import { FX_LOOKBACK_DAYS } from '@wealth-advisor/rules';
import { addDays, type DateRange, maxDate, minDate } from '#core/time/calendar-date.ts';
import type { ConversionItem } from '../domain/convert.ts';
import type { ConversionMode } from '../domain/valuation.vo.ts';

// The stored rates a conversion can need: back far enough before its earliest rate day to reach the last
// publication before a weekend or holiday. Null when no rate is needed.
export function rateWindow(items: readonly ConversionItem[], mode: ConversionMode, today: string): DateRange | null {
  if (mode === 'raw' || items.length === 0) return null;
  const days = mode === 'spot' ? [today] : items.map((item) => item.date);
  const first = minDate(days)!;
  const last = maxDate(days)!;
  return { from: addDays(first, -FX_LOOKBACK_DAYS), to: last };
}
