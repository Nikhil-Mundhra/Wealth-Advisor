import { MARKET_DATA_REFRESHED, MarketDataRefreshedPayload } from '@wealth-advisor/contracts';
import type { EventEnvelope } from '#core/events/event-envelope.ts';

// The event type the snapshot handler subscribes to; every version arrives, readRefreshedEvent picks v1.
export const REFRESHED_EVENT_TYPE = MARKET_DATA_REFRESHED.type;

// step: the v1 payload of a market.data_refreshed envelope, checked against its contract; null for another
// version, which this handler does not understand and leaves to a consumer written for it. A v1 payload that
// fails its schema throws: the publisher broke the contract, and the bus logs it.
export function readRefreshedEvent(event: EventEnvelope): MarketDataRefreshedPayload | null {
  if (event.type !== MARKET_DATA_REFRESHED.type || event.version !== MARKET_DATA_REFRESHED.version) return null;
  return MarketDataRefreshedPayload.parse(event.payload);
}
