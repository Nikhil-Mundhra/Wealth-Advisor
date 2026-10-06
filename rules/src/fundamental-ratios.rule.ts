// Fundamental financial ratios that drive asset allocation decisions.
// Sources:
// - Damodaran (2012) Investment Valuation: Valuation relative to own historical percentile rather than cross-market averages.
// - Graham, Dodd & Cottle (1962) Security Analysis / CFA Fixed Income Standards: Interest Coverage Ratio (ICR >= 3.0) and Net Debt/EBITDA (<= 3.5) for corporate bond safety.
// - Solnik (1974) / Eun & Resnick (1988): Foreign currency revenue exposure at the asset level requiring currency overlay.

export const VALUATION_PERCENTILE_ELEVATED = 85;
export const VALUATION_PERCENTILE_ATTRACTIVE = 20;

export const BOND_ICR_MIN_SAFE = 3.0;
export const BOND_NET_DEBT_TO_EBITDA_MAX = 3.5;

export const ASSET_FOREIGN_REVENUE_FX_TRIGGER = 0.30;
export const FCF_PAYOUT_RATIO_MAX = 0.90;

export const TACTICAL_TILTS = ['TRIM', 'NEUTRAL', 'ACCUMULATE'] as const;
export type TacticalTilt = (typeof TACTICAL_TILTS)[number];

export const BOND_SOLVENCY_GRADES = ['INVESTMENT_GRADE', 'VULNERABLE'] as const;
export type BondSolvencyGrade = (typeof BOND_SOLVENCY_GRADES)[number];

export const FUNDAMENTAL_SIGNALS = ['favorable', 'neutral', 'caution'] as const;
export type FundamentalSignal = (typeof FUNDAMENTAL_SIGNALS)[number];

export interface AssetFundamentalMetrics {
  symbol: string;
  valuationPercentile5Y: number; // 0 to 100
  interestCoverageRatio?: number; // EBIT / Interest
  netDebtToEbitda?: number; // Net Debt / EBITDA
  foreignRevenueRatio: number; // 0.0 to 1.0
  fcfPayoutRatio?: number; // Free cash flow payout ratio
}

export interface FundamentalEvaluation {
  symbol: string;
  tacticalTilt: TacticalTilt;
  bondGrade?: BondSolvencyGrade;
  requiresFxHedge: boolean;
  signal: FundamentalSignal;
  clientSummaryKey: string;
}

// Valuation tilt against own 5-year percentile (not global averages).
export function evaluateValuationTilt(percentile5Y: number): TacticalTilt {
  if (percentile5Y >= VALUATION_PERCENTILE_ELEVATED) return 'TRIM';
  if (percentile5Y <= VALUATION_PERCENTILE_ATTRACTIVE) return 'ACCUMULATE';
  return 'NEUTRAL';
}

// Corporate bond solvency filter.
export function evaluateBondSolvency(icr: number, netDebtToEbitda: number): BondSolvencyGrade {
  if (icr < BOND_ICR_MIN_SAFE || netDebtToEbitda > BOND_NET_DEBT_TO_EBITDA_MAX) {
    return 'VULNERABLE';
  }
  return 'INVESTMENT_GRADE';
}

// Determines whether foreign revenue creates an unhedged mismatch against liability currencies.
export function requiresAssetFxHedge(foreignRevenueRatio: number, isCorridorMismatched: boolean): boolean {
  return isCorridorMismatched && foreignRevenueRatio >= ASSET_FOREIGN_REVENUE_FX_TRIGGER;
}

// Evaluates an asset's fundamentals and outputs decisions understandable by retail investors.
export function evaluateAssetFundamentals(
  metrics: AssetFundamentalMetrics,
  isCorridorMismatched = false,
): FundamentalEvaluation {
  const tacticalTilt = evaluateValuationTilt(metrics.valuationPercentile5Y);
  const needsHedge = requiresAssetFxHedge(metrics.foreignRevenueRatio, isCorridorMismatched);

  let bondGrade: BondSolvencyGrade | undefined;
  if (metrics.interestCoverageRatio !== undefined && metrics.netDebtToEbitda !== undefined) {
    bondGrade = evaluateBondSolvency(metrics.interestCoverageRatio, metrics.netDebtToEbitda);
  }

  // Derive human-friendly signal badge
  let signal: FundamentalSignal = 'neutral';
  let clientSummaryKey = 'fundamental.signal.neutral';

  if (bondGrade === 'VULNERABLE' || (metrics.fcfPayoutRatio !== undefined && metrics.fcfPayoutRatio > FCF_PAYOUT_RATIO_MAX)) {
    signal = 'caution';
    clientSummaryKey = 'fundamental.signal.caution';
  } else if (tacticalTilt === 'ACCUMULATE' && (bondGrade === undefined || bondGrade === 'INVESTMENT_GRADE')) {
    signal = 'favorable';
    clientSummaryKey = 'fundamental.signal.attractive';
  } else if (tacticalTilt === 'TRIM') {
    signal = 'caution';
    clientSummaryKey = 'fundamental.signal.elevated';
  }

  return {
    symbol: metrics.symbol,
    tacticalTilt,
    bondGrade,
    requiresFxHedge: needsHedge,
    signal,
    clientSummaryKey,
  };
}
