import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { createProcessedEvents } from '#core/events/processed-events.ts';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import type { MarketApi } from '../market/public.ts';
import { createAnalyticsApi } from './analytics.api.ts';
import { REFRESHED_EVENT_TYPE } from './application/read-refreshed-event.ts';
import { type MarketSnapshotDocument, MARKET_SNAPSHOTS_COLLECTION } from './infrastructure/db/documents/market-snapshot.document.ts';
import { MemoryMarketSnapshotRepository } from './infrastructure/db/memory/memory-market-snapshot.repository.ts';
import { MongoMarketSnapshotRepository } from './infrastructure/db/repositories/mongo-market-snapshot.repository.ts';
import { analyticsCollections } from './infrastructure/db/schema/analytics-collections.ts';
import { ANALYTICS_ERROR_STATUSES } from './presentation/analytics-error-statuses.ts';
import { analyticsRoutes } from './presentation/routes/analytics.routes.ts';

// Composition root. market's api arrives from modules/index.ts (the analytics → market edge); prices are asked for
// synchronously, while the refresh itself arrives as the market.data_refreshed event.
export function createAnalyticsModule(
  context: ModuleContext,
  market: MarketApi,
): { manifest: ModuleManifest; api: AnalyticsApi } {
  const { db, clock } = context;
  const store = resolveDataStore(env());
  const snapshots =
    store === 'memory'
      ? new MemoryMarketSnapshotRepository()
      : new MongoMarketSnapshotRepository(async () => (await db()).collection<MarketSnapshotDocument>(MARKET_SNAPSHOTS_COLLECTION));
  const api = createAnalyticsApi({ market, snapshots, processed: createProcessedEvents(store, db, clock), clock });

  const manifest = defineModule({
    name: 'analytics',
    basePath: '/analytics',
    collections: analyticsCollections,
    errors: { prefix: ERROR_CODE_PREFIXES.analytics, statuses: ANALYTICS_ERROR_STATUSES },
    routes: analyticsRoutes(api),
    subscriptions: [
      {
        eventType: REFRESHED_EVENT_TYPE,
        handler: async (event) => {
          await api.onMarketDataRefreshed(event);
        },
      },
    ],
  });

  return { manifest, api };
}
