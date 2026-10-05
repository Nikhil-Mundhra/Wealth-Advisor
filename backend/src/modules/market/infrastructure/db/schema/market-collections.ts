import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { fxRatesSchema } from './fx-rates.schema.ts';
import { pricesSchema } from './prices.schema.ts';

export const marketCollections: readonly CollectionDefinition[] = [pricesSchema, fxRatesSchema];
