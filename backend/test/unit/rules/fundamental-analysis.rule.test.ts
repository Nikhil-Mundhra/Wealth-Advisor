import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateCountryWacc,
  calculateDcfIntrinsicValue,
  calculateDdmIntrinsicValue,
  calculateEpvIntrinsicValue,
  calculateFundamentalScore,
  calculateMarginOfSafety,
  calculateMultiplesIntrinsicValue,
} from '@wealth-advisor/rules';

describe('fundamental-analysis.rule', () => {
  it('calculates country-specific WACC for India and UAE/Sharia', () => {
    // India conventional: E=700, D=300, Ke=14%, Kd=8%, Tax=25%
    const indiaWacc = calculateCountryWacc({
      equityMarketValue: 700,
      debtMarketValue: 300,
      costOfEquity: 0.14,
      costOfDebt: 0.08,
      taxRate: 0.25,
      isShariaCompliant: false,
    });
    // E/(E+D)*0.14 + D/(E+D)*0.08*(1-0.25) = 0.7*0.14 + 0.3*0.06 = 0.098 + 0.018 = 0.116
    assert.equal(indiaWacc, 0.116);

    // UAE Sharia: E=800, D=200 (Sukuk debt), Ke=10%, Kd=5.5%, Tax=9%
    const uaeWacc = calculateCountryWacc({
      equityMarketValue: 800,
      debtMarketValue: 200,
      costOfEquity: 0.10,
      costOfDebt: 0.055,
      taxRate: 0.09,
      isShariaCompliant: true,
    });
    assert.ok(uaeWacc > 0.08 && uaeWacc < 0.10);
  });

  it('calculates DCF intrinsic value with terminal value', () => {
    // FCF 10M, 12M, 15M; WACC 10%, g 3%, shares 1M, net debt 0
    const dcf = calculateDcfIntrinsicValue({
      freeCashFlows: [10, 12, 15],
      terminalGrowthRate: 0.03,
      wacc: 0.10,
      sharesOutstanding: 1,
      netDebt: 0,
    });
    assert.ok(dcf > 100);
  });

  it('calculates DDM and EPV values', () => {
    // DDM: D1 = $3.50, r_e = 9%, g = 4% -> 3.5 / (0.09 - 0.04) = 70.00
    const ddm = calculateDdmIntrinsicValue({
      nextYearDividend: 3.5,
      costOfEquity: 0.09,
      dividendGrowthRate: 0.04,
    });
    assert.equal(ddm, 70.0);

    // EPV: normalized earnings 50M, WACC 10%, 1M shares -> 500
    const epv = calculateEpvIntrinsicValue({
      normalizedOperatingEarnings: 50,
      wacc: 0.10,
      sharesOutstanding: 1,
    });
    assert.equal(epv, 500);

    // Multiples: EPS $8 * peer P/E 15 = 120
    const mult = calculateMultiplesIntrinsicValue({
      metricValue: 8,
      peerMedianMultiple: 15,
    });
    assert.equal(mult, 120);
  });

  it('calculates margin of safety and composite fundamental score', () => {
    const mos = calculateMarginOfSafety(100, 75);
    assert.equal(mos, 0.25);

    const score = calculateFundamentalScore({
      currentPrice: 75,
      intrinsicValue: 100,
      roe: 0.18,
      debtToEquity: 0.35,
      operatingCashFlowStable: true,
      epsGrowth5YCagr: 0.15,
      esgScore: 82,
    });

    assert.ok(score.compositeFundamentalScore > 0.70);
    assert.equal(score.marginOfSafety, 0.25);
  });

  it('applies valuation haircut for Indian small caps', () => {
    const score = calculateFundamentalScore({
      currentPrice: 90,
      intrinsicValue: 100,
      roe: 0.15,
      debtToEquity: 0.4,
      operatingCashFlowStable: true,
      epsGrowth5YCagr: 0.12,
      marketJurisdiction: 'INDIA',
      isSmallCap: true,
    });

    assert.equal(score.valuationHaircutApplied, 0.10);
    assert.equal(score.intrinsicValue, 90);
    assert.equal(score.marginOfSafety, 0);
  });
});
