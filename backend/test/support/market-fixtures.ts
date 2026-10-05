import { readFileSync } from 'node:fs';
import type { Currency } from '@wealth-advisor/rules';
import type { HttpClient } from '#core/http-client/http-client.ts';
import { addDays } from '#core/time/calendar-date.ts';
import { FxRate } from '../../src/modules/market/domain/fx-rate.vo.ts';
import { Money } from '../../src/modules/market/domain/money.vo.ts';
import { Price } from '../../src/modules/market/domain/price.vo.ts';

// Marketstack pages are trimmed to the documented v2 /eod shape (no live key in development: values are
// representative, the shape is verified); Frankfurter files are recorded responses.
export function marketFixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../fixtures/market/${name}`, import.meta.url), 'utf8')) as unknown;
}

export function ecbRate(quote: Currency, date: string, rate: number): FxRate {
  return FxRate.of({ base: 'EUR', quote, date, rate, source: 'frankfurter:ecb' });
}

export function usdClose(symbol: string, date: string, cents: number): Price {
  return Price.of({ symbol, date, close: Money.of(cents, 'USD'), adjClose: Money.of(cents, 'USD'), source: 'test' });
}

// Answers provider URLs from fixtures by path and query; records every URL it served.
export function fixtureHttp(answer: (url: URL) => unknown): HttpClient & { readonly urls: URL[] } {
  const urls: URL[] = [];
  return {
    urls,
    async getJson(url) {
      const parsed = new URL(url);
      urls.push(parsed);
      return answer(parsed);
    },
  };
}

export function weekdays(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(day);
  }
  return days;
}

// A Marketstack /v2/eod page for any symbols and range: one row per symbol per weekday, honouring limit and
// offset like the provider. A close depends only on (symbol, date), so overlapping refreshes agree on every fact;
// two sine terms per symbol keep the series uncorrelated enough for a non-degenerate covariance.
export function syntheticEodPage(url: URL): unknown {
  const symbols = (url.searchParams.get('symbols') ?? '').split(',');
  const rows = weekdays(url.searchParams.get('date_from') ?? '', url.searchParams.get('date_to') ?? '').flatMap((date) =>
    symbols.map((symbol, s) => {
      const day = Date.parse(`${date}T00:00:00Z`) / 86_400_000;
      const close = Math.round(100 * (s + 1) * Math.exp(0.08 * Math.sin(day * 0.21 + s) + 0.04 * Math.sin(day * 0.033 * (s + 1))) * 100) / 100;
      return { symbol, date: `${date}T00:00:00+0000`, close, adj_close: close, price_currency: 'usd' };
    }),
  );
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number(url.searchParams.get('limit') ?? '1000');
  const data = rows.slice(offset, offset + limit);
  return { pagination: { limit, offset, count: data.length, total: rows.length }, data };
}
