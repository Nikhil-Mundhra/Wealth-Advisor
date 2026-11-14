import type { ObjectId } from 'mongodb';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

export const IDEMPOTENCY_KEYS_COLLECTION = 'idempotency_keys';

export interface IdempotencyKeyDocument {
  _id?: ObjectId;
  key: string;
  callerHash: string;
  method: string;
  path: string;
  payloadHash: string;
  status: number;
  contentType: string;
  bodyText: string;
  createdAt: Date;
  expiresAt: Date;
}

export const idempotencyKeysSchema: CollectionDefinition = {
  name: IDEMPOTENCY_KEYS_COLLECTION,
  indexes: [
    { key: { key: 1, callerHash: 1, method: 1, path: 1 }, name: 'uk_idempotency_keys_scope', unique: true },
    { key: { expiresAt: 1 }, name: 'ttl_idempotency_keys_expires', expireAfterSeconds: 0 },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'callerHash', 'method', 'path', 'payloadHash', 'status', 'contentType', 'bodyText', 'createdAt', 'expiresAt'],
      properties: {
        key: { bsonType: 'string', minLength: 1 },
        callerHash: { bsonType: 'string', minLength: 1 },
        method: { bsonType: 'string', minLength: 1 },
        path: { bsonType: 'string', minLength: 1 },
        payloadHash: { bsonType: 'string', minLength: 1 },
        status: { bsonType: 'int' },
        contentType: { bsonType: 'string', minLength: 1 },
        bodyText: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' },
      },
    },
  },
};
