import { z } from 'zod';
import { CURRENCIES, HOUSEHOLD_MODES } from '@wealth-advisor/rules';
import { HouseholdModeField } from '../fields/household-mode.field.ts';

export const CashflowQuery = z.object({
  householdMode: HouseholdModeField.default('FAMILY_HOUSEHOLD'),
});
export type CashflowQuery = z.infer<typeof CashflowQuery>;

export const RUNWAY_BANDS = ['critical', 'warning', 'healthy'] as const;

export const RemittanceCorridorSummary = z.object({
  corridor: z.string(), // e.g. "EUR_CNY"
  sourceCurrency: z.enum(CURRENCIES),
  targetCurrency: z.enum(CURRENCIES),
  monthlyTargetAmount: z.number().int(),
  monthlyBaseEquivalent: z.number().int(),
  lastRate: z.number(),
  recipientName: z.string(),
});
export type RemittanceCorridorSummary = z.infer<typeof RemittanceCorridorSummary>;

export const CashflowSummaryResponse = z.object({
  baseCurrency: z.enum(CURRENCIES),
  householdMode: z.enum(HOUSEHOLD_MODES),
  monthlyInflowBase: z.number().int(),
  monthlyOutflowBase: z.number().int(),
  netCashflowBase: z.number().int(),
  totalLiquidReservesBase: z.number().int(),
  // Accounts no rate could value today. They are left out of totalLiquidReservesBase, so runway is a floor, not a
  // whole picture, whenever this is above zero.
  unvaluedAccountCount: z.number().int(),
  runwayMonths: z.number(),
  runwayBand: z.enum(RUNWAY_BANDS),
  reserveMultiplier: z.number(),
  remittanceCorridors: z.array(RemittanceCorridorSummary),
});
export type CashflowSummaryResponse = z.infer<typeof CashflowSummaryResponse>;
