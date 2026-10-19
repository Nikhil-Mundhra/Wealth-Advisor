import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  bootstrapSpotCurve,
  calculateDurationAndConvexity,
  calculateForwardRate,
  calculateYtm,
  evaluateBondSecurity,
  generateBondCashFlows,
  simulateBondInterestRateScenarios,
} from '@wealth-advisor/rules';

describe('bond-valuation.rule', () => {
  it('generates regular and maturity cash flows', () => {
    // 5-year 7% bond, annual, face value 100
    const cfs = generateBondCashFlows(100, 0.07, 5, 1);
    assert.equal(cfs.length, 5);
    assert.equal(cfs[0]!.amount, 7);
    assert.equal(cfs[4]!.amount, 107);
  });

  it('solves for Yield-to-Maturity (YTM)', () => {
    // Par bond (Price 100, coupon 6%, 5Y) -> YTM = 6%
    const ytmPar = calculateYtm(100, 0.06, 5, 100, 1);
    assert.equal(ytmPar, 0.06);

    // Discount bond (Price 95, coupon 6%, 5Y) -> YTM > 6%
    const ytmDiscount = calculateYtm(100, 0.06, 5, 95, 1);
    assert.ok(ytmDiscount > 0.06 && ytmDiscount < 0.08);

    // Premium bond (Price 105, coupon 6%, 5Y) -> YTM < 6%
    const ytmPremium = calculateYtm(100, 0.06, 5, 105, 1);
    assert.ok(ytmPremium < 0.06 && ytmPremium > 0.04);
  });

  it('calculates Macaulay Duration, Modified Duration, and Convexity', () => {
    // 5Y 6% coupon bond trading at par (Price 100, YTM 6%)
    const { macaulayDuration, modifiedDuration, convexity } = calculateDurationAndConvexity(100, 0.06, 5, 100, 0.06, 1);
    // For 5-year coupon bond, duration is typically between 4.2 and 4.6 years
    assert.ok(macaulayDuration > 4.0 && macaulayDuration < 5.0);
    assert.ok(modifiedDuration < macaulayDuration);
    assert.ok(convexity > 0);
  });

  it('bootstraps spot rates from par yields and computes forward rate', () => {
    const parCurve = [
      { maturityYears: 1, parYield: 0.05 },
      { maturityYears: 2, parYield: 0.055 },
      { maturityYears: 3, parYield: 0.06 },
    ];
    const spot = bootstrapSpotCurve(parCurve);
    assert.equal(spot.length, 3);
    assert.equal(spot[0]!.spotRate, 0.05);
    assert.ok(spot[1]!.spotRate > 0.05);

    // Forward rate 1Y to 2Y
    const f12 = calculateForwardRate(1, spot[0]!.spotRate, 2, spot[1]!.spotRate);
    assert.ok(f12 > spot[0]!.spotRate);
  });

  it('simulates interest rate shocks (+200bps, -200bps, +50bps credit)', () => {
    const price = 100;
    const modDur = 4.3;
    const convexity = 22;
    const scenarios = simulateBondInterestRateScenarios(price, modDur, convexity, true);

    const base = scenarios.find((s) => s.scenarioName === 'Base');
    const up200 = scenarios.find((s) => s.scenarioName === '+200bps');
    const down200 = scenarios.find((s) => s.scenarioName === '-200bps');
    const credit = scenarios.find((s) => s.scenarioName === '+50bps_Credit_Stress');

    assert.equal(base?.percentagePriceChange, 0);
    // +200 bps: -4.3 * 0.02 + 0.5 * 22 * 0.0004 = -0.086 + 0.0044 = -0.0816 (-8.16%)
    assert.ok((up200?.percentagePriceChange ?? 0) < -7.0);
    // -200 bps: +4.3 * 0.02 + 0.5 * 22 * 0.0004 = +0.086 + 0.0044 = +0.0904 (+9.04%)
    assert.ok((down200?.percentagePriceChange ?? 0) > 8.0);
    assert.ok(credit !== undefined);
  });

  it('evaluates UAE Sovereign Sukuk with Sharia compliance', () => {
    const sukuk = evaluateBondSecurity({
      faceValue: 1000,
      couponRate: 0.048,
      yearsToMaturity: 7,
      currentPrice: 990,
      benchmarkYield: 0.045,
      bondType: 'UAE_SOVEREIGN_SUKUK',
      isShariaCompliant: true,
    });

    assert.equal(sukuk.metrics.isShariaCompliant, true);
    assert.ok(sukuk.bondScore > 0.5);
    assert.ok(sukuk.metrics.ytm > 0.045);
  });
});
