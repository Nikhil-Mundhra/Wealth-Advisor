import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  evaluateAssetFundamentals,
  evaluateBondSolvency,
  evaluateValuationTilt,
  requiresAssetFxHedge,
} from '@wealth-advisor/rules';

describe('fundamental-ratios.rule', () => {
  it('evaluates valuation tilts based on 5Y percentile', () => {
    assert.equal(evaluateValuationTilt(90), 'TRIM');
    assert.equal(evaluateValuationTilt(85), 'TRIM');
    assert.equal(evaluateValuationTilt(50), 'NEUTRAL');
    assert.equal(evaluateValuationTilt(20), 'ACCUMULATE');
    assert.equal(evaluateValuationTilt(10), 'ACCUMULATE');
  });

  it('evaluates corporate bond solvency based on ICR and Net Debt to EBITDA', () => {
    assert.equal(evaluateBondSolvency(4.5, 2.1), 'INVESTMENT_GRADE');
    assert.equal(evaluateBondSolvency(2.5, 2.0), 'VULNERABLE');
    assert.equal(evaluateBondSolvency(5.0, 4.2), 'VULNERABLE');
  });

  it('triggers currency hedging when asset foreign revenue exceeds 30% under corridor mismatch', () => {
    assert.equal(requiresAssetFxHedge(0.40, true), true);
    assert.equal(requiresAssetFxHedge(0.20, true), false);
    assert.equal(requiresAssetFxHedge(0.50, false), false);
  });

  it('evaluates complete asset metrics into retail-friendly signals', () => {
    const stockOvervalued = evaluateAssetFundamentals({
      symbol: 'AAPL',
      valuationPercentile5Y: 92,
      foreignRevenueRatio: 0.55,
    }, true);
    assert.equal(stockOvervalued.tacticalTilt, 'TRIM');
    assert.equal(stockOvervalued.requiresFxHedge, true);
    assert.equal(stockOvervalued.signal, 'caution');

    const bondSafe = evaluateAssetFundamentals({
      symbol: 'CORP_BOND_EUR',
      valuationPercentile5Y: 45,
      interestCoverageRatio: 5.2,
      netDebtToEbitda: 2.3,
      foreignRevenueRatio: 0.1,
    });
    assert.equal(bondSafe.bondGrade, 'INVESTMENT_GRADE');
    assert.equal(bondSafe.signal, 'neutral');

    const bondRisky = evaluateAssetFundamentals({
      symbol: 'HIGH_YIELD_EUR',
      valuationPercentile5Y: 40,
      interestCoverageRatio: 2.1,
      netDebtToEbitda: 4.8,
      foreignRevenueRatio: 0.05,
    });
    assert.equal(bondRisky.bondGrade, 'VULNERABLE');
    assert.equal(bondRisky.signal, 'caution');
  });
});
