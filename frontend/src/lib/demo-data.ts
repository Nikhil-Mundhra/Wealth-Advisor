import type { AssetClass, Currency, HouseholdMode, PermissionTier } from '@wealth-advisor/rules';

// Elena's fixture standing in for the Phase 2 finance/wealth endpoints; replaced by API hooks once they land.
export interface DemoAccount {
  id: string;
  label: string;
  currency: Currency;
  balance: number;
}

export interface DemoHolding {
  assetClass: AssetClass;
  label: string;
  weight: number;
  valueEur: number;
}

export interface DemoRemittance {
  corridor: string;
  amount: string;
  note: string;
}

export const DEMO_HOUSEHOLD: HouseholdMode = 'FAMILY_HOUSEHOLD';
export const DEMO_NET_WORTH_EUR = 95000;
export const DEMO_BASELINE: Currency = 'EUR';
export const DEMO_RUNWAY_MONTHS = 3.2;

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'eu-current', label: 'EU Current', currency: 'EUR', balance: 7500 },
  { id: 'uk-current', label: 'UK Current', currency: 'GBP', balance: 3000 },
  { id: 'sg-savings', label: 'SG Family Savings', currency: 'SGD', balance: 4800 },
];

export const DEMO_HOLDINGS: DemoHolding[] = [
  { assetClass: 'EQUITY_US', label: 'US Tech Equities', weight: 60, valueEur: 57000 },
  { assetClass: 'FIXED_INCOME_GOV', label: 'EU Corporate Bonds', weight: 25, valueEur: 23750 },
  { assetClass: 'MONEY_MARKET', label: 'Euro Cash', weight: 15, valueEur: 14250 },
];

// Post-squeeze proposal: 20pts of US equities move into money-market and euro cash buffers.
export const DEMO_TARGET_WEIGHTS: Record<AssetClass, number> = {
  EQUITY_GLOBAL: 0,
  EQUITY_US: 40,
  FIXED_INCOME_GOV: 25,
  MONEY_MARKET: 25,
  FX_HEDGE: 10,
};

export const DEMO_REMITTANCES: DemoRemittance[] = [
  { corridor: 'EUR → CNY', amount: '¥25,000', note: 'Monthly family support' },
  { corridor: 'GBP → SGD', amount: 'S$4,800', note: 'Joint reserve top-up' },
];

export interface DemoLedgerEntry {
  digest: string;
  action: string;
  tier: PermissionTier;
  at: string;
}

// Sandbox executions; the real digest formula lives in the Phase 2 ledger module.
export const DEMO_LEDGER: DemoLedgerEntry[] = [
  { digest: '9f2c41ab…e7', action: 'Rebalance 20% US equities → money market', tier: 'TIER_3_EXECUTE', at: '2026-09-30 18:42 UTC' },
  { digest: '41bd09cc…12', action: 'Simulate −5% EUR shock', tier: 'TIER_2_SIMULATE', at: '2026-09-30 18:15 UTC' },
];
