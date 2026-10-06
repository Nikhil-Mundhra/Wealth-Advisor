import type { Currency } from '@wealth-advisor/rules';
import type { FxRate } from '../domain/fx-rate.vo.ts';
import type { Price } from '../domain/price.vo.ts';

// Dates are inclusive YYYY-MM-DD. Sources throw MarketErrors (MK_19xx) on any provider failure and return only
// after every page has arrived, so a failed fetch leaves nothing half-fetched for the caller to write.
export interface PriceSource {
  fetchEndOfDay(symbols: readonly string[], from: string, to: string): Promise<Price[]>;
}

export interface FxSource {
  fetchRange(base: Currency, quotes: readonly Currency[], from: string, to: string): Promise<FxRate[]>;
}

// Raw facts are append-only: append stores the facts not yet stored and ignores the rest (same key = same fact),
// returning how many it stored, so a re-run of the same range is harmless.
export interface PriceRepository {
  append(prices: readonly Price[]): Promise<number>;
  latestPerSymbol(symbols: readonly string[]): Promise<Price[]>;
  history(symbols: readonly string[], from: string, to: string): Promise<Price[]>;
}

export interface FxRateRepository {
  append(rates: readonly FxRate[]): Promise<number>;
  latestDate(): Promise<string | null>;
  between(from: string, to: string): Promise<FxRate[]>;
}
