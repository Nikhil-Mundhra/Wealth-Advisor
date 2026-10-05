import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { sessionsSchema } from './sessions.schema.ts';
import { usersSchema } from './users.schema.ts';

export const authCollections: readonly CollectionDefinition[] = [usersSchema, sessionsSchema];
