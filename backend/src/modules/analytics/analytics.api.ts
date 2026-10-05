import type { EventEnvelope } from '#core/events/event-envelope.ts';
import type { MarkResult, ProcessedEvents } from '#core/events/processed-events.ts';
import type { Clock } from '#core/time/clock.ts';
import type { MarketApi } from '../market/public.ts';
import type { SnapshotRepository } from './application/ports.ts';
import { readRefreshedEvent } from './application/read-refreshed-event.ts';
import { snapshotWindow, toPricePoints } from './application/snapshot-inputs.ts';
import { AnalyticsErrors } from './domain/errors/analytics-errors.ts';
import type { MarketSnapshot } from './domain/market-snapshot.vo.ts';
import { measureSnapshot } from './domain/measure-snapshot.ts';
import { alignSeries } from './domain/returns.ts';

export const SNAPSHOT_HANDLER = 'analytics.snapshot';

export interface AnalyticsApiDeps {
  readonly market: Pick<MarketApi, 'history'>;
  readonly snapshots: SnapshotRepository;
  readonly processed: ProcessedEvents;
  readonly clock: Clock;
}

export type RefreshedOutcome =
  | { readonly outcome: 'ignored' }
  | { readonly outcome: 'measured' | 'insufficient'; readonly asOf: string; readonly observations: number; readonly mark: MarkResult };

export type AnalyticsApi = ReturnType<typeof createAnalyticsApi>;

export function createAnalyticsApi(deps: AnalyticsApiDeps) {
  const { market, snapshots, processed, clock } = deps;

  return {
    // At-least-once: the work runs before the mark, so a crash between the upsert and the mark leaves the event
    // unmarked and a redelivery recomputes it. A redelivered event that was already marked recomputes and upserts
    // the same asOf, which is harmless; 'duplicate' then only reports it. Too few observations is a final outcome
    // for this event (the data behind its asOf grows only through a later refresh, which publishes a new event),
    // so it is marked too.
    async onMarketDataRefreshed(event: EventEnvelope): Promise<RefreshedOutcome> {
      const payload = readRefreshedEvent(event);
      if (!payload) return { outcome: 'ignored' };
      const window = snapshotWindow(payload.asOf);
      const prices = await market.history(payload.symbols, window.from, window.to);
      const measurement = measureSnapshot(alignSeries(toPricePoints(prices), payload.symbols), payload.asOf, clock.now());
      if (measurement.kind === 'measured') await snapshots.upsert(measurement.snapshot);
      else console.warn(`[analytics] no snapshot for ${payload.asOf}: ${measurement.observations} aligned daily returns, below the minimum`);
      const mark = await processed.markProcessed(SNAPSHOT_HANDLER, event.id);
      return { outcome: measurement.kind, asOf: payload.asOf, observations: measurement.observations, mark };
    },

    async latestSnapshot(): Promise<MarketSnapshot> {
      return (await snapshots.latest()) ?? fail(AnalyticsErrors.noSnapshot(null));
    },

    async snapshotAt(asOf: string): Promise<MarketSnapshot> {
      return (await snapshots.at(asOf)) ?? fail(AnalyticsErrors.noSnapshot(asOf));
    },
  };
}

function fail(error: Error): never {
  throw error;
}
