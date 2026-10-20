import { z } from 'zod';
import { ASSET_CLASSES, LOCALES } from '@wealth-advisor/rules';
import { CandidateSecurityTypeDto } from '../wealth/portfolio-construction.contract.ts';
import { HouseholdModeField } from '../fields/household-mode.field.ts';

export const ActionCardDto = z.object({
  cardType: z.enum(['PROPOSAL', 'STRESS_TEST', 'RUNWAY_ALERT', 'PRODUCT_COMPARISON', 'NOTICE']),
  payload: z.record(z.string(), z.any()),
});
export type ActionCardDto = z.infer<typeof ActionCardDto>;

// Multi-asset proposal holdings served on the PROPOSAL card: one entry per holding with its
// security type (STOCK | BOND | MUTUAL_FUND_ETF), asset class, and optimizer target weight.
export const ProposalHoldingDto = z.object({
  symbol: z.string(),
  name: z.string(),
  securityType: CandidateSecurityTypeDto,
  assetClass: z.enum(ASSET_CLASSES),
  weight: z.number(),
});
export type ProposalHoldingDto = z.infer<typeof ProposalHoldingDto>;

export const ProposalPayloadDto = z.object({
  holdings: z.array(ProposalHoldingDto),
  currentWeights: z.record(z.string(), z.number()),
  targetWeights: z.record(z.string(), z.number()),
  valuationTotalBase: z.number().int(),
});
export type ProposalPayloadDto = z.infer<typeof ProposalPayloadDto>;

export const AdvisoryChatRequest = z.object({
  message: z.string().min(1).max(2000),
  locale: z.enum(LOCALES).optional().default('en'),
  householdMode: HouseholdModeField.default('INDIVIDUAL'),
});
export type AdvisoryChatRequest = z.infer<typeof AdvisoryChatRequest>;

export const AdvisoryChatResponse = z.object({
  reply: z.string(),
  threePillarRationale: z.object({
    personalFinance: z.string(),
    crossBorder: z.string(),
    wealthStrategy: z.string(),
  }),
  actionCards: z.array(ActionCardDto),
  complianceDisclaimer: z.string(),
});
export type AdvisoryChatResponse = z.infer<typeof AdvisoryChatResponse>;
