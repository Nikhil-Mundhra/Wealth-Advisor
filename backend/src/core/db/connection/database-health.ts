import type { Env } from '#core/config/env.ts';
import { resolveDataStore } from './data-store.ts';
import { getDb } from './mongo-client.ts';

export type DatabaseStatus = 'up' | 'down' | 'unconfigured' | 'memory';

export async function checkDatabase(config: Env): Promise<DatabaseStatus> {
  if (resolveDataStore(config) === 'memory') return 'memory';
  if (!config.MONGODB_URI) return 'unconfigured';
  try {
    await (await getDb()).command({ ping: 1 });
    return 'up';
  } catch {
    return 'down';
  }
}
