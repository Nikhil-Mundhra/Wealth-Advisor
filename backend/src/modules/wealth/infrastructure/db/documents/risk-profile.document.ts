import type { ObjectId } from 'mongodb';
import type { ProfileSummary, ProfilingAnswers } from '@wealth-advisor/contracts';

export const RISK_PROFILES_COLLECTION = 'risk_profiles';

export interface RiskProfileDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  answers: ProfilingAnswers;
  summary: ProfileSummary;
  createdAt: Date;
  updatedAt: Date;
}
