import { z } from 'zod';

export const PlanSnapshotDto = z.object({
  recommendedWeights: z.record(z.string(), z.number()),
  currentWeights: z.record(z.string(), z.number()),
  threePillarRationale: z.object({
    personalFinance: z.string(),
    crossBorder: z.string(),
    wealthStrategy: z.string(),
  }),
  stressTestScenario: z.object({
    fxShockPercent: z.number(),
    estimatedDrawdownPercent: z.number(),
  }),
});
export type PlanSnapshotDto = z.infer<typeof PlanSnapshotDto>;

export const CreateShareLinkRequest = z.object({
  privacyMasked: z.boolean().default(true),
  ttlHours: z.number().int().positive().max(720).default(72),
});
export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkRequest>;

export const CreateShareLinkResponse = z.object({
  shareToken: z.string(),
  url: z.string(),
  expiresAt: z.string(),
});
export type CreateShareLinkResponse = z.infer<typeof CreateShareLinkResponse>;

export const SharedPlanResponse = z.object({
  shareToken: z.string(),
  ownerDisplayName: z.string(),
  privacyMasked: z.boolean(),
  planSnapshot: PlanSnapshotDto,
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type SharedPlanResponse = z.infer<typeof SharedPlanResponse>;
