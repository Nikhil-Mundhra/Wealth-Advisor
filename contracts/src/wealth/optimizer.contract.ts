import { z } from 'zod';
import { HouseholdModeField } from '../fields/household-mode.field.ts';

export const RebalanceActionDto = z.object({
  assetSymbol: z.string(),
  action: z.enum(['BUY', 'SELL']),
  amountBase: z.number().int(), // minor units
  targetWeight: z.number(), // 0 - 1
});
export type RebalanceActionDto = z.infer<typeof RebalanceActionDto>;

export const OptimizePortfolioRequest = z.object({
  householdMode: HouseholdModeField.optional(),
  statedRiskScore: z.number().min(1).max(10).optional(),
});
export type OptimizePortfolioRequest = z.infer<typeof OptimizePortfolioRequest>;

export const RebalanceProposalResponse = z.object({
  effectiveRiskScore: z.number(),
  currentWeights: z.record(z.string(), z.number()),
  targetWeights: z.record(z.string(), z.number()),
  driftPercentages: z.record(z.string(), z.number()),
  actions: z.array(RebalanceActionDto),
  rationale: z.object({
    personalFinance: z.string(),
    crossBorder: z.string(),
    wealthStrategy: z.string(),
  }),
});
export type RebalanceProposalResponse = z.infer<typeof RebalanceProposalResponse>;
