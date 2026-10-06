import {
  HOUSEHOLD_RESERVE_MULTIPLIER,
  type HouseholdMode,
  runwayBand,
  type RunwayBand,
} from '@wealth-advisor/rules';
import type { AccountDocument } from '../infrastructure/db/documents/account.document.ts';
import type { TransactionDocument } from '../infrastructure/db/documents/transaction.document.ts';

export interface BurnRateCalculationInput {
  householdMode: HouseholdMode;
  accounts: readonly AccountDocument[];
  transactions: readonly TransactionDocument[];
}

export interface BurnRateCalculationResult {
  monthlyInflowBase: number;
  monthlyOutflowBase: number;
  netCashflowBase: number;
  totalLiquidReservesBase: number;
  runwayMonths: number;
  runwayBand: RunwayBand;
  reserveMultiplier: number;
}

export function calculateBurnRate(input: BurnRateCalculationInput): BurnRateCalculationResult {
  const { householdMode, accounts, transactions } = input;
  const reserveMultiplier = HOUSEHOLD_RESERVE_MULTIPLIER[householdMode];

  let monthlyInflowBase = 0;
  let monthlyOutflowBase = 0;

  for (const tx of transactions) {
    if (tx.category.startsWith('INCOME')) {
      monthlyInflowBase += tx.convertedBaseAmount;
    } else {
      monthlyOutflowBase += tx.convertedBaseAmount;
    }
  }

  // Fallback defaults if no transactions logged yet
  if (monthlyInflowBase === 0 && monthlyOutflowBase === 0) {
    monthlyInflowBase = householdMode === 'INDIVIDUAL' ? 450000 : 1050000;
    monthlyOutflowBase = householdMode === 'INDIVIDUAL' ? 250000 : 540000;
  }

  const totalLiquidReservesBase = accounts.reduce((acc, a) => acc + a.balance, 0);
  const netCashflowBase = monthlyInflowBase - monthlyOutflowBase;

  // Monthly reserve needed incorporates household obligations
  const monthlyNeed = (monthlyOutflowBase * reserveMultiplier) / 2;
  const runwayMonths =
    monthlyNeed > 0
      ? Number((totalLiquidReservesBase / monthlyNeed).toFixed(1))
      : 24;

  return {
    monthlyInflowBase,
    monthlyOutflowBase,
    netCashflowBase,
    totalLiquidReservesBase,
    runwayMonths,
    runwayBand: runwayBand(runwayMonths),
    reserveMultiplier,
  };
}
