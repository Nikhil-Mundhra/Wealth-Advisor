import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

export const REQUEST_BUDGETS_COLLECTION = 'request_budgets';

// _id is "<provider>:<YYYY-MM>", so one month's counter is one document and its $inc is atomic.
export interface RequestBudgetDocument {
  _id: string;
  provider: string;
  month: string;
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

export const requestBudgetsSchema: CollectionDefinition = {
  name: REQUEST_BUDGETS_COLLECTION,
  indexes: [],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'provider', 'month', 'used', 'createdAt', 'updatedAt'],
      properties: {
        _id: { bsonType: 'string' },
        provider: { bsonType: 'string', minLength: 1 },
        month: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}$' },
        used: { bsonType: ['int', 'long'], minimum: 0 },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};
