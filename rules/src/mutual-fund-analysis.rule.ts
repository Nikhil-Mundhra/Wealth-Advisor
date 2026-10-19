// Mutual fund performance analysis rule: Sharpe, Sortino, Alpha, Information Ratio, M2, expense screening, and diversification caps.
// Reference: Portfolio Construction Engine Spec Section 5.
// Sources: Sharpe (1966) Mutual Fund Performance; Sortino & Price (1994) Performance Measurement in a Downside Risk Framework; Morningstar Rating Methodology.

export const FUND_CATEGORIES = [
  'EQUITY',
  'DEBT',
  'HYBRID',
  'INDEX',
  'ELSS',
  'SHARIA_COMPLIANT',
  'MONEY_MARKET',
] as const;
export type FundCategory = (typeof FUND_CATEGORIES)[number];

export interface MutualFundMetricsInput {
  fundSymbol: string;
  fundName: string;
  fundHouse: string;
  category: FundCategory;
  annualizedReturn: number; // e.g. 0.12 for 12%
  annualizedVolatility: number; // e.g. 0.15 for 15%
  downsideVolatility?: number; // e.g. 0.09
  riskFreeRate?: number; // e.g. 0.035
  minimumAcceptableReturn?: number; // MAR, default equal to risk-free rate
  benchmarkReturn: number; // e.g. 0.10
  benchmarkVolatility: number; // e.g. 0.14
  beta: number; // e.g. 0.95
  trackingError?: number; // e.g. 0.02
  expenseRatio: number; // e.g. 0.007 for 0.70%
  aumGrowthRate?: number; // 1-year AUM growth, e.g. 0.08
  morningstarRating?: number; // 1 to 5
  esgScore?: number; // 0 to 100
  regulatoryRegistration: 'SEBI' | 'SCA' | 'UCITS' | 'SEC' | 'OTHER';
  isShariaCompliant?: boolean;
}

export interface MutualFundEvaluationResult {
  sharpeRatio: number;
  sortinoRatio: number;
  alpha: number;
  informationRatio: number;
  modiglianiM2: number;
  expenseFilterPassed: boolean;
  riskTierAlignment: {
    conservative: boolean;
    moderate: boolean;
    aggressive: boolean;
  };
  compositeFundScore: number; // Normalized [0, 1]
  isCompliant: boolean;
  complianceNotes: string[];
}

// Computes Sharpe Ratio = (Return - R_f) / Volatility
export function calculateSharpeRatio(annualReturn: number, riskFreeRate: number, volatility: number): number {
  if (volatility <= 0) return 0;
  const sharpe = (annualReturn - riskFreeRate) / volatility;
  return Number(sharpe.toFixed(4));
}

// Computes Sortino Ratio = (Return - MAR) / DownsideVolatility
export function calculateSortinoRatio(annualReturn: number, mar: number, downsideVol: number): number {
  if (downsideVol <= 0) return 0;
  const sortino = (annualReturn - mar) / downsideVol;
  return Number(sortino.toFixed(4));
}

// Computes Jensen's Alpha = FundReturn - (Beta * BenchmarkReturn)
// Or with risk-free rate: Alpha = (FundReturn - Rf) - Beta * (BenchmarkReturn - Rf)
export function calculateJensenAlpha(
  fundReturn: number,
  benchmarkReturn: number,
  beta: number,
  riskFreeRate = 0,
): number {
  const alpha = (fundReturn - riskFreeRate) - beta * (benchmarkReturn - riskFreeRate);
  return Number(alpha.toFixed(4));
}

// Computes Information Ratio = Alpha / TrackingError
export function calculateInformationRatio(alpha: number, trackingError: number): number {
  if (trackingError <= 0) return 0;
  return Number((alpha / trackingError).toFixed(4));
}

// Computes Modigliani-Modigliani (M2) = Sharpe * BenchmarkVolatility + RiskFreeRate
export function calculateModiglianiM2(sharpe: number, benchmarkVol: number, riskFreeRate: number): number {
  const m2 = sharpe * benchmarkVol + riskFreeRate;
  return Number(m2.toFixed(4));
}

// Evaluates whether expense ratio passes fiduciary threshold:
// Equity funds <= 2.0% (0.02); Debt/Money Market funds <= 1.0% (0.01) unless alpha justifies it
export function evaluateExpenseRatio(expenseRatio: number, category: FundCategory, alpha: number): boolean {
  const maxExpense = category === 'DEBT' || category === 'MONEY_MARKET' ? 0.01 : 0.02;
  if (expenseRatio <= maxExpense) return true;
  // If expense exceeds cap, it can only be justified if Alpha > 2% excess return
  return alpha >= 0.02;
}

// Evaluates single fund house concentration limit (<= 15% of total mutual fund portfolio allocation)
export function evaluateFundHouseConcentration(
  fundHouseAllocations: Record<string, number>, // fundHouse -> weight decimal (0..1)
  maxConcentration = 0.15,
): { isDiversified: boolean; offendingFundHouses: string[] } {
  const offendingFundHouses: string[] = [];
  for (const [house, weight] of Object.entries(fundHouseAllocations)) {
    if (weight > maxConcentration + 0.0001) {
      offendingFundHouses.push(house);
    }
  }
  return {
    isDiversified: offendingFundHouses.length === 0,
    offendingFundHouses,
  };
}

// Comprehensive evaluation of a mutual fund / ETF candidate
export function evaluateMutualFund(input: MutualFundMetricsInput): MutualFundEvaluationResult {
  const rf = input.riskFreeRate ?? 0.035;
  const mar = input.minimumAcceptableReturn ?? rf;
  const downsideVol = input.downsideVolatility ?? input.annualizedVolatility * 0.7;
  const trackingError = input.trackingError ?? 0.02;

  const sharpe = calculateSharpeRatio(input.annualizedReturn, rf, input.annualizedVolatility);
  const sortino = calculateSortinoRatio(input.annualizedReturn, mar, downsideVol);
  const alpha = calculateJensenAlpha(input.annualizedReturn, input.benchmarkReturn, input.beta, rf);
  const informationRatio = calculateInformationRatio(alpha, trackingError);
  const m2 = calculateModiglianiM2(sharpe, input.benchmarkVolatility, rf);

  const expenseFilterPassed = evaluateExpenseRatio(input.expenseRatio, input.category, alpha);

  // Risk alignment
  const conservativeAligned = input.beta <= 0.8 && input.annualizedVolatility <= 0.10;
  const moderateAligned = input.beta <= 1.15 && input.annualizedVolatility <= 0.18;
  const aggressiveAligned = true; // Aggressive accommodates high beta

  // Normalizations for composite score:
  // Sharpe: <= 0 -> 0; >= 2.0 -> 1.0
  const normSharpe = Math.max(0, Math.min(1, sharpe / 2.0));
  // Alpha: <= -0.02 -> 0; >= 0.05 -> 1.0
  const normAlpha = Math.max(0, Math.min(1, (alpha + 0.02) / 0.07));
  // Expense: lower is better; 0% -> 1.0; 2.5% -> 0.0
  const normExpense = Math.max(0, Math.min(1, 1 - input.expenseRatio / 0.025));
  // AUM Growth: <= 0 -> 0; >= 20% -> 1.0
  const aumGrowth = input.aumGrowthRate ?? 0.05;
  const normAumGrowth = Math.max(0, Math.min(1, aumGrowth / 0.20));
  // ESG: 0-100 -> 0-1
  const normEsg = (input.esgScore ?? 60) / 100;

  // Composite score: Spec weights Sharpe (0.3), Alpha (0.2), Expense (0.2), AUM (0.1), ESG (0.2)
  const compositeFundScore = Number(
    (0.30 * normSharpe + 0.20 * normAlpha + 0.20 * normExpense + 0.10 * normAumGrowth + 0.20 * normEsg).toFixed(4),
  );

  const complianceNotes: string[] = [];
  if (input.regulatoryRegistration === 'SEBI') {
    complianceNotes.push('SEBI registered mutual fund under Indian regulatory framework');
  } else if (input.regulatoryRegistration === 'SCA') {
    complianceNotes.push('SCA registered fund under UAE Securities and Commodities Authority');
  } else if (input.regulatoryRegistration === 'UCITS') {
    complianceNotes.push('UCITS IV/V compliant institutional product');
  }

  if (input.isShariaCompliant) {
    complianceNotes.push('Certified Sharia-compliant (AAOIFI standards / Fatwa audited)');
  }

  if (!expenseFilterPassed) {
    complianceNotes.push(`Expense ratio ${(input.expenseRatio * 100).toFixed(2)}% exceeds fiduciary limit without compensating alpha`);
  }

  return {
    sharpeRatio: sharpe,
    sortinoRatio: sortino,
    alpha,
    informationRatio,
    modiglianiM2: m2,
    expenseFilterPassed,
    riskTierAlignment: {
      conservative: conservativeAligned,
      moderate: moderateAligned,
      aggressive: aggressiveAligned,
    },
    compositeFundScore,
    isCompliant: expenseFilterPassed,
    complianceNotes,
  };
}
