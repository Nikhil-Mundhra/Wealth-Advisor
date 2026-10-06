import { z } from 'zod';
import { ASSET_CLASSES, CURRENCIES } from '@wealth-advisor/rules';

export const HoldingItemDto = z.object({
  assetSymbol: z.string(),
  assetName: z.string(),
  assetClass: z.enum(ASSET_CLASSES),
  currency: z.enum(CURRENCIES),
  quantity: z.number(),
  averageCostBasis: z.number().int(), // minor units
  currentPrice: z.number().int(), // minor units
  marketValueBase: z.number().int(), // minor units
  currentWeight: z.number(), // 0 - 1
  targetWeight: z.number(), // 0 - 1
});
export type HoldingItemDto = z.infer<typeof HoldingItemDto>;

export const PortfolioResponse = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  baseCurrency: z.enum(CURRENCIES),
  totalValuationBase: z.number().int(), // minor units
  baseRiskScore: z.number(), // 1 - 10
  effectiveRiskScore: z.number(), // 1 - 10
  burnRateRunwayMonths: z.number(),
  holdings: z.array(HoldingItemDto),
  lastRebalancedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type PortfolioResponse = z.infer<typeof PortfolioResponse>;
