import { z } from 'zod';
import { CURRENCIES, HOUSEHOLD_MODES } from '@wealth-advisor/rules';

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
  runwayMonths: z.number(),
  runwayBand: z.enum(RUNWAY_BANDS),
  reserveMultiplier: z.number(),
  remittanceCorridors: z.array(RemittanceCorridorSummary),
});
export type CashflowSummaryResponse = z.infer<typeof CashflowSummaryResponse>;
