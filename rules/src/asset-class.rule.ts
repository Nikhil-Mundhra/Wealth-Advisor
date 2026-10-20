// Portfolio building blocks: global, regional and dedicated fixed-income sleeves; single-name
// India/UAE equities, corporate bonds and sukuk carry reference prices until a live feed is wired.
// Rebalance drift corridor: 5% absolute drift triggers rebalance recommendations.
// Source: Vanguard Research (Zilbering et al. 2015) on rebalancing corridors balancing transaction drag vs risk tracking.
export const REBALANCE_DRIFT_CORRIDOR_PERCENT = 5;

export const ASSET_CLASSES = [
  'EQUITY_GLOBAL',
  'EQUITY_US',
  'EQUITY_INDIA',
  'EQUITY_UAE',
  'FIXED_INCOME_GOV',
  'FIXED_INCOME_CORP',
  'SUKUK_SOVEREIGN',
  'SUKUK_CORP',
  'MONEY_MARKET',
  'FX_HEDGE',
] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export function isAssetClass(value: string): value is AssetClass {
  return (ASSET_CLASSES as readonly string[]).includes(value);
}
