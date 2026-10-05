import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { processedEventsSchema } from '#core/events/processed-events.schema.ts';
import { requestBudgetsSchema } from '#core/http-client/request-budgets.schema.ts';

// Collections behind core mechanisms; no module owns them, so the registry lists them ahead of every module's.
export const coreCollections: readonly CollectionDefinition[] = [processedEventsSchema, requestBudgetsSchema];
