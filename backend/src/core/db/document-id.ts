import { ObjectId } from 'mongodb';

// The deployment is single-tenant: the seeded demo user, the in-memory stores and every self-registered user share
// one tenant document, so an unowned scope resolves to it rather than to nothing.
export const DEFAULT_TENANT_ID = '600000000000000000000001';
export const DEFAULT_USER_ID = '500000000000000000000001';

// The scope the in-memory stores and the anonymous demo path are keyed by. It is not an id, so it never reaches a query.
export const DEMO_SCOPE_KEY = 'default';

// ObjectId.isValid also accepts 12-byte strings and numbers, so the length check is what makes this a hex id. A value
// that is not an id resolves to null: a caller reads nothing, and a writer must refuse rather than pick a scope.
export function toDocumentId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
}

export function toScopeId(id: string, demoId: string): ObjectId | null {
  return id === DEMO_SCOPE_KEY ? new ObjectId(demoId) : toDocumentId(id);
}