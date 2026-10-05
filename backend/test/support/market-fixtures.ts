import { readFileSync } from 'node:fs';
import type { Currency } from '@wealth-advisor/rules';
import type { HttpClient } from '#core/http-client/http-client.ts';
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
