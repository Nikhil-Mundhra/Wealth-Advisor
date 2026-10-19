// Bond valuation and pricing rule: YTM, duration, convexity, sukuk profit-rate modeling, and interest-rate stress scenarios.
// Reference: Portfolio Construction Engine Spec Section 4.
// Sources: Hull (2018) Options, Futures, and Other Derivatives; Fabozzi (2021) Bond Markets, Analysis, and Strategies.

export const BOND_TYPES = [
  'INDIAN_GSEC',
  'INDIAN_CORP_BOND',
  'UAE_SOVEREIGN_SUKUK',
  'UAE_CORP_SUKUK',
  'GLOBAL_SOVEREIGN',
  'GLOBAL_CORP',
] as const;
export type BondType = (typeof BOND_TYPES)[number];

export interface CashFlow {
  period: number; // in years or periods (t)
  amount: number;
}

export interface BondPricingInputs {
  faceValue: number; // M, typically 100 or 1000
  couponRate: number; // Annual coupon or profit rate (e.g. 0.072 for 7.2%)
  yearsToMaturity: number; // n
  paymentFrequency?: number; // 1 for annual, 2 for semi-annual (default 1)
  currentPrice: number; // Market price
  benchmarkYield?: number; // e.g. 10Y Indian G-Sec or UAE Sovereign Sukuk yield
  bondType: BondType;
  isShariaCompliant?: boolean;
}

export interface BondMetricsResult {
  ytm: number; // Annualized Yield to Maturity
  spreadBps: number; // Spread to benchmark in basis points
  macaulayDuration: number; // Years
  modifiedDuration: number; // Years
  convexity: number;
  isShariaCompliant: boolean;
}

export interface InterestRateScenarioShift {
  scenarioName: 'Base' | '+200bps' | '-200bps' | '+50bps_Credit_Stress';
  deltaYieldBps: number;
  percentagePriceChange: number; // delta P / P
  estimatedNewPrice: number;
}

// Generates scheduled coupon/profit payments and maturity repayment
export function generateBondCashFlows(
  faceValue: number,
  couponRate: number,
  yearsToMaturity: number,
  frequency = 1,
): CashFlow[] {
  const totalPeriods = Math.max(1, Math.round(yearsToMaturity * frequency));
  const periodCoupon = Number(((faceValue * couponRate) / frequency).toFixed(6));
  const cashFlows: CashFlow[] = [];

  for (let t = 1; t <= totalPeriods; t++) {
    const isMaturity = t === totalPeriods;
    cashFlows.push({
      period: t / frequency,
      amount: isMaturity ? periodCoupon + faceValue : periodCoupon,
    });
  }

  return cashFlows;
}

// Solves for Yield-to-Maturity (YTM) using Newton-Raphson method:
// Solve f(y) = sum(CF_t / (1 + y)^t) - Price = 0
export function calculateYtm(
  faceValue: number,
  couponRate: number,
  yearsToMaturity: number,
  currentPrice: number,
  frequency = 1,
): number {
  if (currentPrice <= 0 || yearsToMaturity <= 0) return 0;
  const cashFlows = generateBondCashFlows(faceValue, couponRate, yearsToMaturity, frequency);

  // Initial estimate using standard approximation formula
  let y = (couponRate * faceValue + (faceValue - currentPrice) / yearsToMaturity) / ((faceValue + currentPrice) / 2);
  y = Math.max(0.001, y / frequency);

  for (let iter = 0; iter < 100; iter++) {
    let priceEstimate = 0;
    let derivative = 0;

    for (const cf of cashFlows) {
      const discount = Math.pow(1 + y, cf.period * frequency);
      priceEstimate += cf.amount / discount;
      derivative -= (cf.period * frequency * cf.amount) / (discount * (1 + y));
    }

    const diff = priceEstimate - currentPrice;
    if (Math.abs(diff) < 1e-6) break;

    const step = diff / derivative;
    y = y - step;
    if (y < -0.99) y = 0.001; // Avoid negative/zero singularity
  }

  const annualizedYtm = y * frequency;
  return Number(annualizedYtm.toFixed(4));
}

// Computes Macaulay Duration, Modified Duration, and Convexity:
// MacaulayDuration = sum[ t * PV(CF_t) ] / Price
// ModifiedDuration = MacaulayDuration / (1 + ytm / frequency)
// Convexity = sum[ t * (t + 1/frequency) * PV(CF_t) ] / [ Price * (1 + ytm/frequency)^2 ]
export function calculateDurationAndConvexity(
  faceValue: number,
  couponRate: number,
  yearsToMaturity: number,
  currentPrice: number,
  ytm: number,
  frequency = 1,
): { macaulayDuration: number; modifiedDuration: number; convexity: number } {
  if (currentPrice <= 0 || yearsToMaturity <= 0) {
    return { macaulayDuration: 0, modifiedDuration: 0, convexity: 0 };
  }

  const cashFlows = generateBondCashFlows(faceValue, couponRate, yearsToMaturity, frequency);
  const periodYield = ytm / frequency;

  let weightedPvSum = 0;
  let convexitySum = 0;
  let totalPv = 0;

  for (const cf of cashFlows) {
    const t = cf.period; // in years
    const pv = cf.amount / Math.pow(1 + periodYield, t * frequency);
    totalPv += pv;
    weightedPvSum += t * pv;
    convexitySum += t * (t + 1 / frequency) * pv;
  }

  const denominatorPrice = totalPv > 0 ? totalPv : currentPrice;
  const macaulayDuration = weightedPvSum / denominatorPrice;
  const modifiedDuration = macaulayDuration / (1 + periodYield);
  const convexity = convexitySum / (denominatorPrice * Math.pow(1 + periodYield, 2));

  return {
    macaulayDuration: Number(macaulayDuration.toFixed(4)),
    modifiedDuration: Number(modifiedDuration.toFixed(4)),
    convexity: Number(convexity.toFixed(4)),
  };
}

// Yield curve bootstrapping for spot rates
export function bootstrapSpotCurve(parRates: Array<{ maturityYears: number; parYield: number }>): Array<{ maturityYears: number; spotRate: number }> {
  const sorted = [...parRates].sort((a, b) => a.maturityYears - b.maturityYears);
  const spotRates: Array<{ maturityYears: number; spotRate: number }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const { maturityYears, parYield } = sorted[i]!;
    if (i === 0) {
      spotRates.push({ maturityYears, spotRate: parYield });
      continue;
    }

    let pvCoupons = 0;
    for (let j = 0; j < i; j++) {
      const prevSpot = spotRates[j]!.spotRate;
      pvCoupons += (100 * parYield) / Math.pow(1 + prevSpot, sorted[j]!.maturityYears);
    }

    const remainingValue = 100 - pvCoupons;
    const finalCashFlow = 100 * (1 + parYield);
    const spot = Math.pow(finalCashFlow / remainingValue, 1 / maturityYears) - 1;
    spotRates.push({ maturityYears, spotRate: Number(spot.toFixed(4)) });
  }

  return spotRates;
}

// Forward rate derivation: f(t1, t2) = [ (1 + s2)^t2 / (1 + s1)^t1 ]^(1 / (t2 - t1)) - 1
export function calculateForwardRate(t1: number, spotRate1: number, t2: number, spotRate2: number): number {
  if (t2 <= t1) return spotRate1;
  const factor1 = Math.pow(1 + spotRate1, t1);
  const factor2 = Math.pow(1 + spotRate2, t2);
  const forward = Math.pow(factor2 / factor1, 1 / (t2 - t1)) - 1;
  return Number(forward.toFixed(4));
}

// Simulates interest-rate and credit spread macro scenarios:
// Formula: delta P / P approx -ModifiedDuration * delta Y + 0.5 * Convexity * (delta Y)^2
export function simulateBondInterestRateScenarios(
  currentPrice: number,
  modifiedDuration: number,
  convexity: number,
  isCorporate = false,
): InterestRateScenarioShift[] {
  const scenarios: Array<{ name: InterestRateScenarioShift['scenarioName']; deltaY: number }> = [
    { name: 'Base', deltaY: 0.0 },
    { name: '+200bps', deltaY: 0.02 },
    { name: '-200bps', deltaY: -0.02 },
  ];

  if (isCorporate) {
    scenarios.push({ name: '+50bps_Credit_Stress', deltaY: 0.005 });
  }

  return scenarios.map((sc) => {
    const deltaY = sc.deltaY;
    const pctChange = -modifiedDuration * deltaY + 0.5 * convexity * Math.pow(deltaY, 2);
    const estimatedNewPrice = Number((currentPrice * (1 + pctChange)).toFixed(2));

    return {
      scenarioName: sc.name,
      deltaYieldBps: Math.round(deltaY * 10000),
      percentagePriceChange: Number((pctChange * 100).toFixed(2)),
      estimatedNewPrice,
    };
  });
}

// Evaluates comprehensive bond metrics and scores bond attractiveness for the optimizer
export function evaluateBondSecurity(input: BondPricingInputs): {
  metrics: BondMetricsResult;
  scenarios: InterestRateScenarioShift[];
  bondScore: number; // B_i in [0, 1]
} {
  const freq = input.paymentFrequency ?? 1;
  const ytm = calculateYtm(input.faceValue, input.couponRate, input.yearsToMaturity, input.currentPrice, freq);
  const { macaulayDuration, modifiedDuration, convexity } = calculateDurationAndConvexity(
    input.faceValue,
    input.couponRate,
    input.yearsToMaturity,
    input.currentPrice,
    ytm,
    freq,
  );

  const benchmark = input.benchmarkYield ?? 0.065; // Default reference yield
  const spreadBps = Math.round((ytm - benchmark) * 10000);

  const isCorp = input.bondType === 'INDIAN_CORP_BOND' || input.bondType === 'UAE_CORP_SUKUK' || input.bondType === 'GLOBAL_CORP';
  const scenarios = simulateBondInterestRateScenarios(input.currentPrice, modifiedDuration, convexity, isCorp);

  const isSharia =
    input.bondType === 'UAE_SOVEREIGN_SUKUK' ||
    input.bondType === 'UAE_CORP_SUKUK' ||
    Boolean(input.isShariaCompliant);

  // Bond scoring B_i:
  // Combines yield spread attractiveness (higher is better up to reasonable risk), duration stability, and Sharia alignment.
  let yieldScore = 0.5;
  if (ytm > 0) {
    yieldScore = Math.max(0, Math.min(1, ytm / 0.10)); // e.g. 7% yield -> 0.7
  }

  // Duration penalty if duration is too high (> 7 years requires higher risk budget)
  const durationScore = Math.max(0, 1 - modifiedDuration / 12);

  let bondScore = 0.55 * yieldScore + 0.45 * durationScore;
  if (isSharia) {
    bondScore = Math.min(1.0, bondScore * 1.05); // Sharia premium for dual-jurisdiction clients
  }

  return {
    metrics: {
      ytm,
      spreadBps,
      macaulayDuration,
      modifiedDuration,
      convexity,
      isShariaCompliant: isSharia,
    },
    scenarios,
    bondScore: Number(bondScore.toFixed(4)),
  };
}
