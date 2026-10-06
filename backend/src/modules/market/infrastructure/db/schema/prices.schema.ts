import { CURRENCIES } from '@wealth-advisor/rules';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { SYMBOL_PATTERN } from '../../../domain/price.vo.ts';
import { PRICES_COLLECTION } from '../documents/price.document.ts';

const ISO_DATE = '^\\d{4}-\\d{2}-\\d{2}$';

const money = {
  bsonType: 'object',
  required: ['amount', 'currency'],
  properties: { amount: { bsonType: ['int', 'long'], minimum: 1 }, currency: { enum: [...CURRENCIES] } },
};

export const pricesSchema: CollectionDefinition = {
  name: PRICES_COLLECTION,
  // One fact per symbol and day; it also serves latest-per-symbol (symbol, date desc) and history scans.
  indexes: [{ key: { symbol: 1, date: 1 }, name: 'uk_prices_symbol_date', unique: true }],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['symbol', 'date', 'close', 'adjClose', 'source', 'createdAt'],
      properties: {
        symbol: { bsonType: 'string', pattern: SYMBOL_PATTERN.source },
        date: { bsonType: 'string', pattern: ISO_DATE },
        close: money,
        adjClose: { ...money, bsonType: ['object', 'null'] },
        source: { bsonType: 'string', minLength: 1 },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};
