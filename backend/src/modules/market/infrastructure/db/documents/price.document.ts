import type { ObjectId } from 'mongodb';

export const PRICES_COLLECTION = 'prices';

export interface MoneyDocument {
  amount: number;
  currency: string;
}

// Stored shape of one end-of-day close; written once, never updated.
export interface PriceDocument {
  _id?: ObjectId;
  symbol: string;
  date: string;
  close: MoneyDocument;
  adjClose: MoneyDocument | null;
  source: string;
  createdAt: Date;
}
