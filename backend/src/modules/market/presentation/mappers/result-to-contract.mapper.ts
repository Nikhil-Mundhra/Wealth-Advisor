import type { FxRatesResponse, QuotesResponse, RefreshResponse } from '@wealth-advisor/contracts';
import type { QuotesResult, RatesResult, RefreshResult } from '../../market.api.ts';

export function toQuotesResponse(result: QuotesResult): QuotesResponse {
  return {
    asOf: result.asOf,
    quotes: result.quotes.map(({ assetClass, price }) => ({
      symbol: price.symbol,
      assetClass,
      date: price.date,
      close: { ...price.close.value },
      source: price.source,
    })),
  };
}

export function toFxRatesResponse(result: RatesResult): FxRatesResponse {
  return {
    asOf: result.asOf,
    base: result.base,
    rates: result.rates.map((rate) => ({ ...rate })),
  };
}

export function toRefreshResponse(result: RefreshResult): RefreshResponse {
  return { ...result };
}
