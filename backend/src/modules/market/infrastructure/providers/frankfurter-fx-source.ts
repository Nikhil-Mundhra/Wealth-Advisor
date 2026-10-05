import { z } from 'zod';
import { isCurrency, MARKET_PROVIDER_TIMEOUT_MS } from '@wealth-advisor/rules';
import type { HttpClient } from '#core/http-client/http-client.ts';
import type { FxSource } from '../../application/ports.ts';
import { FxRate } from '../../domain/fx-rate.vo.ts';
import { callProvider, fromProvider } from './provider-call.ts';

export const FRANKFURTER = 'frankfurter';
// v1 serves ECB reference rates only (business days, no weekends); /v2 blends other providers and fills weekends.
export const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1';
const SOURCE = 'frankfurter:ecb';

// GET /v1/{from}..{to}?base=EUR&symbols=USD,GBP (verified 2026-10): { amount, base, start_date, end_date,
// rates: { "2025-01-03": { "USD": 1.0299 } } }. A start on a non-publishing day snaps back to the previous one.
const RangeBody = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
});

export interface FrankfurterConfig {
  readonly http: HttpClient;
  readonly baseUrl?: string;
}

// Free and unmetered, so no request budget.
export function createFrankfurterFxSource(config: FrankfurterConfig): FxSource {
  const baseUrl = config.baseUrl ?? FRANKFURTER_BASE_URL;
  return {
    async fetchRange(base, quotes, from, to) {
      const params = new URLSearchParams({ base, symbols: quotes.join(',') });
      const url = `${baseUrl}/${from}..${to}?${params.toString()}`;
      const body = await callProvider(FRANKFURTER, () => config.http.getJson(url, { timeoutMs: MARKET_PROVIDER_TIMEOUT_MS }), RangeBody);
      return fromProvider(FRANKFURTER, () =>
        Object.entries(body.rates).flatMap(([date, byQuote]) =>
          Object.entries(byQuote).flatMap(([quote, rate]) =>
            isCurrency(quote) && quote !== base ? [FxRate.of({ base, quote, date, rate, source: SOURCE })] : [],
          ),
        ),
      );
    },
  };
}
