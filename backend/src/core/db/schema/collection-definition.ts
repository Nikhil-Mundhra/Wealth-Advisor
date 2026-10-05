import type { Document, IndexDescription } from 'mongodb';

// What a module declares about each collection it owns; applied at deploy time, never per request.
export interface CollectionDefinition {
  readonly name: string;
  readonly indexes: readonly IndexDescription[];
  readonly validator?: Document;
}
