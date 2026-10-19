// Technical analysis rule: quantitative indicators, normalization, liquidity adjustment, and trend filters.
// Reference: Portfolio Construction Engine Spec Section 2.
// Sources: Murphy (1999) Technical Analysis of Financial Markets; Bollinger (2001) Bollinger on Bollinger Bands.

export const TECHNICAL_INDICATOR_WEIGHTS = {
  movingAverages: 0.18, // Trend crossover
  macd: 0.14,           // Momentum shift
  rsi: 0.13,            // Mean reversion / momentum
  bollingerBands: 0.11, // Volatility / breakout
  adx: 0.09,            // Trend strength
  vwap: 0.09,           // Volume confirmation
  ichimoku: 0.07,       // Cloud support / resistance
  pattern: 0.09,        // Chart pattern confirmation
  flowImbalance: 0.10,  // Order flow sentiment
} as const;

export type TechnicalIndicatorName = keyof typeof TECHNICAL_INDICATOR_WEIGHTS;

export interface RawTechnicalIndicators {
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema200?: number;
  currentPrice: number;
  macd?: number;
  macdSignal?: number;
  rsi?: number; // 0 to 100
  bollingerUpper?: number;
  bollingerLower?: number;
  adx?: number; // 0 to 100
  vwap?: number;
  ichimokuSpanA?: number;
  ichimokuSpanB?: number;
  bullishPatternScore?: number; // 0 to 1
  flowImbalanceScore?: number;  // 0 to 1
  avgDailyVolume: number;
  requiredVolume?: number;
}

export interface NormalizedTechnicalScores {
  movingAverages: number;
  macd: number;
  rsi: number;
  bollingerBands: number;
  adx: number;
  vwap: number;
  ichimoku: number;
  pattern: number;
  flowImbalance: number;
}

export interface TechnicalScoreResult {
  normalizedScores: NormalizedTechnicalScores;
  weightedRawScore: number;
  liquidityFactor: number;
  trendFilterPassed: boolean;
  technicalScore: number; // T_i in [0, 1]
}

// Normalizes RSI: RSI <= 30 is oversold (value 0.2 / bullish reversal potential), 30-70 linear, RSI >= 70 is overbought (cautious).
// Following Spec Section 2.3: RSI 30 -> 0, 70 -> 1 for trend momentum.
export function normalizeRsi(rsi: number): number {
  if (rsi <= 30) return 0.0;
  if (rsi >= 70) return 1.0;
  return Number(((rsi - 30) / 40).toFixed(4));
}

// Normalizes Moving Average trend: bullish crossover (fast > slow) scores high.
export function normalizeMovingAverages(price: number, ema20?: number, sma50?: number, sma200?: number): number {
  let score = 0.5;
  if (ema20 !== undefined && price > 0) {
    score += price >= ema20 ? 0.2 : -0.2;
  }
  if (sma50 !== undefined && sma200 !== undefined) {
    score += sma50 >= sma200 ? 0.3 : -0.3;
  }
  return Math.max(0, Math.min(1, score));
}

// Normalizes MACD: MACD above signal line is bullish.
export function normalizeMacd(macd?: number, signal?: number): number {
  if (macd === undefined || signal === undefined) return 0.5;
  const diff = macd - signal;
  // Sigmoid-like scaling for divergence
  const scaled = 1 / (1 + Math.exp(-diff));
  return Number(scaled.toFixed(4));
}

// Normalizes Bollinger Bands %B = (Price - Lower) / (Upper - Lower).
export function normalizeBollinger(price: number, upper?: number, lower?: number): number {
  if (upper === undefined || lower === undefined || upper <= lower) return 0.5;
  const percentB = (price - lower) / (upper - lower);
  return Math.max(0, Math.min(1, Number(percentB.toFixed(4))));
}

// Normalizes ADX: trend strength >= 25 indicates strong trend; >= 50 very strong.
export function normalizeAdx(adx?: number): number {
  if (adx === undefined) return 0.5;
  return Math.max(0, Math.min(1, Number((adx / 50).toFixed(4))));
}

// Normalizes VWAP: Price > VWAP is bullish intraday/institutional bias.
export function normalizeVwap(price: number, vwap?: number): number {
  if (vwap === undefined || vwap <= 0) return 0.5;
  return price >= vwap ? 1.0 : 0.0;
}

// Normalizes Ichimoku: Price above Cloud (Span A and Span B) is bullish (1.0), inside cloud neutral (0.5), below bearish (0.0).
export function normalizeIchimoku(price: number, spanA?: number, spanB?: number): number {
  if (spanA === undefined || spanB === undefined) return 0.5;
  const top = Math.max(spanA, spanB);
  const bottom = Math.min(spanA, spanB);
  if (price >= top) return 1.0;
  if (price <= bottom) return 0.0;
  return 0.5;
}

// Computes the liquidity adjustment factor = min(1, avgDailyVolume / requiredVolume).
export function computeLiquidityFactor(avgDailyVolume: number, requiredVolume = 50000): number {
  if (requiredVolume <= 0) return 1.0;
  const factor = avgDailyVolume / requiredVolume;
  return Math.max(0, Math.min(1, Number(factor.toFixed(4))));
}

// Trend Filter: if client is conservative and Price < EMA200 (bearish long-term trend), exposure is disallowed (T_i = 0).
export function evaluateTrendFilter(
  price: number,
  ema200?: number,
  riskTier?: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive',
): boolean {
  if (riskTier === 'conservative' && ema200 !== undefined && price < ema200) {
    return false; // Trend filter fails for conservative client under 200 EMA
  }
  return true;
}

// Full technical scoring algorithm
export function calculateTechnicalScore(
  input: RawTechnicalIndicators,
  riskTier: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive' = 'moderate',
): TechnicalScoreResult {
  const normMA = normalizeMovingAverages(input.currentPrice, input.ema20, input.sma50, input.sma200);
  const normMacd = normalizeMacd(input.macd, input.macdSignal);
  const normRsi = input.rsi !== undefined ? normalizeRsi(input.rsi) : 0.5;
  const normBoll = normalizeBollinger(input.currentPrice, input.bollingerUpper, input.bollingerLower);
  const normAdx = normalizeAdx(input.adx);
  const normVwap = normalizeVwap(input.currentPrice, input.vwap);
  const normIchi = normalizeIchimoku(input.currentPrice, input.ichimokuSpanA, input.ichimokuSpanB);
  const normPattern = input.bullishPatternScore !== undefined ? Math.max(0, Math.min(1, input.bullishPatternScore)) : 0.5;
  const normFlow = input.flowImbalanceScore !== undefined ? Math.max(0, Math.min(1, input.flowImbalanceScore)) : 0.5;

  const normalizedScores: NormalizedTechnicalScores = {
    movingAverages: normMA,
    macd: normMacd,
    rsi: normRsi,
    bollingerBands: normBoll,
    adx: normAdx,
    vwap: normVwap,
    ichimoku: normIchi,
    pattern: normPattern,
    flowImbalance: normFlow,
  };

  const weights = TECHNICAL_INDICATOR_WEIGHTS;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const weightedSum =
    normMA * weights.movingAverages +
    normMacd * weights.macd +
    normRsi * weights.rsi +
    normBoll * weights.bollingerBands +
    normAdx * weights.adx +
    normVwap * weights.vwap +
    normIchi * weights.ichimoku +
    normPattern * weights.pattern +
    normFlow * weights.flowImbalance;

  const weightedRawScore = Number((weightedSum / totalWeight).toFixed(4));
  const liquidityFactor = computeLiquidityFactor(input.avgDailyVolume, input.requiredVolume);
  const trendFilterPassed = evaluateTrendFilter(input.currentPrice, input.ema200, riskTier);

  let technicalScore = 0;
  if (trendFilterPassed) {
    technicalScore = Number((weightedRawScore * liquidityFactor).toFixed(4));
  }

  return {
    normalizedScores,
    weightedRawScore,
    liquidityFactor,
    trendFilterPassed,
    technicalScore,
  };
}
