import type { ObjectId } from 'mongodb';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

export const PROCESSED_EVENTS_COLLECTION = 'processed_events';

export interface ProcessedEventDocument {
  _id?: ObjectId;
  handler: string;
  eventId: string;
  processedAt: Date;
}

export const processedEventsSchema: CollectionDefinition = {
  name: PROCESSED_EVENTS_COLLECTION,
  indexes: [{ key: { handler: 1, eventId: 1 }, name: 'uk_processed_events_handler_event', unique: true }],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['handler', 'eventId', 'processedAt'],
      properties: {
        handler: { bsonType: 'string', minLength: 1 },
        eventId: { bsonType: 'string', minLength: 1 },
        processedAt: { bsonType: 'date' },
      },
    },
  },
};
