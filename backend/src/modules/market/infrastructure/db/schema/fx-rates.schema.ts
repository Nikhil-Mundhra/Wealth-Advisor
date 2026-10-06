import { CURRENCIES } from '@wealth-advisor/rules';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { FX_RATES_COLLECTION } from '../documents/fx-rate.document.ts';

export const fxRatesSchema: CollectionDefinition = {
  name: FX_RATES_COLLECTION,
  indexes: [
    { key: { base: 1, quote: 1, date: 1 }, name: 'uk_fx_rates_pair_date', unique: true },
    // Rate windows and the latest stored day scan by date across every pair.
    { key: { date: 1 }, name: 'ix_fx_rates_date' },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['base', 'quote', 'date', 'rate', 'source', 'createdAt'],
      properties: {
        base: { enum: [...CURRENCIES] },
        quote: { enum: [...CURRENCIES] },
        date: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        // A whole-number rate is stored as int by the driver.
        rate: { bsonType: ['double', 'int', 'long'], minimum: 0, exclusiveMinimum: true },
        source: { bsonType: 'string', minLength: 1 },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};
