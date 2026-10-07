import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { createWealthApi, type WealthApi } from './wealth.api.ts';
import {
  type AssetProductDocument,
  ASSET_PRODUCTS_COLLECTION,
} from './infrastructure/db/documents/asset-product.document.ts';
import { type PortfolioDocument, PORTFOLIOS_COLLECTION } from './infrastructure/db/documents/portfolio.document.ts';
import {
  type SandboxLedgerDocument,
  SANDBOX_LEDGERS_COLLECTION,
} from './infrastructure/db/documents/sandbox-ledger.document.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from './infrastructure/db/memory/memory-wealth.repository.ts';
import {
  MongoAssetProductRepository,
  MongoPortfolioRepository,
  MongoSandboxLedgerRepository,
} from './infrastructure/db/repositories/mongo-wealth.repository.ts';
import type { MiddlewareHandler } from 'hono';
import type { AnalyticsApi } from '../analytics/public.ts';
import { unregisteredPasskeyVerifier } from './infrastructure/crypto/unregistered-passkey-verifier.ts';
import { wealthCollections } from './infrastructure/db/schema/wealth-collections.ts';
import { WEALTH_ERROR_STATUSES } from './presentation/wealth-error-statuses.ts';
import { wealthRoutes } from './presentation/routes/wealth.routes.ts';

export interface WealthModuleDeps {
  analytics?: AnalyticsApi;
  auth: MiddlewareHandler;
}

export function createWealthModule(
  context: ModuleContext,
  deps: WealthModuleDeps,
): { manifest: ModuleManifest; api: WealthApi } {
  const { db, clock } = context;
  const store = resolveDataStore(env());

  const products =
    store === 'memory'
      ? new MemoryAssetProductRepository()
      : new MongoAssetProductRepository(async () => (await db()).collection<AssetProductDocument>(ASSET_PRODUCTS_COLLECTION));

  const portfolios =
    store === 'memory'
      ? new MemoryPortfolioRepository()
      : new MongoPortfolioRepository(async () => (await db()).collection<PortfolioDocument>(PORTFOLIOS_COLLECTION));

  const ledger =
    store === 'memory'
      ? new MemorySandboxLedgerRepository()
      : new MongoSandboxLedgerRepository(async () => (await db()).collection<SandboxLedgerDocument>(SANDBOX_LEDGERS_COLLECTION));

  const api = createWealthApi({
    products,
    portfolios,
    ledger,
    passkeys: unregisteredPasskeyVerifier,
    clock,
    analytics: deps?.analytics,
  });

  const manifest = defineModule({
    name: 'wealth',
    basePath: '/wealth',
    collections: wealthCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.wealth, statuses: WEALTH_ERROR_STATUSES },
    routes: wealthRoutes(api, deps.auth),
  });

  return { manifest, api };
}
