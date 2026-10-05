import type { ObjectId } from 'mongodb';

export const MARKET_SNAPSHOTS_COLLECTION = 'market_snapshots';

// Stored shape of one snapshot; replaced whole when its asOf is recomputed.
export interface MarketSnapshotDocument {
  _id?: ObjectId;
  asOf: string;
  symbols: string[];
  means: number[];
  volatilities: number[];
  covariance: number[][];
  window: { from: string; to: string; observations: number };
  computedAt: Date;
}
