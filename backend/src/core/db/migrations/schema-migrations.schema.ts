import type { ObjectId } from 'mongodb';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

export const SCHEMA_MIGRATIONS_COLLECTION = 'schema_migrations';

export interface SchemaMigrationDocument {
  _id?: ObjectId;
  version: string;
  description: string;
  checksum: string;
  appliedAt: Date;
}

export const schemaMigrationsSchema: CollectionDefinition = {
  name: SCHEMA_MIGRATIONS_COLLECTION,
  indexes: [{ key: { version: 1 }, name: 'uk_schema_migrations_version', unique: true }],
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['version', 'description', 'checksum', 'appliedAt'],
      properties: {
        version: { bsonType: 'string', minLength: 1 },
        description: { bsonType: 'string', minLength: 1 },
        checksum: { bsonType: 'string', minLength: 1 },
        appliedAt: { bsonType: 'date' },
      },
    },
  },
};
