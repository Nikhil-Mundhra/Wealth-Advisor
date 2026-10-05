import type { AssetClass } from '@wealth-advisor/rules';

// One color per asset class, shared by every allocation visual.
export const CLASS_CHART: Record<AssetClass, string> = {
  EQUITY_GLOBAL: 'bg-chart-5',
  EQUITY_US: 'bg-chart-3',
  FIXED_INCOME_GOV: 'bg-chart-1',
  MONEY_MARKET: 'bg-chart-2',
  FX_HEDGE: 'bg-chart-4',
};
