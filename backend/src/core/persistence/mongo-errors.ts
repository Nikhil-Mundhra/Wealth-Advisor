import { MongoServerError } from 'mongodb';

const DUPLICATE_KEY_CODE = 11000;

// True when a write was rejected by a unique index, which repositories translate into a domain outcome.
export function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === DUPLICATE_KEY_CODE;
}
