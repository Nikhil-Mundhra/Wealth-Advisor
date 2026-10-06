import type { ObjectId } from 'mongodb';
import type { AssetClass, Currency } from '@wealth-advisor/rules';

export const ASSET_PRODUCTS_COLLECTION = 'asset_products';

export interface AssetProductDocument {
  _id: ObjectId;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  denominationCurrency: Currency;
  riskRating: number;
  expenseRatio: number;
  annualizedYield: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  domicileCountry: string;
  description: string;
  isActive: boolean;
  updatedAt: Date;
}
