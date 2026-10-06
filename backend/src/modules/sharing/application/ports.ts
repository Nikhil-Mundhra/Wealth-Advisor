import type { SharedPlanDocument } from '../infrastructure/db/documents/shared-plan.document.ts';

export interface SharedPlanRepository {
  findByToken(token: string): Promise<SharedPlanDocument | null>;
  create(plan: Omit<SharedPlanDocument, '_id'>): Promise<SharedPlanDocument>;
}
