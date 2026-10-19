import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateTechnicalScore,
  computeLiquidityFactor,
  evaluateTrendFilter,
  normalizeAdx,
  normalizeBollinger,
  normalizeIchimoku,
  normalizeMacd,
  normalizeMovingAverages,
  normalizeRsi,
  normalizeVwap,
} from '@wealth-advisor/rules';

describe('technical-analysis.rule', () => {
  it('normalizes RSI properly for trend momentum', () => {
    assert.equal(normalizeRsi(30), 0.0);
    assert.equal(normalizeRsi(20), 0.0);
    assert.equal(normalizeRsi(70), 1.0);
    assert.equal(normalizeRsi(80), 1.0);
    assert.equal(normalizeRsi(50), 0.5);
  });

  it('normalizes moving average trends and crossovers', () => {
    // Bullish: price > ema20 and sma50 > sma200
    const bullish = normalizeMovingAverages(150, 140, 135, 120);
    assert.equal(bullish, 1.0);

    // Bearish: price < ema20 and sma50 < sma200
    const bearish = normalizeMovingAverages(90, 100, 110, 125);
    assert.equal(bearish, 0.0);
  });

  it('normalizes MACD divergence', () => {
    // macd > signal
    const bullish = normalizeMacd(2.5, 1.0);
    assert.ok(bullish > 0.8);

    // macd < signal
    const bearish = normalizeMacd(1.0, 2.5);
    assert.ok(bearish < 0.2);
  });

  it('normalizes Bollinger Bands %B', () => {
    assert.equal(normalizeBollinger(100, 120, 80), 0.5);
    assert.equal(normalizeBollinger(120, 120, 80), 1.0);
    assert.equal(normalizeBollinger(80, 120, 80), 0.0);
  });

  it('normalizes ADX, VWAP, and Ichimoku Cloud', () => {
    assert.equal(normalizeAdx(25), 0.5);
    assert.equal(normalizeAdx(50), 1.0);

    assert.equal(normalizeVwap(105, 100), 1.0);
    assert.equal(normalizeVwap(95, 100), 0.0);

    // Above cloud (spanA=100, spanB=110)
    assert.equal(normalizeIchimoku(115, 100, 110), 1.0);
    // In cloud
    assert.equal(normalizeIchimoku(105, 100, 110), 0.5);
    // Below cloud
    assert.equal(normalizeIchimoku(90, 100, 110), 0.0);
  });

  it('computes liquidity factor and enforces required volume ratio', () => {
    assert.equal(computeLiquidityFactor(100000, 50000), 1.0);
    assert.equal(computeLiquidityFactor(25000, 50000), 0.5);
  });

  it('filters trend for conservative tier under EMA200', () => {
    // Conservative client when price < EMA200 fails trend filter
    assert.equal(evaluateTrendFilter(90, 100, 'conservative'), false);
    // Conservative client when price >= EMA200 passes
    assert.equal(evaluateTrendFilter(110, 100, 'conservative'), true);
    // Aggressive client passes even when price < EMA200
    assert.equal(evaluateTrendFilter(90, 100, 'aggressive'), true);
  });

  it('computes full weighted technical score and zeroes out if trend filter fails', () => {
    const input = {
      currentPrice: 150,
      ema20: 145,
      ema200: 130,
      sma50: 140,
      sma200: 125,
      macd: 3.0,
      macdSignal: 1.5,
      rsi: 60,
      bollingerUpper: 160,
      bollingerLower: 130,
      adx: 35,
      vwap: 148,
      ichimokuSpanA: 135,
      ichimokuSpanB: 140,
      bullishPatternScore: 0.8,
      flowImbalanceScore: 0.7,
      avgDailyVolume: 75000,
      requiredVolume: 50000,
    };

    const result = calculateTechnicalScore(input, 'moderate');
    assert.ok(result.technicalScore > 0.65);
    assert.equal(result.liquidityFactor, 1.0);
    assert.equal(result.trendFilterPassed, true);

    // Now test conservative failure
    const failedResult = calculateTechnicalScore({
      ...input,
      currentPrice: 120,
      ema200: 130, // Price < EMA200
    }, 'conservative');
    assert.equal(failedResult.trendFilterPassed, false);
    assert.equal(failedResult.technicalScore, 0);
  });
});
