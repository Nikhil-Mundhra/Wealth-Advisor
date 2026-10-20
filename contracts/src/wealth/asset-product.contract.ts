import { z } from 'zod';
import { ASSET_CLASSES, CURRENCIES } from '@wealth-advisor/rules';
import { CandidateSecurityTypeDto } from './portfolio-construction.contract.ts';

export const AssetProductDto = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  assetClass: z.enum(ASSET_CLASSES),
  securityType: CandidateSecurityTypeDto,
  denominationCurrency: z.enum(CURRENCIES),
  riskRating: z.number().int().min(1).max(10),
  expenseRatio: z.number(),
  annualizedYield: z.number(),
  threeYearReturn: z.number(),
  fiveYearReturn: z.number(),
  domicileCountry: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  updatedAt: z.string(),
});
export type AssetProductDto = z.infer<typeof AssetProductDto>;

export const AssetProductListResponse = z.object({
  products: z.array(AssetProductDto),
});
export type AssetProductListResponse = z.infer<typeof AssetProductListResponse>;
