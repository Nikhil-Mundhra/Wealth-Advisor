import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { ACCOUNTS_COLLECTION } from '../documents/account.document.ts';
import { TRANSACTIONS_COLLECTION } from '../documents/transaction.document.ts';

export const financeCollections: readonly CollectionDefinition[] = [
  {
    name: ACCOUNTS_COLLECTION,
    indexes: [{ key: { tenantId: 1, userId: 1, currency: 1 }, name: 'idx_accounts_tenant_user_curr' }],
  },
  {
    name: TRANSACTIONS_COLLECTION,
    indexes: [
      { key: { tenantId: 1, userId: 1, timestamp: -1 }, name: 'idx_transactions_tenant_user_time' },
      { key: { tenantId: 1, userId: 1, category: 1, timestamp: -1 }, name: 'idx_transactions_category_time' },
    ],
  },
];
