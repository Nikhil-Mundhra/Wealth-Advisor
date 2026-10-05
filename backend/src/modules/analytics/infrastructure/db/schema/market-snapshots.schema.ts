import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { MARKET_SNAPSHOTS_COLLECTION } from '../documents/market-snapshot.document.ts';

const ISO_DATE = '^\\d{4}-\\d{2}-\\d{2}$';
// 'number', not 'double': the driver writes a whole-valued JS number (a mean of exactly 0) as an int32.
const numbers = { bsonType: 'array', items: { bsonType: 'number' } };

export const marketSnapshotsSchema: CollectionDefinition = {
  name: MARKET_SNAPSHOTS_COLLECTION,
  // One snapshot per data date; it also serves latest (asOf desc).
  indexes: [{ key: { asOf: 1 }, name: 'uk_market_snapshots_as_of', unique: true }],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['asOf', 'symbols', 'means', 'volatilities', 'covariance', 'window', 'computedAt'],
      properties: {
        asOf: { bsonType: 'string', pattern: ISO_DATE },
        symbols: { bsonType: 'array', minItems: 1, items: { bsonType: 'string', minLength: 1 } },
        means: numbers,
        volatilities: numbers,
        covariance: { bsonType: 'array', items: numbers },
        window: {
          bsonType: 'object',
          required: ['from', 'to', 'observations'],
          properties: {
            from: { bsonType: 'string', pattern: ISO_DATE },
            to: { bsonType: 'string', pattern: ISO_DATE },
            observations: { bsonType: ['int', 'long'], minimum: 2 },
          },
        },
        computedAt: { bsonType: 'date' },
      },
    },
  },
};
