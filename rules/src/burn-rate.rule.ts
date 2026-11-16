// Emergency-runway bands: critical below 3 months, warning up to 6, healthy above.
// Source: CFP Board Financial Planning Practice Guidelines (2022) and US Federal Reserve
// SHED benchmarks recommending 3 to 6 months of non-discretionary expenses in liquid reserves.
export const RUNWAY_CRITICAL_MONTHS = 3;
export const RUNWAY_HEALTHY_MONTHS = 6;

// Baseline monthly expenditure estimates (EUR) used when transaction feeds are absent.
export const DEFAULT_INDIVIDUAL_BURN_ESTIMATE = 2500;
export const DEFAULT_FAMILY_BURN_ESTIMATE = 5000;

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'MULTI_CURRENCY_WALLET', 'BROKERAGE_CASH'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_CATEGORIES = [
  'INCOME_SALARY',
  'INCOME_FREELANCE',
  'BILL_HOUSING',
  'BILL_UTILITIES',
  'EXPENSE_DISCRETIONARY',
  'FAMILY_REMITTANCE',
  'TUITION_FEE',
  'FX_CONVERSION',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface RemittanceMetadata {
  recipientCountry: string;
  destinationCurrency: string;
  exchangeRateApplied: number;
  feePaid: number;
}

export interface TuitionMetadata {
  institution: string;
  semesterDeadline: string;
  isLiquidityCarveOut: boolean;
}

export type RunwayBand = 'critical' | 'warning' | 'healthy';

export function runwayBand(months: number): RunwayBand {
  // Non-finite input is the worst case, never the best.
  if (!Number.isFinite(months) || months < RUNWAY_CRITICAL_MONTHS) return 'critical';
  if (months <= RUNWAY_HEALTHY_MONTHS) return 'warning';
  return 'healthy';
}
