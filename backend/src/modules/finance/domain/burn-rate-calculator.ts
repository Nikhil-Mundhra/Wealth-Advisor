import {
  HOUSEHOLD_RESERVE_MULTIPLIER,
  type HouseholdMode,
  runwayBand,
  type RunwayBand,
} from '@wealth-advisor/rules';
import type { TransactionDocument } from '../infrastructure/db/documents/transaction.document.ts';

export interface BurnRateCalculationInput {
  householdMode: HouseholdMode;
  // Liquid reserves in base minor units, already valued into one currency by the caller.
  totalLiquidReservesBase: number;
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

const MONTH_KEY = /^\d{4}-\d{2}/;

export function calculateBurnRate(input: BurnRateCalculationInput): BurnRateCalculationResult {
  const { householdMode, transactions } = input;
  const totalLiquidReservesBase = input.totalLiquidReservesBase;
  const reserveMultiplier = HOUSEHOLD_RESERVE_MULTIPLIER[householdMode];

  // One month's flows are the sum over the calendar months the transactions actually fall in, averaged over those
  // months. Averaging over elapsed time instead would divide a busy week by the months it does not cover and call the
  // result a month.
  const inflowByMonth = new Map<string, number>();
  const outflowByMonth = new Map<string, number>();
  for (const tx of transactions) {
    const month = MONTH_KEY.exec(tx.timestamp.toISOString())?.[0];
    if (!month) continue;
    const target = tx.category.startsWith('INCOME') ? inflowByMonth : outflowByMonth;
    target.set(month, (target.get(month) ?? 0) + tx.convertedBaseAmount);
  }
  const months = new Set([...inflowByMonth.keys(), ...outflowByMonth.keys()]);
  const divisor = Math.max(months.size, 1);

  let monthlyInflowBase = Math.round(mean(inflowByMonth, divisor));
  let monthlyOutflowBase = Math.round(mean(outflowByMonth, divisor));

  // Fallback defaults if no transactions logged yet
  if (monthlyInflowBase === 0 && monthlyOutflowBase === 0) {
    monthlyInflowBase = householdMode === 'INDIVIDUAL' ? 450000 : 1050000;
    monthlyOutflowBase = householdMode === 'INDIVIDUAL' ? 250000 : 540000;
  }

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

function mean(byMonth: Map<string, number>, divisor: number): number {
  let sum = 0;
  for (const value of byMonth.values()) sum += value;
  return sum / divisor;
}