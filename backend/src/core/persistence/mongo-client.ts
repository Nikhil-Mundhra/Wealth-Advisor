import { MongoClient, type Db } from 'mongodb';
import { env } from '#core/config/env.ts';
import { AppError } from '#core/errors/app-error.ts';
import { CoreErrorCodes } from '#core/errors/error-codes.ts';

// One client per runtime instance. Serverless instances are reused across requests, so caching on
// globalThis avoids opening a new connection pool on every invocation.
const holder = globalThis as typeof globalThis & { __mongoClientPromise?: Promise<MongoClient> };

export function getMongoClient(): Promise<MongoClient> {
  if (!holder.__mongoClientPromise) {
    const uri = env().MONGODB_URI;
    if (!uri) {
      return Promise.reject(new AppError(503, CoreErrorCodes.databaseUnconfigured, 'database is not configured'));
    }
    holder.__mongoClientPromise = new MongoClient(uri, { maxPoolSize: 10 }).connect().catch((error: unknown) => {
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
