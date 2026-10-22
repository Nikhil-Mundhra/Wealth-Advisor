import type { ObjectId } from 'mongodb';
import type { SharedPlanDocument } from '../infrastructure/db/documents/shared-plan.document.ts';

export interface SharedPlanRepository {
  findByToken(token: string): Promise<SharedPlanDocument | null>;
  create(plan: Omit<SharedPlanDocument, '_id'>): Promise<SharedPlanDocument>;
  listByTarget(tenantId: ObjectId, userId: ObjectId): Promise<SharedPlanDocument[]>;
  revoke(tenantId: ObjectId, shareToken: string, revokedAt: Date): Promise<SharedPlanDocument | null>;
}
