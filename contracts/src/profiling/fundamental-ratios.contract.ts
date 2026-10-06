import { z } from 'zod';

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
  tacticalTilt: z.enum(['TRIM', 'NEUTRAL', 'ACCUMULATE']),
  bondGrade: z.enum(['INVESTMENT_GRADE', 'VULNERABLE']).optional(),
  requiresFxHedge: z.boolean(),
  signal: z.enum(['favorable', 'neutral', 'caution']),
  clientSummaryKey: z.string(),
});
export type FundamentalEvaluationContract = z.infer<typeof FundamentalEvaluationSchema>;
