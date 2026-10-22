import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { SHARED_PLANS_COLLECTION } from '../documents/shared-plan.document.ts';

export const sharingCollections: readonly CollectionDefinition[] = [
  {
    name: SHARED_PLANS_COLLECTION,
    indexes: [
      { key: { shareToken: 1 }, name: 'uk_shared_plans_token', unique: true },
      { key: { tenantId: 1, userId: 1, createdAt: -1 }, name: 'idx_shared_plans_tenant_user_created' },
      { key: { expiresAt: 1 }, name: 'idx_shared_plans_expires', expireAfterSeconds: 0 },
    ],
  },
];
