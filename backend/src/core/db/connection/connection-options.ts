import type { MongoClientOptions } from 'mongodb';
import type { Env } from '#core/config/env.ts';

const MAX_POOL_SIZE = 10;
const APP_NAME = 'wealth-advisor';

export function mongoClientOptions(config: Env): MongoClientOptions {
  return { maxPoolSize: MAX_POOL_SIZE, serverSelectionTimeoutMS: config.MONGODB_SERVER_SELECTION_TIMEOUT_MS, appName: APP_NAME };
}
