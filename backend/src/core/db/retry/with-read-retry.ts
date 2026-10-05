import { READ_RETRY, isRetryable } from './retry-policy.ts';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs a connect or a read under READ_RETRY. Never wrap a write.
export async function withReadRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= READ_RETRY.attempts || !isRetryable(error)) throw error;
      await pause(READ_RETRY.backoffMs * attempt);
    }
  }
}
