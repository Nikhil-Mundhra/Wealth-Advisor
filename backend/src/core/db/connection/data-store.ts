import type { Env } from '#core/config/env.ts';

export type DataStore = 'mongo' | 'memory';

// Explicit DATA_STORE wins; otherwise mongo when a URI is set, memory for local runs without one.
// Production never uses memory: serverless instances do not share it, so data would vanish between requests.
export function resolveDataStore(config: Env): DataStore {
  if (config.DATA_STORE === 'memory' && config.NODE_ENV === 'production') {
    throw new Error('DATA_STORE=memory is not allowed in production');
  }
  if (config.DATA_STORE) return config.DATA_STORE;
  return config.MONGODB_URI || config.NODE_ENV === 'production' ? 'mongo' : 'memory';
}
