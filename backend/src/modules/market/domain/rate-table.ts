import type { Currency } from '@wealth-advisor/rules';
import { type Ratio, divide, ratioOf } from './decimal.ts';
import type { FxRate } from './fx-rate.vo.ts';

// A rate usable for one conversion: units of `to` per one unit of `from`, from the latest publication on or
// before the asked day. A crossed rate is dated by its older leg.
export interface RateQuote {
  readonly rate: Ratio;
  readonly date: string;
  readonly source: string;
}

export interface RateTable {
  lookup(from: Currency, to: Currency, onOrBefore: string): RateQuote | null;
}

interface Published {
  readonly date: string;
  readonly rate: Ratio;
  readonly source: string;
}

const ONE: Ratio = { num: 1n, den: 1n };

// Resolves a pair directly, inverted, or crossed through any stored base (in practice EUR, the ECB's base).
export function createRateTable(rates: readonly FxRate[]): RateTable {
  const series = indexByPair(rates);
  const bases = [...new Set(rates.map((rate) => rate.base))];
  const latest = (base: Currency, quote: Currency, day: string) => latestOnOrBefore(series.get(pairKey(base, quote)), day);

  return {
    lookup(from, to, onOrBefore) {
      if (from === to) return { rate: ONE, date: onOrBefore, source: 'identity' };
      const direct = latest(from, to, onOrBefore);
      if (direct) return direct;
      const inverse = latest(to, from, onOrBefore);
      if (inverse) return { ...inverse, rate: divide(ONE, inverse.rate) };
      for (const pivot of bases) {
        const toFrom = latest(pivot, from, onOrBefore);
        const toTo = latest(pivot, to, onOrBefore);
        if (toFrom && toTo) return crossed(toFrom, toTo);
      }
      return null;
    },
  };
}

function crossed(pivotToFrom: Published, pivotToTo: Published): RateQuote {
  const sources = new Set([pivotToFrom.source, pivotToTo.source]);
  return {
    rate: divide(pivotToTo.rate, pivotToFrom.rate),
    date: pivotToFrom.date < pivotToTo.date ? pivotToFrom.date : pivotToTo.date,
    source: [...sources].join('+'),
  };
}

function pairKey(base: Currency, quote: Currency): string {
  return `${base}/${quote}`;
}

function indexByPair(rates: readonly FxRate[]): Map<string, Published[]> {
  const series = new Map<string, Published[]>();
  for (const rate of rates) {
    const key = pairKey(rate.base, rate.quote);
    series.set(key, [...(series.get(key) ?? []), { date: rate.date, rate: ratioOf(rate.rate), source: rate.source }]);
  }
  for (const list of series.values()) list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return series;
}

// Binary search over a date-sorted series.
function latestOnOrBefore(list: readonly Published[] | undefined, day: string): Published | null {
  if (!list) return null;
  let low = 0;
  let high = list.length - 1;
  let found: Published | null = null;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (list[middle].date <= day) {
      found = list[middle];
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}
