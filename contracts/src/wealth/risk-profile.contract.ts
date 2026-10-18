import { z } from 'zod';
import { ProfilingAnswersSchema, ProfileSummarySchema } from '../profiling/profile-answers.contract.ts';

export const SaveRiskProfileRequest = ProfilingAnswersSchema;
export type SaveRiskProfileRequest = z.infer<typeof SaveRiskProfileRequest>;

export const RiskProfileResponse = z.object({
  tenantId: z.string(),
  userId: z.string(),
  answers: ProfilingAnswersSchema,
  summary: ProfileSummarySchema,
  updatedAt: z.string(),
});
export type RiskProfileResponse = z.infer<typeof RiskProfileResponse>;
