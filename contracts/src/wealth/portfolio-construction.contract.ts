import { z } from 'zod';
import { ASSET_CLASSES, SECURITY_TYPES } from '@wealth-advisor/rules';

export const CandidateSecurityTypeDto = z.enum(SECURITY_TYPES);
export type CandidateSecurityTypeDto = z.infer<typeof CandidateSecurityTypeDto>;

export const RiskTierEnum = z.enum(['conservative', 'moderate', 'aggressive', 'very_aggressive']);
export type RiskTierEnum = z.infer<typeof RiskTierEnum>;

export const JurisdictionEnum = z.enum(['INDIA', 'UAE', 'US', 'GLOBAL']);
export type JurisdictionEnum = z.infer<typeof JurisdictionEnum>;

export const AllocatedHoldingDto = z.object({
  symbol: z.string(),
  name: z.string(),
  assetClass: z.enum(ASSET_CLASSES),
  sector: z.string(),
  securityType: CandidateSecurityTypeDto,
  weight: z.number(), // 0 to 1
  targetAmountBase: z.number().int(), // minor units / cents
  expectedReturn: z.number(),
  annualVolatility: z.number(),
  compositeScore: z.number(),
  technicalScore: z.number(),
  fundamentalScore: z.number(),
  qualityScore: z.number(),
  isShariaCompliant: z.boolean(),
});
export type AllocatedHoldingDto = z.infer<typeof AllocatedHoldingDto>;

export const StressTestOutcomeDto = z.object({
  scenarioName: z.string(),
  description: z.string(),
  portfolioValueChangePct: z.number(),
  estimatedDrawdownPct: z.number(),
  violatesConstraint: z.boolean(),
});
export type StressTestOutcomeDto = z.infer<typeof StressTestOutcomeDto>;

export const MonteCarloPercentilesDto = z.object({
  p5: z.number(),
  p25: z.number(),
  p50: z.number(),
  p75: z.number(),
  p95: z.number(),
});
export type MonteCarloPercentilesDto = z.infer<typeof MonteCarloPercentilesDto>;

export const MonteCarloResultDto = z.object({
  numSimulations: z.number().int(),
  projectionMonths: z.number().int(),
  percentiles: MonteCarloPercentilesDto,
  valueAtRisk95: z.number(),
  cvar95: z.number(),
  maxSimulatedDrawdown: z.number(),
});
export type MonteCarloResultDto = z.infer<typeof MonteCarloResultDto>;

export const ConstructPortfolioRequest = z.object({
  riskTier: RiskTierEnum.optional(),
  statedRiskScore: z.number().min(1).max(10).optional(),
  jurisdiction: JurisdictionEnum.optional(),
  shariaOnly: z.boolean().optional(),
  minLiquidityFactor: z.number().min(0).max(1).optional(),
  maxSectorExposure: z.number().min(0.05).max(1).optional(),
  maxSingleSecurityWeight: z.number().min(0.02).max(1).optional(),
  targetTotalValueBase: z.number().int().optional(),
});
export type ConstructPortfolioRequest = z.infer<typeof ConstructPortfolioRequest>;

export const ConstructPortfolioResponse = z.object({
  riskTier: RiskTierEnum,
  riskAversionLambda: z.number(),
  holdings: z.array(AllocatedHoldingDto),
  portfolioExpectedReturn: z.number(),
  portfolioVolatility: z.number(),
  portfolioSharpeRatio: z.number(),
  durationWeightedExposure: z.number(),
  complianceChecks: z.object({
    shariaPassed: z.boolean(),
    liquidityPassed: z.boolean(),
    sectorCapsPassed: z.boolean(),
    fundHouseCapPassed: z.boolean(),
    durationCapPassed: z.boolean(),
  }),
  stressTestOutcomes: z.array(StressTestOutcomeDto),
  monteCarlo: MonteCarloResultDto,
  rationale: z.object({
    personalFinance: z.string(),
    crossBorder: z.string(),
    wealthStrategy: z.string(),
    technicalAttribution: z.string(),
    fundamentalAttribution: z.string(),
    regulatoryAttribution: z.string(),
  }),
  sourceAttribution: z.array(z.string()),
});
export type ConstructPortfolioResponse = z.infer<typeof ConstructPortfolioResponse>;
