import { ObjectId } from 'mongodb';
import type { IdGenerator } from '#core/domain/id-generator.ts';

// Ids are ObjectId hex strings: sortable by creation time, and stored as real ObjectIds by the mappers.
export const objectIdGenerator: IdGenerator = {
  next: () => new ObjectId().toHexString(),
};
