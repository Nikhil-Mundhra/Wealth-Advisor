import { classifyDbError } from '#core/db/errors/classify-db-error.ts';

// Reads and connection setup only. The driver already retries single writes once (retryWrites); an app-level
// retry of a conditional write can see its own earlier success as a lost compare-and-set.
export const READ_RETRY = { attempts: 2, backoffMs: 100 } as const;

export function isRetryable(error: unknown): boolean {
  return classifyDbError(error) === 'transient';
}
