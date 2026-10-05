import { MongoClient, type Db } from 'mongodb';
import { env } from '#core/config/env.ts';
import { withReadRetry } from '#core/db/retry/with-read-retry.ts';
import { mongoClientOptions } from './connection-options.ts';
import { AppError } from '#core/errors/app-error.ts';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';

// One client per runtime instance. Serverless instances are reused across requests, so caching on
// globalThis avoids opening a new connection pool on every invocation.
const holder = globalThis as typeof globalThis & { __mongoClientPromise?: Promise<MongoClient> };

export function getMongoClient(): Promise<MongoClient> {
  if (!holder.__mongoClientPromise) {
    const uri = env().MONGODB_URI;
    if (!uri) {
      return Promise.reject(new AppError(503, CORE_ERROR_CODES.databaseUnconfigured, 'database is not configured'));
    }
    holder.__mongoClientPromise = withReadRetry(() => new MongoClient(uri, mongoClientOptions(env())).connect()).catch((error: unknown) => {
      holder.__mongoClientPromise = undefined; // let the next request retry instead of caching the failure
      throw error;
    });
  }
  return holder.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(env().MONGODB_DB_NAME);
}

export async function closeMongoClient(): Promise<void> {
  const pending = holder.__mongoClientPromise;
  holder.__mongoClientPromise = undefined;
  if (pending) await (await pending).close();
}
