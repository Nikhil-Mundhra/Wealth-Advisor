import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { createRequestBudget } from '#core/http-client/request-budget.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { type FxRateDocument, FX_RATES_COLLECTION } from './infrastructure/db/documents/fx-rate.document.ts';
import { type PriceDocument, PRICES_COLLECTION } from './infrastructure/db/documents/price.document.ts';
import { MemoryFxRateRepository } from './infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from './infrastructure/db/memory/memory-price.repository.ts';
import { MongoFxRateRepository } from './infrastructure/db/repositories/mongo-fx-rate.repository.ts';
import { MongoPriceRepository } from './infrastructure/db/repositories/mongo-price.repository.ts';
import { marketCollections } from './infrastructure/db/schema/market-collections.ts';
import { createFrankfurterFxSource } from './infrastructure/providers/frankfurter-fx-source.ts';
import { createMarketstackPriceSource } from './infrastructure/providers/marketstack-price-source.ts';
import { createMarketApi, type MarketApi } from './market.api.ts';
import { MARKET_ERROR_STATUSES } from './presentation/market-error-statuses.ts';
import { marketRoutes } from './presentation/routes/market.routes.ts';

export interface MarketModule {
  readonly manifest: ModuleManifest;
  readonly api: MarketApi;
}

// Composition root: the only file that knows which concrete class implements each port. The api is returned beside
// the manifest so modules/index.ts can hand it to modules with an edge to market.
export function createMarketModule(context: ModuleContext): MarketModule {
  const { db, clock, events, http } = context;
  const config = env();
  const store = resolveDataStore(config);
  const memory = store === 'memory';
  const prices = memory
    ? new MemoryPriceRepository()
    : new MongoPriceRepository(async () => (await db()).collection<PriceDocument>(PRICES_COLLECTION), clock);
  const fxRates = memory
    ? new MemoryFxRateRepository()
    : new MongoFxRateRepository(async () => (await db()).collection<FxRateDocument>(FX_RATES_COLLECTION), clock);
  const budget = createRequestBudget(store, db, clock);
  const api = createMarketApi({
    prices,
    fxRates,
    priceSource: createMarketstackPriceSource({ accessKey: config.MARKETSTACK_ACCESS_KEY, http, budget }),
    fxSource: createFrankfurterFxSource({ http }),
    events,
    clock,
  });

  const manifest = defineModule({
    name: 'market',
    basePath: '/market',
    collections: marketCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.market, statuses: MARKET_ERROR_STATUSES },
    routes: marketRoutes({ api, clock, cronSecret: () => env().CRON_SECRET }),
  });
  return { manifest, api };
}
