import type { ObjectId } from 'mongodb';
import type { AssetClass, Currency } from '@wealth-advisor/rules';

export const PORTFOLIOS_COLLECTION = 'portfolios';

export interface HoldingDocumentItem {
  assetSymbol: string;
  assetName: string;
  assetClass: AssetClass;
  currency: Currency;
  quantity: number;
  averageCostBasis: number;
  currentPrice: number;
  marketValueBase: number;
  currentWeight: number;
  targetWeight: number;
}

export interface PortfolioDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  baseCurrency: Currency;
  totalValuationBase: number; // minor units
  baseRiskScore: number;
  effectiveRiskScore: number;
  burnRateRunwayMonths: number;
  holdings: HoldingDocumentItem[];
  lastRebalancedAt: Date | null;
  updatedAt: Date;
}
