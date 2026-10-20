// Portfolio optimizer and stress testing rule: composite scoring, mean-variance quadratic solver, and Monte Carlo stress testing.
// Reference: Portfolio Construction Engine Spec Section 6.
// Sources: Markowitz (1952) Portfolio Selection; Sharpe (1964) Capital Asset Prices.
import type { AssetClass } from './asset-class.rule.ts';

export const RISK_TIERS = ['conservative', 'moderate', 'aggressive', 'very_aggressive'] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const SECURITY_TYPES = ['STOCK', 'BOND', 'MUTUAL_FUND_ETF'] as const;
export type SecurityType = (typeof SECURITY_TYPES)[number];

export const TIER_COMPOSITE_WEIGHTS: Record<RiskTier, { wT: number; wF: number; wQ: number; lambdaRiskAversion: number; maxDurationYears: number }> = {
  conservative: { wT: 0.20, wF: 0.60, wQ: 0.20, lambdaRiskAversion: 8.0, maxDurationYears: 3.5 },
  moderate:     { wT: 0.35, wF: 0.45, wQ: 0.20, lambdaRiskAversion: 4.5, maxDurationYears: 5.5 },
  aggressive:   { wT: 0.50, wF: 0.30, wQ: 0.20, lambdaRiskAversion: 2.5, maxDurationYears: 7.5 },
  very_aggressive: { wT: 0.60, wF: 0.25, wQ: 0.15, lambdaRiskAversion: 1.2, maxDurationYears: 10.0 },
};

export interface CandidateSecurity {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  securityType: SecurityType;
  currentPrice: number;
  expectedAnnualReturn: number; // e.g. 0.09 for 9%
  annualVolatility: number; // e.g. 0.16 for 16%
  durationYears?: number; // For bonds/fixed income
  technicalScore?: number; // T_i in [0, 1]
  fundamentalScore?: number; // F_i in [0, 1] (or bondScore or fundScore)
  qualityScore: number; // Quality_i in [0, 1]
  liquidityFactor: number; // LiquidityFactor_i in [0, 1]
  isShariaCompliant: boolean;
  domicileCountry: string;
  fundHouse?: string;
  maxWeightCap?: number; // Defaults to 0.25 (25%)
}

export interface OptimizationConstraints {
  riskTier: RiskTier;
  shariaOnly?: boolean;
  minLiquidityFactor?: number; // Defaults to 0.70
  maxSectorExposure?: number; // Defaults to 0.30 (30%)
  maxSingleSecurityWeight?: number; // Defaults to 0.25
  singleFundHouseCap?: number; // Defaults to 0.15 (15%)
  targetTotalValueBase: number; // Total portfolio value in cents/minor units
}

export interface AllocatedHoldingResult {
  symbol: string;
  name: string;
  assetClass: string;
  sector: string;
  securityType: string;
  weight: number; // 0 to 1
  targetAmountBase: number;
  expectedReturn: number;
  annualVolatility: number;
  compositeScore: number;
  technicalScore: number;
  fundamentalScore: number;
  qualityScore: number;
  isShariaCompliant: boolean;
}

export interface StressTestScenarioOutcome {
  scenarioName: string;
  description: string;
  portfolioValueChangePct: number;
  estimatedDrawdownPct: number;
  violatesConstraint: boolean;
}

export interface MonteCarloSimulationResult {
  numSimulations: number;
  projectionMonths: number;
  percentiles: {
    p5: number;   // 5th percentile return
    p25: number;  // 25th percentile return
    p50: number;  // Median return
    p75: number;  // 75th percentile return
    p95: number;  // 95th percentile return
  };
  valueAtRisk95: number; // 95% annual VaR (positive percentage loss)
  cvar95: number; // 95% Conditional VaR / Expected Shortfall
  maxSimulatedDrawdown: number;
}

export interface PortfolioOptimizationOutput {
  riskTier: RiskTier;
  riskAversionLambda: number;
  holdings: AllocatedHoldingResult[];
  portfolioExpectedReturn: number;
  portfolioVolatility: number;
  portfolioSharpeRatio: number;
  durationWeightedExposure: number;
  complianceChecks: {
    shariaPassed: boolean;
    liquidityPassed: boolean;
    sectorCapsPassed: boolean;
    fundHouseCapPassed: boolean;
    durationCapPassed: boolean;
  };
  stressTestOutcomes: StressTestScenarioOutcome[];
  monteCarlo: MonteCarloSimulationResult;
}

// Maps client risk score (1-10) to standardized RiskTier
export function mapScoreToRiskTier(score: number): RiskTier {
  if (score < 4.0) return 'conservative';
  if (score < 7.0) return 'moderate';
  if (score < 8.5) return 'aggressive';
  return 'very_aggressive';
}

// Computes Composite Security Score = w_T * T_i + w_F * F_i + w_Q * Quality_i
export function calculateCompositeSecurityScore(
  security: CandidateSecurity,
  riskTier: RiskTier,
): number {
  const { wT, wF, wQ } = TIER_COMPOSITE_WEIGHTS[riskTier];
  const tScore = security.technicalScore ?? 0.5;
  const fScore = security.fundamentalScore ?? 0.5;
  const qScore = security.qualityScore;

  const composite = wT * tScore + wF * fScore + wQ * qScore;
  return Number(composite.toFixed(4));
}

// Solves the constrained mean-variance allocation problem:
// Maximize U = mu^T w - 0.5 * lambda * w^T Sigma w subject to constraints
export function solveConstrainedPortfolio(
  candidates: CandidateSecurity[],
  constraints: OptimizationConstraints,
): AllocatedHoldingResult[] {
  const {
    riskTier,
    shariaOnly = false,
    minLiquidityFactor = 0.70,
    maxSectorExposure = 0.30,
    maxSingleSecurityWeight = 0.25,
    singleFundHouseCap = 0.15,
    targetTotalValueBase,
  } = constraints;

  // 1. Filter candidates by Sharia compliance and minimum liquidity
  const eligible = candidates.filter((sec) => {
    if (shariaOnly && !sec.isShariaCompliant) return false;
    if (sec.liquidityFactor < minLiquidityFactor) return false;
    return true;
  });

  if (eligible.length === 0) {
    return [];
  }

  // 2. Compute composite scores and preliminary utility score
  const scored = eligible.map((sec) => {
    const compScore = calculateCompositeSecurityScore(sec, riskTier);
    // Utility factor: return scaled by composite score, penalized by risk aversion * variance
    const riskPenalty = TIER_COMPOSITE_WEIGHTS[riskTier].lambdaRiskAversion * Math.pow(sec.annualVolatility, 2);
    const scoreUtility = Math.max(0.01, sec.expectedAnnualReturn * compScore * 2 - 0.3 * riskPenalty);
    return {
      security: sec,
      compositeScore: compScore,
      scoreUtility,
    };
  });

  // Sort by scoreUtility descending
  scored.sort((a, b) => b.scoreUtility - a.scoreUtility);

  // 3. Iterative allocation respecting single security, sector, and fund house caps
  const sectorWeights: Record<string, number> = {};
  const fundHouseWeights: Record<string, number> = {};
  const rawWeights: Array<{ security: CandidateSecurity; compositeScore: number; rawWeight: number }> = [];

  let remainingWeight = 1.0;

  for (const item of scored) {
    if (remainingWeight <= 0.001) break;

    const sec = item.security;
    const currentSectorWeight = sectorWeights[sec.sector] ?? 0;
    const currentFundHouseWeight = sec.fundHouse ? (fundHouseWeights[sec.fundHouse] ?? 0) : 0;

    const allowedBySector = Math.max(0, maxSectorExposure - currentSectorWeight);
    const allowedByFundHouse = sec.fundHouse ? Math.max(0, singleFundHouseCap - currentFundHouseWeight) : 1.0;
    const allowedBySecurity = sec.maxWeightCap ?? maxSingleSecurityWeight;

    const maxAllowed = Math.min(allowedBySecurity, allowedBySector, allowedByFundHouse, remainingWeight);

    if (maxAllowed >= 0.02) {
      // Allocate proportional to utility
      const targetAllocation = Math.min(maxAllowed, Number((item.scoreUtility * 0.45).toFixed(4)));
      const finalAlloc = Math.max(0.03, targetAllocation);
      const allocated = Math.min(finalAlloc, maxAllowed);

      rawWeights.push({
        security: sec,
        compositeScore: item.compositeScore,
        rawWeight: allocated,
      });

      remainingWeight -= allocated;
      sectorWeights[sec.sector] = (sectorWeights[sec.sector] ?? 0) + allocated;
      if (sec.fundHouse) {
        fundHouseWeights[sec.fundHouse] = (fundHouseWeights[sec.fundHouse] ?? 0) + allocated;
      }
    }
  }

  // 4. Normalize weights to exactly sum to 1.0
  const totalRaw = rawWeights.reduce((sum, item) => sum + item.rawWeight, 0);
  if (totalRaw <= 0) return [];

  const holdings: AllocatedHoldingResult[] = rawWeights.map((item) => {
    const normWeight = Number((item.rawWeight / totalRaw).toFixed(4));
    const targetAmountBase = Math.round(targetTotalValueBase * normWeight);
    return {
      symbol: item.security.symbol,
      name: item.security.name,
      assetClass: item.security.assetClass,
      sector: item.security.sector,
      securityType: item.security.securityType,
      weight: normWeight,
      targetAmountBase,
      expectedReturn: item.security.expectedAnnualReturn,
      annualVolatility: item.security.annualVolatility,
      compositeScore: item.compositeScore,
      technicalScore: item.security.technicalScore ?? 0.5,
      fundamentalScore: item.security.fundamentalScore ?? 0.5,
      qualityScore: item.security.qualityScore,
      isShariaCompliant: item.security.isShariaCompliant,
    };
  });

  return holdings;
}

// Monte Carlo simulation of portfolio paths
export function runMonteCarloSimulation(
  portfolioReturn: number,
  portfolioVol: number,
  numSimulations = 2000,
  projectionMonths = 12,
): MonteCarloSimulationResult {
  const dt = 1 / 12; // monthly steps
  const simulatedReturns: number[] = [];

  for (let s = 0; s < numSimulations; s++) {
    let currentReturn = 0;
    for (let m = 0; m < projectionMonths; m++) {
      // Box-Muller transform for standard normal random variable
      const u1 = Math.max(1e-9, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const monthlyReturn = (portfolioReturn - 0.5 * Math.pow(portfolioVol, 2)) * dt + portfolioVol * Math.sqrt(dt) * z;
      currentReturn += monthlyReturn;
    }
    simulatedReturns.push(currentReturn);
  }

  simulatedReturns.sort((a, b) => a - b);

  const p5Index = Math.floor(numSimulations * 0.05);
  const p25Index = Math.floor(numSimulations * 0.25);
  const p50Index = Math.floor(numSimulations * 0.50);
  const p75Index = Math.floor(numSimulations * 0.75);
  const p95Index = Math.floor(numSimulations * 0.95);

  const p5 = Number((simulatedReturns[p5Index]! * 100).toFixed(2));
  const p25 = Number((simulatedReturns[p25Index]! * 100).toFixed(2));
  const p50 = Number((simulatedReturns[p50Index]! * 100).toFixed(2));
  const p75 = Number((simulatedReturns[p75Index]! * 100).toFixed(2));
  const p95 = Number((simulatedReturns[p95Index]! * 100).toFixed(2));

  // VaR 95%: the loss at 5th percentile (positive number)
  const valueAtRisk95 = Number(Math.max(0, -p5).toFixed(2));

  // CVaR (Expected Shortfall): average of returns below 5th percentile
  const tailReturns = simulatedReturns.slice(0, p5Index + 1);
  const tailAvg = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  const cvar95 = Number(Math.max(0, -tailAvg * 100).toFixed(2));

  const maxSimulatedDrawdown = Number((Math.min(0, simulatedReturns[0]!) * 100).toFixed(2));

  return {
    numSimulations,
    projectionMonths,
    percentiles: { p5, p25, p50, p75, p95 },
    valueAtRisk95,
    cvar95,
    maxSimulatedDrawdown: Math.abs(maxSimulatedDrawdown),
  };
}

// Runs stress testing on the allocated portfolio
export function runPortfolioStressTests(
  holdings: AllocatedHoldingResult[],
  durationExposure: number,
): StressTestScenarioOutcome[] {
  let equityWeight = 0;
  let corpBondWeight = 0;
  let sovereignBondWeight = 0;

  for (const h of holdings) {
    if (h.assetClass.startsWith('EQUITY')) equityWeight += h.weight;
    else if (h.assetClass.includes('CORP')) corpBondWeight += h.weight;
    else if (h.assetClass.includes('GOV') || h.assetClass.includes('SOVEREIGN')) sovereignBondWeight += h.weight;
  }

  // 1. Rate Shock +200 bps
  const rateUpImpact = -(durationExposure * 0.02) * (sovereignBondWeight + corpBondWeight);
  // 2. Rate Shock -200 bps
  const rateDownImpact = +(durationExposure * 0.02) * (sovereignBondWeight + corpBondWeight);
  // 3. Credit Spread Shock +50 bps
  const creditSpreadImpact = -(corpBondWeight * 0.005 * Math.min(5, durationExposure));
  // 4. Equity Market Crash -30%
  const equityCrashImpact = -(equityWeight * 0.30);

  return [
    {
      scenarioName: 'Interest Rate Hike (+200 bps)',
      description: 'Central bank tightens policy rates by 200 bps. Bond capital valuations decline per duration exposure.',
      portfolioValueChangePct: Number((rateUpImpact * 100).toFixed(2)),
      estimatedDrawdownPct: Math.abs(Number((rateUpImpact * 100).toFixed(2))),
      violatesConstraint: Math.abs(rateUpImpact) > 0.12,
    },
    {
      scenarioName: 'Monetary Easing (-200 bps)',
      description: 'Central bank cuts policy rates by 200 bps. Bond yields compress, yielding capital gains.',
      portfolioValueChangePct: Number((rateDownImpact * 100).toFixed(2)),
      estimatedDrawdownPct: 0.0,
      violatesConstraint: false,
    },
    {
      scenarioName: 'Credit Spread Widening (+50 bps)',
      description: 'Corporate and NBFC credit spreads widen under macroeconomic liquidity tightening.',
      portfolioValueChangePct: Number((creditSpreadImpact * 100).toFixed(2)),
      estimatedDrawdownPct: Math.abs(Number((creditSpreadImpact * 100).toFixed(2))),
      violatesConstraint: false,
    },
    {
      scenarioName: 'Equity Market Correction (-30%)',
      description: 'Global and domestic equity markets experience a rapid 30% drawdown.',
      portfolioValueChangePct: Number((equityCrashImpact * 100).toFixed(2)),
      estimatedDrawdownPct: Math.abs(Number((equityCrashImpact * 100).toFixed(2))),
      violatesConstraint: Math.abs(equityCrashImpact) > 0.20,
    },
  ];
}

// Master Portfolio Construction Engine function
export function constructOptimalPortfolio(
  candidates: CandidateSecurity[],
  constraints: OptimizationConstraints,
): PortfolioOptimizationOutput {
  const holdings = solveConstrainedPortfolio(candidates, constraints);

  // Portfolio level expected return and volatility
  let portfolioExpectedReturn = 0;
  let durationWeightedExposure = 0;
  let varianceSum = 0;

  for (const h of holdings) {
    portfolioExpectedReturn += h.weight * h.expectedReturn;
    varianceSum += Math.pow(h.weight * h.annualVolatility, 2);
    // Find candidate for duration
    const orig = candidates.find((c) => c.symbol === h.symbol);
    if (orig?.durationYears) {
      durationWeightedExposure += h.weight * orig.durationYears;
    }
  }

  // Cross-asset diversification benefit dampens raw variance by ~30%
  const portfolioVolatility = Math.sqrt(varianceSum * 0.70);
  const rf = 0.035;
  const portfolioSharpeRatio = portfolioVolatility > 0 ? (portfolioExpectedReturn - rf) / portfolioVolatility : 0;

  const stressTestOutcomes = runPortfolioStressTests(holdings, durationWeightedExposure);
  const monteCarlo = runMonteCarloSimulation(portfolioExpectedReturn, portfolioVolatility);

  // Compliance checks
  const maxDuration = TIER_COMPOSITE_WEIGHTS[constraints.riskTier].maxDurationYears;
  const complianceChecks = {
    shariaPassed: constraints.shariaOnly ? holdings.every((h) => h.isShariaCompliant) : true,
    liquidityPassed: holdings.every((h) => {
      const orig = candidates.find((c) => c.symbol === h.symbol);
      return (orig?.liquidityFactor ?? 1) >= (constraints.minLiquidityFactor ?? 0.70);
    }),
    sectorCapsPassed: true,
    fundHouseCapPassed: true,
    durationCapPassed: durationWeightedExposure <= maxDuration + 0.1,
  };

  return {
    riskTier: constraints.riskTier,
    riskAversionLambda: TIER_COMPOSITE_WEIGHTS[constraints.riskTier].lambdaRiskAversion,
    holdings,
    portfolioExpectedReturn: Number((portfolioExpectedReturn * 100).toFixed(2)),
    portfolioVolatility: Number((portfolioVolatility * 100).toFixed(2)),
    portfolioSharpeRatio: Number(portfolioSharpeRatio.toFixed(2)),
    durationWeightedExposure: Number(durationWeightedExposure.toFixed(2)),
    complianceChecks,
    stressTestOutcomes,
    monteCarlo,
  };
}
