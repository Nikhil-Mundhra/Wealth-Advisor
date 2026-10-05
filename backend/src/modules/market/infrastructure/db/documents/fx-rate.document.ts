import type { ObjectId } from 'mongodb';

export const FX_RATES_COLLECTION = 'fx_rates';

// Stored shape of one published rate; written once, never updated.
export interface FxRateDocument {
  _id?: ObjectId;
  base: string;
  quote: string;
  date: string;
  rate: number;
  source: string;
  createdAt: Date;
}
