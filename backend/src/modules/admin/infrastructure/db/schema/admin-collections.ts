import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { ADMIN_SETTINGS_COLLECTION } from '../documents/admin-settings.document.ts';
import { API_KEYS_COLLECTION } from '../documents/api-key.document.ts';
import { TENANTS_COLLECTION } from '../documents/tenant.document.ts';

export const adminCollections: readonly CollectionDefinition[] = [
  {
    name: TENANTS_COLLECTION,
    indexes: [
      { key: { slug: 1 }, name: 'uk_tenants_slug', unique: true },
      { key: { status: 1 }, name: 'idx_tenants_status' },
    ],
  },
  {
    name: API_KEYS_COLLECTION,
    indexes: [
      { key: { keyHash: 1 }, name: 'uk_api_keys_hash', unique: true },
      { key: { tenantId: 1, keyPrefix: 1 }, name: 'uk_api_keys_tenant_prefix', unique: true },
    ],
  },
  {
    name: ADMIN_SETTINGS_COLLECTION,
    indexes: [{ key: { key: 1 }, name: 'uk_admin_settings_key', unique: true }],
  },
];
