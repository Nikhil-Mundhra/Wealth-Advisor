import type { Db } from 'mongodb';
import type { DataStore } from '#core/db/connection/data-store.ts';
import type { Clock } from '#core/time/clock.ts';
import { MemoryRequestBudget } from './memory-request-budget.ts';
import { MongoRequestBudget } from './mongo-request-budget.ts';
import { type RequestBudgetDocument, REQUEST_BUDGETS_COLLECTION } from './request-budgets.schema.ts';

// Monthly request quota per external provider, counted per UTC calendar month. Callers reserve before each
// request; a reservation is never returned, so a failed request still spends quota, as the provider counts it.
export interface RequestBudget {
  reserve(provider: string, count: number, monthlyLimit: number): Promise<boolean>;
}

export function createRequestBudget(store: DataStore, db: () => Promise<Db>, clock: Clock): RequestBudget {
  if (store === 'memory') return new MemoryRequestBudget(clock);
  return new MongoRequestBudget(async () => (await db()).collection<RequestBudgetDocument>(REQUEST_BUDGETS_COLLECTION), clock);
}
