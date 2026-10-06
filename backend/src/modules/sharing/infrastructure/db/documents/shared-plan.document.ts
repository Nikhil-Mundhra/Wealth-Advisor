import type { ObjectId } from 'mongodb';
import type { PlanSnapshotDto } from '@wealth-advisor/contracts';

export const SHARED_PLANS_COLLECTION = 'shared_plans';

export interface SharedPlanDocument {
  _id: ObjectId;
  shareToken: string;
  tenantId: ObjectId;
  userId: ObjectId;
  ownerDisplayName: string;
  privacyMasked: boolean;
  planSnapshot: PlanSnapshotDto;
  passphraseHash: string | null;
  expiresAt: Date;
  createdAt: Date;
}
