import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { marketSnapshotsSchema } from './market-snapshots.schema.ts';

export const analyticsCollections: readonly CollectionDefinition[] = [marketSnapshotsSchema];
