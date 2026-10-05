// A $jsonSchema bsonType that also accepts null.
export const nullable = (bsonType: string) => ({ bsonType: [bsonType, 'null'] });
