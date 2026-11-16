import type { ObjectId } from 'mongodb';
import type { ProfileSummaryData, ProfilingAnswersInput } from '@wealth-advisor/rules';

export const RISK_PROFILES_COLLECTION = 'risk_profiles';

export interface RiskProfileDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  answers: ProfilingAnswersInput;
  summary: ProfileSummaryData;
  createdAt: Date;
  updatedAt: Date;
}
