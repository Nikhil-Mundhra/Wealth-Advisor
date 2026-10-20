import type { AssetClass } from '@wealth-advisor/rules';

// One color per asset class, shared by every allocation visual: ten theme colors,
// one for each class, so no two classes share a color.
export const CLASS_CHART: Record<AssetClass, string> = {
  EQUITY_GLOBAL: 'bg-chart-5',
  EQUITY_US: 'bg-chart-3',
  EQUITY_INDIA: 'bg-chart-7',
  EQUITY_UAE: 'bg-chart-6',
  FIXED_INCOME_GOV: 'bg-chart-1',
  FIXED_INCOME_CORP: 'bg-chart-9',
  SUKUK_SOVEREIGN: 'bg-chart-2',
  SUKUK_CORP: 'bg-chart-8',
  MONEY_MARKET: 'bg-chart-10',
  FX_HEDGE: 'bg-chart-4',
};
