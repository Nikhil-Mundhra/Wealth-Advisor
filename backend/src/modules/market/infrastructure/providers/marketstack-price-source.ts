import { z } from 'zod';
import {
  type Currency,
  isCurrency,
  MARKET_PROVIDER_TIMEOUT_MS,
  MARKETSTACK_MAX_PAGES,
  MARKETSTACK_MONTHLY_REQUEST_LIMIT,
  MARKETSTACK_PAGE_LIMIT,
} from '@wealth-advisor/rules';
import type { HttpClient } from '#core/http-client/http-client.ts';
import type { RequestBudget } from '#core/http-client/request-budget.ts';
import type { PriceSource } from '../../application/ports.ts';
import { MarketErrors } from '../../domain/errors/market-errors.ts';
import { Money } from '../../domain/money.vo.ts';
import { Price } from '../../domain/price.vo.ts';
import { callProvider, fromProvider } from './provider-call.ts';

export const MARKETSTACK = 'marketstack';
export const MARKETSTACK_BASE_URL = 'https://api.marketstack.com';

// GET /v2/eod (verified 2026-10): { pagination: { limit, offset, count, total }, data: [{ symbol, date
// "2025-01-03T00:00:00+0000", close, adj_close, price_currency "usd", … }] }. Only the fields read are checked.
const EodRow = z.object({
  symbol: z.string(),
  date: z.string().min(10),
  close: z.number(),
  adj_close: z.number().nullish(),
  price_currency: z.string().nullish(),
});
type EodRow = z.infer<typeof EodRow>;

const EodPage = z.object({
  pagination: z.object({ total: z.number().int().nonnegative() }),
  data: z.array(EodRow),
});

export interface MarketstackConfig {
  readonly accessKey: string | undefined;
  readonly http: HttpClient;
  readonly budget: RequestBudget;
  readonly baseUrl?: string;
}

// Every request, each page included, reserves one unit of the monthly budget first; a refused reservation stops
// before the request. A failed request keeps its reservation: the provider counts it too.
export function createMarketstackPriceSource(config: MarketstackConfig): PriceSource {
  const baseUrl = config.baseUrl ?? MARKETSTACK_BASE_URL;
  return {
    async fetchEndOfDay(symbols, from, to) {
      const accessKey = config.accessKey;
      if (!accessKey) throw MarketErrors.providerNotConfigured(MARKETSTACK);
      const prices: Price[] = [];
      for (let page = 0; page < MARKETSTACK_MAX_PAGES; page += 1) {
        if (!(await config.budget.reserve(MARKETSTACK, 1, MARKETSTACK_MONTHLY_REQUEST_LIMIT))) {
          throw MarketErrors.providerQuotaSpent(MARKETSTACK);
        }
        const url = eodUrl(baseUrl, { accessKey, symbols, from, to, offset: prices.length });
        const body = await callProvider(MARKETSTACK, () => config.http.getJson(url, { timeoutMs: MARKET_PROVIDER_TIMEOUT_MS }), EodPage);
        prices.push(...fromProvider(MARKETSTACK, () => body.data.map(toPrice)));
        if (body.data.length === 0 || prices.length >= body.pagination.total) return prices;
      }
      throw MarketErrors.providerUnavailable(MARKETSTACK, `pagination did not end within ${MARKETSTACK_MAX_PAGES} pages`);
    },
  };
}

interface EodQuery {
  readonly accessKey: string;
  readonly symbols: readonly string[];
  readonly from: string;
  readonly to: string;
  readonly offset: number;
}

function eodUrl(baseUrl: string, query: EodQuery): string {
  const params = new URLSearchParams({
    access_key: query.accessKey,
    symbols: query.symbols.join(','),
    date_from: query.from,
    date_to: query.to,
    sort: 'ASC',
    limit: String(MARKETSTACK_PAGE_LIMIT),
    offset: String(query.offset),
  });
  return `${baseUrl}/v2/eod?${params.toString()}`;
}

function toPrice(row: EodRow): Price {
  const currency = currencyOf(row);
  return Price.of({
    symbol: row.symbol,
    date: row.date.slice(0, 10),
    close: Money.fromMajor(row.close, currency),
    adjClose: row.adj_close == null ? null : Money.fromMajor(row.adj_close, currency),
    source: MARKETSTACK,
  });
}

// Tracked symbols are US-listed and trade in USD; a row without a currency is read as USD.
function currencyOf(row: EodRow): Currency {
  const code = (row.price_currency ?? 'USD').toUpperCase();
  if (!isCurrency(code)) throw MarketErrors.providerUnavailable(MARKETSTACK, `${row.symbol} is priced in unsupported ${code}`);
  return code;
}
