import { MARKET_DATA_REFRESHED, MarketDataRefreshedPayload } from '@wealth-advisor/contracts';
import { createEnvelope } from '#core/events/event-envelope.ts';
import type { EventBus } from '#core/events/event-bus.ts';
import type { Clock } from '#core/time/clock.ts';

// The payload is checked against its v1 schema before it leaves, so consumers never see a shape the contract lacks.
// The envelope id is random: consumers converge through upserts keyed by asOf, not by deduplicating refreshes.
export async function publishRefreshed(events: EventBus, clock: Clock, payload: MarketDataRefreshedPayload): Promise<void> {
  await events.publish(
    createEnvelope({
      type: MARKET_DATA_REFRESHED.type,
      version: MARKET_DATA_REFRESHED.version,
      occurredAt: clock.now(),
      payload: MarketDataRefreshedPayload.parse(payload),
    }),
  );
}
