import type { Db } from 'mongodb';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { EventBus } from '#core/events/event-bus.ts';
import type { HttpClient } from '#core/http-client/http-client.ts';
import type { Clock } from '#core/time/clock.ts';

// Shared dependencies every module's composition root receives; tests swap in fakes here.
export interface ModuleContext {
  readonly db: () => Promise<Db>;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly events: EventBus;
  // Outbound HTTP; tests pass a fake so no test reaches a live provider.
  readonly http: HttpClient;
}
