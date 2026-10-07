import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { createFinanceApi, type FinanceApi } from './finance.api.ts';
import { type AccountDocument, ACCOUNTS_COLLECTION } from './infrastructure/db/documents/account.document.ts';
import {
  type TransactionDocument,
  TRANSACTIONS_COLLECTION,
} from './infrastructure/db/documents/transaction.document.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from './infrastructure/db/memory/memory-finance.repository.ts';
import {
  MongoAccountRepository,
  MongoTransactionRepository,
} from './infrastructure/db/repositories/mongo-finance.repository.ts';
import { financeCollections } from './infrastructure/db/schema/finance-collections.ts';
import type { MiddlewareHandler } from 'hono';
import type { MarketApi } from '../market/public.ts';
import { FINANCE_ERROR_STATUSES } from './presentation/finance-error-statuses.ts';
import { financeRoutes } from './presentation/routes/finance.routes.ts';

export interface FinanceModuleDeps {
  market?: MarketApi;
  auth: MiddlewareHandler;
}

export function createFinanceModule(
  context: ModuleContext,
  deps: FinanceModuleDeps,
): { manifest: ModuleManifest; api: FinanceApi } {
  const { db, clock } = context;
  const store = resolveDataStore(env());

  const accounts =
    store === 'memory'
      ? new MemoryAccountRepository()
      : new MongoAccountRepository(async () => (await db()).collection<AccountDocument>(ACCOUNTS_COLLECTION));

  const transactions =
    store === 'memory'
      ? new MemoryTransactionRepository()
      : new MongoTransactionRepository(async () => (await db()).collection<TransactionDocument>(TRANSACTIONS_COLLECTION));

  const api = createFinanceApi({ accounts, transactions, clock, market: deps?.market });

  const manifest = defineModule({
    name: 'finance',
    basePath: '/finance',
    collections: financeCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.finance, statuses: FINANCE_ERROR_STATUSES },
    routes: financeRoutes(api, deps.auth),
  });

  return { manifest, api };
}
