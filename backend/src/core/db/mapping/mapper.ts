// Converts between a domain entity and its stored document; one mapper per collection.
export interface Mapper<Entity, Document> {
  toEntity(document: Document): Entity;
  toDocument(entity: Entity): Document;
}
