import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateCompositeSecurityScore,
  constructOptimalPortfolio,
  mapScoreToRiskTier,
  runMonteCarloSimulation,
  runPortfolioStressTests,
  solveConstrainedPortfolio,
  type CandidateSecurity,
} from '@wealth-advisor/rules';

describe('portfolio-optimizer.rule', () => {
  const sampleCandidates: CandidateSecurity[] = [
    {
      symbol: 'INFY.NSE',
      name: 'Infosys Ltd',
      assetClass: 'EQUITY_INDIA',
      sector: 'Technology',
      securityType: 'STOCK',
      currentPrice: 1850,
      expectedAnnualReturn: 0.13,
      annualVolatility: 0.18,
      technicalScore: 0.75,
      fundamentalScore: 0.82,
      qualityScore: 0.90,
      liquidityFactor: 1.0,
      isShariaCompliant: true,
      domicileCountry: 'IN',
      maxWeightCap: 0.20,
    },
    {
      symbol: 'CSPX.LSE',
      name: 'iShares Core S&P 500',
      assetClass: 'EQUITY_US',
      sector: 'Broad Market',
      securityType: 'MUTUAL_FUND_ETF',
      currentPrice: 520,
      expectedAnnualReturn: 0.10,
      annualVolatility: 0.15,
      technicalScore: 0.65,
      fundamentalScore: 0.70,
      qualityScore: 0.95,
      liquidityFactor: 1.0,
      isShariaCompliant: false,
      domicileCountry: 'IE',
      fundHouse: 'BlackRock',
      maxWeightCap: 0.25,
    },
    {
      symbol: 'UAE_SUKUK_2029',
      name: 'UAE Sovereign Sukuk 2029',
      assetClass: 'SUKUK_SOVEREIGN',
      sector: 'Sovereign Debt',
      securityType: 'BOND',
      currentPrice: 1000,
      expectedAnnualReturn: 0.052,
      annualVolatility: 0.04,
      durationYears: 4.2,
      technicalScore: 0.50,
      fundamentalScore: 0.78,
      qualityScore: 0.98,
      liquidityFactor: 0.95,
      isShariaCompliant: true,
      domicileCountry: 'AE',
      maxWeightCap: 0.35,
    },
    {
      symbol: 'IN_GSEC_718_2033',
      name: '7.18% GS 2033 Indian Govt Bond',
      assetClass: 'FIXED_INCOME_GOV',
      sector: 'Sovereign Debt',
      securityType: 'BOND',
      currentPrice: 100,
      expectedAnnualReturn: 0.071,
      annualVolatility: 0.05,
      durationYears: 6.8,
      technicalScore: 0.50,
      fundamentalScore: 0.75,
      qualityScore: 0.95,
      liquidityFactor: 1.0,
      isShariaCompliant: false,
      domicileCountry: 'IN',
      maxWeightCap: 0.35,
    },
    {
      symbol: 'XEON.XETRA',
      name: 'Xtrackers EUR Overnight Cash',
      assetClass: 'MONEY_MARKET',
      sector: 'Cash & Short-Term',
      securityType: 'MUTUAL_FUND_ETF',
      currentPrice: 142,
      expectedAnnualReturn: 0.038,
      annualVolatility: 0.01,
      durationYears: 0.1,
      technicalScore: 0.50,
      fundamentalScore: 0.65,
      qualityScore: 0.99,
      liquidityFactor: 1.0,
      isShariaCompliant: false,
      domicileCountry: 'LU',
      fundHouse: 'DWS',
      maxWeightCap: 0.30,
    },
  ];

  it('maps numeric risk scores to standard risk tiers', () => {
    assert.equal(mapScoreToRiskTier(3.0), 'conservative');
    assert.equal(mapScoreToRiskTier(5.5), 'moderate');
    assert.equal(mapScoreToRiskTier(7.5), 'aggressive');
    assert.equal(mapScoreToRiskTier(9.0), 'very_aggressive');
  });

  it('computes composite security scores with tier-dependent weights', () => {
    const sec = sampleCandidates[0]!; // INFY
    // Conservative: wT=0.20, wF=0.60, wQ=0.20
    const consScore = calculateCompositeSecurityScore(sec, 'conservative');
    // 0.20*0.75 + 0.60*0.82 + 0.20*0.90 = 0.15 + 0.492 + 0.18 = 0.822
    assert.equal(consScore, 0.822);

    // Aggressive: wT=0.50, wF=0.30, wQ=0.20
    const aggScore = calculateCompositeSecurityScore(sec, 'aggressive');
    // 0.50*0.75 + 0.30*0.82 + 0.20*0.90 = 0.375 + 0.246 + 0.18 = 0.801
    assert.equal(aggScore, 0.801);
  });

  it('solves constrained allocation and sums exactly to 1.0', () => {
    const holdings = solveConstrainedPortfolio(sampleCandidates, {
      riskTier: 'moderate',
      targetTotalValueBase: 10000000, // €100,000 in cents
    });

    assert.ok(holdings.length > 0);
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    assert.ok(Math.abs(totalWeight - 1.0) < 0.001);

    const totalAmount = holdings.reduce((sum, h) => sum + h.targetAmountBase, 0);
    assert.ok(Math.abs(totalAmount - 10000000) < 100);
  });

  it('enforces Sharia-only filter for Islamic clients', () => {
    const shariaHoldings = solveConstrainedPortfolio(sampleCandidates, {
      riskTier: 'moderate',
      shariaOnly: true,
      targetTotalValueBase: 5000000,
    });

    assert.ok(shariaHoldings.length > 0);
    for (const h of shariaHoldings) {
      assert.equal(h.isShariaCompliant, true);
    }
    assert.ok(!shariaHoldings.some((h) => h.symbol === 'CSPX.LSE'));
  });

  it('runs Monte Carlo simulation and computes 95% VaR and CVaR', () => {
    const mc = runMonteCarloSimulation(0.08, 0.12, 1000, 12);
    assert.equal(mc.numSimulations, 1000);
    assert.ok(mc.percentiles.p5 < mc.percentiles.p50);
    assert.ok(mc.percentiles.p50 < mc.percentiles.p95);
    assert.ok(mc.valueAtRisk95 >= 0);
    assert.ok(mc.cvar95 >= mc.valueAtRisk95);
  });

  it('runs macroeconomic stress testing', () => {
    const holdings = solveConstrainedPortfolio(sampleCandidates, {
      riskTier: 'moderate',
      targetTotalValueBase: 10000000,
    });
    const stress = runPortfolioStressTests(holdings, 4.5);
    assert.equal(stress.length, 4);

    const rateHike = stress.find((s) => s.scenarioName.includes('+200 bps'));
    assert.ok(rateHike !== undefined);
    assert.ok(rateHike.portfolioValueChangePct < 0);

    const crash = stress.find((s) => s.scenarioName.includes('Equity Market'));
    assert.ok(crash !== undefined);
    assert.ok(crash.portfolioValueChangePct < 0);
  });

  it('constructs complete optimal portfolio with compliance checks', () => {
    const portfolio = constructOptimalPortfolio(sampleCandidates, {
      riskTier: 'conservative',
      targetTotalValueBase: 10000000,
    });

    assert.equal(portfolio.riskTier, 'conservative');
    assert.ok(portfolio.holdings.length > 0);
    assert.ok(portfolio.portfolioExpectedReturn > 0);
    assert.ok(portfolio.portfolioVolatility > 0);
    assert.equal(portfolio.complianceChecks.durationCapPassed, true);
  });
});
