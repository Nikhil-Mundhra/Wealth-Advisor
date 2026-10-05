import { FX_LOOKBACK_DAYS } from '@wealth-advisor/rules';
import { addDays } from '#core/time/calendar-date.ts';
import type { ConversionItem } from '../domain/convert.ts';
import type { ConversionMode } from '../domain/valuation.vo.ts';
import type { DateRange } from './refresh-range.ts';

// The stored rates a conversion can need: back far enough before its earliest rate day to reach the last
// publication before a weekend or holiday. Null when no rate is needed.
export function rateWindow(items: readonly ConversionItem[], mode: ConversionMode, today: string): DateRange | null {
  if (mode === 'raw' || items.length === 0) return null;
  const days = mode === 'spot' ? [today] : items.map((item) => item.date);
  const first = days.reduce((a, b) => (a < b ? a : b));
  const last = days.reduce((a, b) => (a > b ? a : b));
  return { from: addDays(first, -FX_LOOKBACK_DAYS), to: last };
}
