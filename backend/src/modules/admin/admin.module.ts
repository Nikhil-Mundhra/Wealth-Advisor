import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import type { MiddlewareHandler } from 'hono';
import { createAdminApi, type AdminApi } from './admin.api.ts';
import {
  type AdminSettingsDocument,
  ADMIN_SETTINGS_COLLECTION,
} from './infrastructure/db/documents/admin-settings.document.ts';
import { type ApiKeyDocument, API_KEYS_COLLECTION } from './infrastructure/db/documents/api-key.document.ts';
import { type TenantDocument, TENANTS_COLLECTION } from './infrastructure/db/documents/tenant.document.ts';
import {
  MemoryAdminSettingsRepository,
  MemoryApiKeyRepository,
  MemoryTenantRepository,
} from './infrastructure/db/memory/memory-admin.repository.ts';
import {
  MongoAdminSettingsRepository,
  MongoApiKeyRepository,
  MongoTenantRepository,
} from './infrastructure/db/repositories/mongo-admin.repository.ts';
import { adminCollections } from './infrastructure/db/schema/admin-collections.ts';
import { ADMIN_ERROR_STATUSES } from './presentation/admin-error-statuses.ts';
import { adminRoutes } from './presentation/routes/admin.routes.ts';

export interface AdminModuleDeps {
  auth?: MiddlewareHandler;
}

export function createAdminModule(context: ModuleContext, deps?: AdminModuleDeps): { manifest: ModuleManifest; api: AdminApi } {
  const { db, clock } = context;
  const store = resolveDataStore(env());

  const tenants =
    store === 'memory'
      ? new MemoryTenantRepository()
      : new MongoTenantRepository(async () => (await db()).collection<TenantDocument>(TENANTS_COLLECTION));

  const apiKeys =
    store === 'memory'
      ? new MemoryApiKeyRepository()
      : new MongoApiKeyRepository(async () => (await db()).collection<ApiKeyDocument>(API_KEYS_COLLECTION));

  const settings =
    store === 'memory'
      ? new MemoryAdminSettingsRepository()
      : new MongoAdminSettingsRepository(
          async () => (await db()).collection<AdminSettingsDocument>(ADMIN_SETTINGS_COLLECTION),
        );

  const api = createAdminApi({ tenants, apiKeys, settings, clock });

  const manifest = defineModule({
    name: 'admin',
    basePath: '/admin',
    collections: adminCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.admin, statuses: ADMIN_ERROR_STATUSES },
    routes: adminRoutes({ api, auth: deps?.auth }),
  });

  return { manifest, api };
}
