import type { ObjectId } from 'mongodb';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

export const OUTBOX_EVENTS_COLLECTION = 'outbox_events';
export const DEAD_LETTER_EVENTS_COLLECTION = 'dead_letter_events';

export type OutboxEventStatus = 'PENDING' | 'DELIVERED' | 'DEAD_LETTERED';

export interface OutboxEventDocument {
  _id?: ObjectId;
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  payload: unknown;
  status: OutboxEventStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeadLetterEventDocument {
  _id?: ObjectId;
  eventId: string;
  type: string;
  version: number;
  correlationId: string;
  payload: unknown;
  attempts: number;
  lastError: string;
  failedAt: Date;
}

export const outboxEventsSchema: CollectionDefinition = {
  name: OUTBOX_EVENTS_COLLECTION,
  indexes: [
    { key: { eventId: 1 }, name: 'uk_outbox_events_event_id', unique: true },
    { key: { status: 1, nextAttemptAt: 1 }, name: 'idx_outbox_events_status_next' },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventId', 'type', 'version', 'occurredAt', 'correlationId', 'status', 'attempts', 'nextAttemptAt', 'createdAt', 'updatedAt'],
      properties: {
        eventId: { bsonType: 'string', minLength: 1 },
        type: { bsonType: 'string', minLength: 1 },
        version: { bsonType: 'int' },
        occurredAt: { bsonType: 'string' },
        correlationId: { bsonType: 'string' },
        status: { enum: ['PENDING', 'DELIVERED', 'DEAD_LETTERED'] },
        attempts: { bsonType: 'int' },
        nextAttemptAt: { bsonType: 'date' },
        lastError: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
};

export const deadLetterEventsSchema: CollectionDefinition = {
  name: DEAD_LETTER_EVENTS_COLLECTION,
  indexes: [
    { key: { eventId: 1 }, name: 'idx_dead_letter_events_event_id' },
    { key: { failedAt: -1 }, name: 'idx_dead_letter_events_failed_at' },
  ],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventId', 'type', 'version', 'correlationId', 'attempts', 'lastError', 'failedAt'],
      properties: {
        eventId: { bsonType: 'string', minLength: 1 },
        type: { bsonType: 'string', minLength: 1 },
        version: { bsonType: 'int' },
        correlationId: { bsonType: 'string' },
        attempts: { bsonType: 'int' },
        lastError: { bsonType: 'string' },
        failedAt: { bsonType: 'date' },
      },
    },
  },
};
