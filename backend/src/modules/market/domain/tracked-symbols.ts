import { type AssetClass, CURRENCIES, type Currency } from '@wealth-advisor/rules';

export interface TrackedSymbol {
  readonly symbol: string;
  readonly assetClass: AssetClass;
}

// US-listed ETFs, one or two per asset class, all priced in USD. Six symbols fit one Marketstack page per
// ~160 trading days, so a one-year backfill costs two requests and a daily refresh one.
export const TRACKED_SYMBOLS: readonly TrackedSymbol[] = [
  { symbol: 'VT', assetClass: 'EQUITY_GLOBAL' },
  { symbol: 'VOO', assetClass: 'EQUITY_US' },
  { symbol: 'IEF', assetClass: 'FIXED_INCOME_GOV' },
  { symbol: 'SHY', assetClass: 'FIXED_INCOME_GOV' },
  { symbol: 'SHV', assetClass: 'MONEY_MARKET' },
  { symbol: 'UUP', assetClass: 'FX_HEDGE' },
];

export const TRACKED_SYMBOL_NAMES: readonly string[] = TRACKED_SYMBOLS.map((tracked) => tracked.symbol);

// The ECB publishes every reference rate against EUR; other pairs are crossed through it.
export const FX_BASE: Currency = 'EUR';
export const FX_QUOTES: readonly Currency[] = CURRENCIES.filter((currency) => currency !== FX_BASE);

export function assetClassOf(symbol: string): AssetClass | null {
  return TRACKED_SYMBOLS.find((tracked) => tracked.symbol === symbol)?.assetClass ?? null;
}
