import type { AssetClass } from '@wealth-advisor/rules';

// One color per asset class, shared by every allocation visual. Five theme colors cover ten
// classes: regional equities and sukuk sleeves reuse their nearest parent color.
export const CLASS_CHART: Record<AssetClass, string> = {
  EQUITY_GLOBAL: 'bg-chart-5',
  EQUITY_US: 'bg-chart-3',
  EQUITY_INDIA: 'bg-chart-3',
  EQUITY_UAE: 'bg-chart-5',
  FIXED_INCOME_GOV: 'bg-chart-1',
  FIXED_INCOME_CORP: 'bg-chart-1',
  SUKUK_SOVEREIGN: 'bg-chart-2',
  SUKUK_CORP: 'bg-chart-2',
  MONEY_MARKET: 'bg-chart-2',
  FX_HEDGE: 'bg-chart-4',
};
