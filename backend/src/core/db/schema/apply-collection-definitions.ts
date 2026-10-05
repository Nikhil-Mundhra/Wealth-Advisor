import type { Db } from 'mongodb';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';

// Creates missing collections, (re)applies $jsonSchema validators, and ensures indexes. Safe to run repeatedly.
export async function applyCollectionDefinitions(db: Db, definitions: readonly CollectionDefinition[]): Promise<void> {
  for (const definition of definitions) {
    const exists = await db.listCollections({ name: definition.name }, { nameOnly: true }).hasNext();
    if (!exists) {
      await db.createCollection(definition.name, definition.validator ? { validator: definition.validator } : {});
    } else if (definition.validator) {
      await db.command({ collMod: definition.name, validator: definition.validator });
    }
    if (definition.indexes.length > 0) {
      await db.collection(definition.name).createIndexes([...definition.indexes]);
    }
  }
}
