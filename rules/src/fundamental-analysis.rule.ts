// Fundamental analysis rule: intrinsic valuation models, country-specific WACC, margin of safety, and quality metrics.
// Reference: Portfolio Construction Engine Spec Section 3.
// Sources: Damodaran (2012) Investment Valuation; Graham & Dodd (1934) Security Analysis.

export interface DcfInputs {
  freeCashFlows: number[]; // FCF for projection years t=1..n
  terminalGrowthRate: number; // e.g. 0.03 for 3%
  wacc: number; // Weighted Average Cost of Capital, e.g. 0.10 for 10%
  sharesOutstanding: number;
  netDebt?: number; // Total Debt minus Cash & Equivalents
}

export interface DdmInputs {
  nextYearDividend: number; // D_1
  costOfEquity: number; // r_e, e.g. 0.11
  dividendGrowthRate: number; // g, e.g. 0.05
}

export interface EpvInputs {
  normalizedOperatingEarnings: number; // Sustainable after-tax operating earnings
  wacc: number;
  sharesOutstanding: number;
}

export interface ResidualIncomeInputs {
  currentBookValue: number;
  expectedRoe: number; // e.g. 0.16
  costOfEquity: number;
  sharesOutstanding: number;
  projectionYears?: number;
}

export interface ComparableMultiplesInputs {
  metricValue: number; // EPS, Book Value per share, or EBITDA per share
  peerMedianMultiple: number; // Peer median P/E, P/B, or EV/EBITDA
  sectorAdjustment?: number; // Adjustment factor (e.g. 0.95 or 1.05)
}

export interface WaccParams {
  equityMarketValue: number;
  debtMarketValue: number;
  costOfEquity: number;
  costOfDebt: number;
  taxRate: number; // For UAE corporate tax is 9% (or 0% free zone); India is ~25%
  isShariaCompliant?: boolean; // In UAE/Sharia context, profit-sharing rate replaces conventional debt
}

export interface FundamentalScoringInput {
  currentPrice: number;
  intrinsicValue: number;
  roe: number; // Return on equity (e.g. 0.15 for 15%)
  debtToEquity: number; // e.g. 0.4
  operatingCashFlowStable: boolean;
  epsGrowth5YCagr: number; // 5-year EPS CAGR, e.g. 0.14 for 14%
  esgScore?: number; // 0 to 100
  marketJurisdiction?: 'INDIA' | 'UAE' | 'US' | 'GLOBAL';
  isSmallCap?: boolean;
}

export interface FundamentalScoreResult {
  intrinsicValue: number;
  marginOfSafety: number; // (Intrinsic - Price) / Intrinsic
  marginOfSafetyScore: number; // Normalized [0, 1]
  qualityScore: number; // Normalized [0, 1]
  growthScore: number; // Normalized [0, 1]
  esgScore: number; // Normalized [0, 1]
  compositeFundamentalScore: number; // F_i in [0, 1]
  valuationHaircutApplied: number; // e.g. 0.10 for Indian small-cap discount
}

// Computes Country-specific WACC:
// India: WACC = (E / (E+D)) * CostEquity + (D / (E+D)) * CostDebt * (1 - TaxRate)
// UAE: Sharia-compliant cost of capital where sukuk profit rate has distinct tax/structuring profile
export function calculateCountryWacc(params: WaccParams): number {
  const totalCap = params.equityMarketValue + params.debtMarketValue;
  if (totalCap <= 0) return params.costOfEquity;

  const weightEquity = params.equityMarketValue / totalCap;
  const weightDebt = params.debtMarketValue / totalCap;

  // For Sharia-compliant sukuk capital, profit distribution is not interest but often tax-shielded under corporate tax codes
  const effectiveTaxRate = params.isShariaCompliant ? Math.min(params.taxRate, 0.09) : params.taxRate;
  const afterTaxCostOfDebt = params.costOfDebt * (1 - effectiveTaxRate);

  const wacc = weightEquity * params.costOfEquity + weightDebt * afterTaxCostOfDebt;
  return Number(wacc.toFixed(4));
}

// Discounted Cash Flow (DCF) model
export function calculateDcfIntrinsicValue(inputs: DcfInputs): number {
  const { freeCashFlows, terminalGrowthRate, wacc, sharesOutstanding, netDebt = 0 } = inputs;
  if (sharesOutstanding <= 0 || wacc <= terminalGrowthRate) return 0;

  let pvForecast = 0;
  for (let t = 0; t < freeCashFlows.length; t++) {
    const cf = freeCashFlows[t] ?? 0;
    pvForecast += cf / Math.pow(1 + wacc, t + 1);
  }

  const lastFcf = freeCashFlows[freeCashFlows.length - 1] ?? 0;
  const terminalValue = (lastFcf * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, freeCashFlows.length);

  const enterpriseValue = pvForecast + pvTerminalValue;
  const equityValue = enterpriseValue - netDebt;
  const perShareValue = equityValue / sharesOutstanding;

  return Math.max(0, Number(perShareValue.toFixed(2)));
}

// Dividend Discount Model (DDM / Gordon Growth)
export function calculateDdmIntrinsicValue(inputs: DdmInputs): number {
  const { nextYearDividend, costOfEquity, dividendGrowthRate } = inputs;
  if (costOfEquity <= dividendGrowthRate || nextYearDividend <= 0) return 0;
  const value = nextYearDividend / (costOfEquity - dividendGrowthRate);
  return Math.max(0, Number(value.toFixed(2)));
}

// Earnings Power Value (EPV)
export function calculateEpvIntrinsicValue(inputs: EpvInputs): number {
  const { normalizedOperatingEarnings, wacc, sharesOutstanding } = inputs;
  if (wacc <= 0 || sharesOutstanding <= 0) return 0;
  const totalEpv = normalizedOperatingEarnings / wacc;
  return Math.max(0, Number((totalEpv / sharesOutstanding).toFixed(2)));
}

// Comparable Multiples valuation
export function calculateMultiplesIntrinsicValue(inputs: ComparableMultiplesInputs): number {
  const { metricValue, peerMedianMultiple, sectorAdjustment = 1.0 } = inputs;
  const value = metricValue * peerMedianMultiple * sectorAdjustment;
  return Math.max(0, Number(value.toFixed(2)));
}

// Margin of Safety calculation = (Intrinsic - CurrentPrice) / Intrinsic
export function calculateMarginOfSafety(intrinsicValue: number, currentPrice: number): number {
  if (intrinsicValue <= 0) return 0;
  const mos = (intrinsicValue - currentPrice) / intrinsicValue;
  return Number(mos.toFixed(4));
}

// Normalizes Margin of Safety to [0, 1] score:
// MoS >= 0.30 (30% discount) -> 1.0; MoS <= -0.20 (20% overvalued) -> 0.0
export function normalizeMarginOfSafety(marginOfSafety: number): number {
  if (marginOfSafety >= 0.30) return 1.0;
  if (marginOfSafety <= -0.20) return 0.0;
  return Number(((marginOfSafety + 0.20) / 0.50).toFixed(4));
}

// Evaluates Quality Score based on ROE (> 12%), D/E (< 0.5), and cash flow stability
export function calculateQualityScore(roe: number, debtToEquity: number, operatingCashFlowStable: boolean): number {
  let score = 0;
  // ROE component (target > 12% = 0.12)
  if (roe >= 0.20) score += 0.40;
  else if (roe >= 0.12) score += 0.30;
  else if (roe > 0) score += 0.15;

  // Debt/Equity component (target < 0.5)
  if (debtToEquity <= 0.3) score += 0.35;
  else if (debtToEquity <= 0.5) score += 0.25;
  else if (debtToEquity <= 1.0) score += 0.10;

  // Cash flow stability
  if (operatingCashFlowStable) score += 0.25;

  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

// Evaluates Growth Score based on 5-year EPS CAGR (target > 10% = 0.10)
export function calculateGrowthScore(epsGrowth5YCagr: number): number {
  if (epsGrowth5YCagr >= 0.20) return 1.0;
  if (epsGrowth5YCagr <= 0.0) return 0.1;
  return Number((epsGrowth5YCagr / 0.20).toFixed(4));
}

// Normalizes ESG score from 0-100 to [0, 1]
export function normalizeEsgScore(esgScore?: number): number {
  if (esgScore === undefined) return 0.6; // Neutral default
  return Math.max(0, Math.min(1, Number((esgScore / 100).toFixed(4))));
}

// Full Fundamental Scoring Pipeline
export function calculateFundamentalScore(input: FundamentalScoringInput): FundamentalScoreResult {
  let adjustedIntrinsic = input.intrinsicValue;
  let valuationHaircutApplied = 0.0;

  // Market valuation bias: apply 10% haircut for Indian small caps or emerging market liquidity premium
  if (input.marketJurisdiction === 'INDIA' && input.isSmallCap) {
    valuationHaircutApplied = 0.10;
    adjustedIntrinsic = Number((adjustedIntrinsic * (1 - valuationHaircutApplied)).toFixed(2));
  }

  const marginOfSafety = calculateMarginOfSafety(adjustedIntrinsic, input.currentPrice);
  const marginOfSafetyScore = normalizeMarginOfSafety(marginOfSafety);
  const qualityScore = calculateQualityScore(input.roe, input.debtToEquity, input.operatingCashFlowStable);
  const growthScore = calculateGrowthScore(input.epsGrowth5YCagr);
  const esgScore = normalizeEsgScore(input.esgScore);

  // Composite Fundamental Score F_i = weighted sum (Spec: MoS 0.4, Quality 0.2, Growth 0.3, ESG 0.1)
  const compositeFundamentalScore = Number(
    (0.40 * marginOfSafetyScore + 0.20 * qualityScore + 0.30 * growthScore + 0.10 * esgScore).toFixed(4),
  );

  return {
    intrinsicValue: adjustedIntrinsic,
    marginOfSafety,
    marginOfSafetyScore,
    qualityScore,
    growthScore,
    esgScore,
    compositeFundamentalScore,
    valuationHaircutApplied,
  };
}
