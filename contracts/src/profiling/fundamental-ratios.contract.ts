import { z } from 'zod';
import { BOND_SOLVENCY_GRADES, FUNDAMENTAL_SIGNALS, TACTICAL_TILTS } from '@wealth-advisor/rules';

export const AssetFundamentalMetricsSchema = z.object({
  symbol: z.string().min(1),
  valuationPercentile5Y: z.number().min(0).max(100),
  interestCoverageRatio: z.number().optional(),
  netDebtToEbitda: z.number().optional(),
  foreignRevenueRatio: z.number().min(0).max(1),
  fcfPayoutRatio: z.number().optional(),
});
export type AssetFundamentalMetricsContract = z.infer<typeof AssetFundamentalMetricsSchema>;

export const FundamentalEvaluationSchema = z.object({
  symbol: z.string().min(1),
  tacticalTilt: z.enum(TACTICAL_TILTS),
  bondGrade: z.enum(BOND_SOLVENCY_GRADES).optional(),
  requiresFxHedge: z.boolean(),
  signal: z.enum(FUNDAMENTAL_SIGNALS),
  clientSummaryKey: z.string(),
});
export type FundamentalEvaluationContract = z.infer<typeof FundamentalEvaluationSchema>;
