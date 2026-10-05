import { CURRENCIES, type AssetClass, type Currency, FX_LOOKBACK_DAYS } from '@wealth-advisor/rules';
import type { EventBus } from '#core/events/event-bus.ts';
import { addDays, toIsoDate } from '#core/time/calendar-date.ts';
import type { Clock } from '#core/time/clock.ts';
import type { FxRateRepository, FxSource, PriceRepository, PriceSource } from './application/ports.ts';
import { publishRefreshed } from './application/publish-refreshed.ts';
import { rateWindow } from './application/rate-window.ts';
import { latestDate, refreshRange } from './application/refresh-range.ts';
import { type ConversionItem, type ConversionResult, convertBatch } from './domain/convert.ts';
import type { Price } from './domain/price.vo.ts';
import { toNumber } from './domain/decimal.ts';
import { createRateTable } from './domain/rate-table.ts';
import { FX_BASE, FX_QUOTES, TRACKED_SYMBOL_NAMES, TRACKED_SYMBOLS } from './domain/tracked-symbols.ts';
import type { ConversionMode } from './domain/valuation.vo.ts';

export interface MarketApiDeps {
  readonly prices: PriceRepository;
  readonly fxRates: FxRateRepository;
  readonly priceSource: PriceSource;
  readonly fxSource: FxSource;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface RefreshResult {
  readonly asOf: string;
  readonly pricesStored: number;
  readonly ratesStored: number;
  readonly from: string;
  readonly to: string;
}

export interface QuotesResult {
  readonly asOf: string | null;
  readonly quotes: readonly { readonly assetClass: AssetClass; readonly price: Price }[];
}

export interface RatesResult {
  readonly asOf: string | null;
  readonly base: Currency;
  readonly rates: readonly { readonly quote: Currency; readonly rate: number; readonly date: string; readonly source: string }[];
}

export interface ConvertInput {
  readonly items: readonly ConversionItem[];
  readonly target: Currency;
  readonly mode: ConversionMode;
}

export type MarketApi = ReturnType<typeof createMarketApi>;

export function createMarketApi(deps: MarketApiDeps) {
  const { prices, fxRates, priceSource, fxSource, events, clock } = deps;
  const today = () => toIsoDate(clock.now());

  return {
    // Fetches FX first: the ECB source is free, so its failure spends none of the metered price quota. Both
    // fetches finish before any write, so a provider failure stores nothing.
    async refresh(asOf: string): Promise<RefreshResult> {
      const range = refreshRange(await prices.latestPerSymbol(TRACKED_SYMBOL_NAMES), await fxRates.latestDate(), TRACKED_SYMBOL_NAMES, asOf);
      const fetchedRates = await fxSource.fetchRange(FX_BASE, FX_QUOTES, range.from, range.to);
      const fetchedPrices = await priceSource.fetchEndOfDay(TRACKED_SYMBOL_NAMES, range.from, range.to);
      const ratesStored = await fxRates.append(fetchedRates);
      const pricesStored = await prices.append(fetchedPrices);
      const dataAsOf = latestDate(await prices.latestPerSymbol(TRACKED_SYMBOL_NAMES)) ?? asOf;
      await publishRefreshed(events, clock, { asOf: dataAsOf, symbols: [...TRACKED_SYMBOL_NAMES], fxBase: FX_BASE });
      return { asOf: dataAsOf, pricesStored, ratesStored, ...range };
    },

    async quotes(): Promise<QuotesResult> {
      const latest = await prices.latestPerSymbol(TRACKED_SYMBOL_NAMES);
      const quotes = TRACKED_SYMBOLS.flatMap(({ symbol, assetClass }) => {
        const price = latest.find((candidate) => candidate.symbol === symbol);
        return price ? [{ assetClass, price }] : [];
      });
      return { asOf: latestDate(latest), quotes };
    },

    async history(symbols: readonly string[], from: string, to: string): Promise<Price[]> {
      return prices.history(symbols, from, to);
    },

    async rates(base: Currency, date: string = today()): Promise<RatesResult> {
      const table = createRateTable(await fxRates.between(addDays(date, -FX_LOOKBACK_DAYS), date));
      const rates = CURRENCIES.filter((quote) => quote !== base).flatMap((quote) => {
        const found = table.lookup(base, quote, date);
        return found ? [{ quote, rate: toNumber(found.rate), date: found.date, source: found.source }] : [];
      });
      return { asOf: rates.reduce<string | null>((max, rate) => (max === null || rate.date > max ? rate.date : max), null), base, rates };
    },

    async convert(input: ConvertInput): Promise<ConversionResult[]> {
      const window = rateWindow(input.items, input.mode, today());
      const rates = createRateTable(window ? await fxRates.between(window.from, window.to) : []);
      return convertBatch({ ...input, rates, today: today() });
    },
  };
}
