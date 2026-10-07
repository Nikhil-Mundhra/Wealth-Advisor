// The market module's surface for other modules (docs/backend/module-dependencies.md); nothing else is importable.
export type { MarketApi, ConvertInput, QuotesResult, RatesResult, RefreshResult } from './market.api.ts';
export type { ConversionItem, ConversionResult } from './domain/convert.ts';
export { Money } from './domain/money.vo.ts';
export type { MoneyValue } from './domain/money.vo.ts';
export type { Price } from './domain/price.vo.ts';
export type { ConversionMode, Valuation } from './domain/valuation.vo.ts';
export { CONVERSION_MODES } from './domain/valuation.vo.ts';
export { TRACKED_SYMBOLS, type TrackedSymbol } from './domain/tracked-symbols.ts';
