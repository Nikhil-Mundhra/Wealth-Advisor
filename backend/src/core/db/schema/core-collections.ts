import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { schemaMigrationsSchema } from '#core/db/migrations/schema-migrations.schema.ts';
import { deadLetterEventsSchema, outboxEventsSchema } from '#core/events/outbox.schema.ts';
import { processedEventsSchema } from '#core/events/processed-events.schema.ts';
import { idempotencyKeysSchema } from '#core/http/idempotency-keys.schema.ts';
import { requestBudgetsSchema } from '#core/http-client/request-budgets.schema.ts';

// Collections behind core mechanisms; no module owns them, so the registry lists them ahead of every module's.
export const coreCollections: readonly CollectionDefinition[] = [
  deadLetterEventsSchema,
  idempotencyKeysSchema,
  outboxEventsSchema,
  processedEventsSchema,
  requestBudgetsSchema,
  schemaMigrationsSchema,
];
