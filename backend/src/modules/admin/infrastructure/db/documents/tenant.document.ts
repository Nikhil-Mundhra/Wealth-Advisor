import type { ObjectId } from 'mongodb';
import type { LlmProvider, TenantPlan, TenantStatus } from '@wealth-advisor/rules';

export const TENANTS_COLLECTION = 'tenants';

export interface TenantDocument {
  _id: ObjectId;
  slug: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  settings: {
    baselineCurrency: string;
    allowedCorridors: string[];
    defaultLlmProvider: LlmProvider;
    maxMembers: number;
    requirePasskeyForRebalance: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
