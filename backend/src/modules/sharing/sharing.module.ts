import type { MiddlewareHandler } from 'hono';
import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import type { WealthApi } from '../wealth/public.ts';
import { createSharingApi, type SharingApi } from './sharing.api.ts';
import {
  type SharedPlanDocument,
  SHARED_PLANS_COLLECTION,
} from './infrastructure/db/documents/shared-plan.document.ts';
import { MemorySharedPlanRepository } from './infrastructure/db/memory/memory-sharing.repository.ts';
import { MongoSharedPlanRepository } from './infrastructure/db/repositories/mongo-sharing.repository.ts';
import { sharingCollections } from './infrastructure/db/schema/sharing-collections.ts';
import { SHARING_ERROR_STATUSES } from './presentation/sharing-error-statuses.ts';
import { sharingRoutes } from './presentation/routes/sharing.routes.ts';

export interface SharingModuleDeps {
  wealth: WealthApi;
  // Share-link creation writes, so it needs a signed-in caller.
  writeAuth: MiddlewareHandler;
}

export function createSharingModule(
  context: ModuleContext,
  deps: SharingModuleDeps,
): { manifest: ModuleManifest; api: SharingApi } {
  const { db, clock } = context;
  const store = resolveDataStore(env());

  const plans =
    store === 'memory'
      ? new MemorySharedPlanRepository()
      : new MongoSharedPlanRepository(async () => (await db()).collection<SharedPlanDocument>(SHARED_PLANS_COLLECTION));

  const api = createSharingApi({ plans, wealth: deps.wealth, clock });

  const manifest = defineModule({
    name: 'sharing',
    basePath: '/sharing',
    collections: sharingCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.sharing, statuses: SHARING_ERROR_STATUSES },
    routes: sharingRoutes(api, deps.writeAuth),
  });

  return { manifest, api };
}
