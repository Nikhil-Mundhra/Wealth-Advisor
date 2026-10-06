import { z } from 'zod';
import { HOUSEHOLD_MODES, LOCALES } from '@wealth-advisor/rules';

export const ActionCardDto = z.object({
  cardType: z.enum(['PROPOSAL', 'STRESS_TEST', 'RUNWAY_ALERT', 'PRODUCT_COMPARISON']),
  payload: z.record(z.string(), z.any()),
});
export type ActionCardDto = z.infer<typeof ActionCardDto>;

export const AdvisoryChatRequest = z.object({
  message: z.string().min(1).max(2000),
  locale: z.enum(LOCALES).optional().default('en'),
  householdMode: z.enum(HOUSEHOLD_MODES).optional().default('INDIVIDUAL'),
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
