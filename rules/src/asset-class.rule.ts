// Portfolio building blocks; risk scores and volatilities arrive with the optimizer (Phase 2).
export const ASSET_CLASSES = ['EQUITY_GLOBAL', 'EQUITY_US', 'FIXED_INCOME_GOV', 'MONEY_MARKET', 'FX_HEDGE'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export function isAssetClass(value: string): value is AssetClass {
  return (ASSET_CLASSES as readonly string[]).includes(value);
}
