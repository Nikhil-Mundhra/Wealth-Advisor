import { MongoError, MongoNetworkError, MongoServerError, MongoServerSelectionError } from 'mongodb';

export type DbErrorClass = 'duplicate-key' | 'transient' | 'fatal';

const DUPLICATE_KEY_CODE = 11000;

export function classifyDbError(error: unknown): DbErrorClass {
  if (error instanceof MongoServerError && error.code === DUPLICATE_KEY_CODE) return 'duplicate-key';
  if (error instanceof MongoNetworkError || error instanceof MongoServerSelectionError) return 'transient';
  if (error instanceof MongoError && error.hasErrorLabel('TransientTransactionError')) return 'transient';
  return 'fatal';
}
