import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateInformationRatio,
  calculateJensenAlpha,
  calculateModiglianiM2,
  calculateSharpeRatio,
  calculateSortinoRatio,
  evaluateExpenseRatio,
  evaluateFundHouseConcentration,
  evaluateMutualFund,
} from '@wealth-advisor/rules';

describe('mutual-fund-analysis.rule', () => {
  it('calculates Sharpe, Sortino, Alpha, Information Ratio, and M2', () => {
    // Return: 12%, Rf: 3%, Vol: 15% -> Sharpe = (0.12 - 0.03) / 0.15 = 0.60
    const sharpe = calculateSharpeRatio(0.12, 0.03, 0.15);
    assert.equal(sharpe, 0.60);

    // Downside vol: 8%, MAR: 3% -> Sortino = (0.12 - 0.03) / 0.08 = 1.125
    const sortino = calculateSortinoRatio(0.12, 0.03, 0.08);
    assert.equal(sortino, 1.125);

    // Benchmark return: 10%, Beta: 0.9, Fund return: 12%, Rf: 3%
    // Alpha = (0.12 - 0.03) - 0.9 * (0.10 - 0.03) = 0.09 - 0.063 = 0.027
    const alpha = calculateJensenAlpha(0.12, 0.10, 0.9, 0.03);
    assert.equal(alpha, 0.027);

    // Tracking error: 2.5% -> IR = 0.027 / 0.025 = 1.08
    const ir = calculateInformationRatio(alpha, 0.025);
    assert.equal(ir, 1.08);

    // M2: Sharpe 0.60, benchmark vol 14%, Rf 3% -> 0.60 * 0.14 + 0.03 = 0.114
    const m2 = calculateModiglianiM2(sharpe, 0.14, 0.03);
    assert.equal(m2, 0.114);
  });

  it('evaluates expense ratio fiduciary filter', () => {
    // Equity fund: expense 1.8% -> passes
    assert.equal(evaluateExpenseRatio(0.018, 'EQUITY', 0.01), true);
    // Equity fund: expense 2.4%, low alpha -> fails
    assert.equal(evaluateExpenseRatio(0.024, 'EQUITY', 0.005), false);
    // Equity fund: expense 2.4%, high alpha >= 2% -> passes on alpha justification
    assert.equal(evaluateExpenseRatio(0.024, 'EQUITY', 0.025), true);

    // Debt fund: expense 0.8% -> passes
    assert.equal(evaluateExpenseRatio(0.008, 'DEBT', 0.005), true);
    // Debt fund: expense 1.2% -> fails
    assert.equal(evaluateExpenseRatio(0.012, 'DEBT', 0.005), false);
  });

  it('enforces single fund house concentration cap (<= 15%)', () => {
    const balancedHouses = {
      'HDFC AMC': 0.12,
      'ICICI Prudential': 0.10,
      'Franklin Templeton': 0.14,
    };
    const checkPass = evaluateFundHouseConcentration(balancedHouses);
    assert.equal(checkPass.isDiversified, true);
    assert.equal(checkPass.offendingFundHouses.length, 0);

    const concentratedHouses = {
      'HDFC AMC': 0.22,
      'ICICI Prudential': 0.10,
    };
    const checkFail = evaluateFundHouseConcentration(concentratedHouses);
    assert.equal(checkFail.isDiversified, false);
    assert.deepEqual(checkFail.offendingFundHouses, ['HDFC AMC']);
  });

  it('performs complete mutual fund evaluation with compliance check', () => {
    const result = evaluateMutualFund({
      fundSymbol: 'HDFC_TOP100',
      fundName: 'HDFC Top 100 Large Cap Fund',
      fundHouse: 'HDFC AMC',
      category: 'EQUITY',
      annualizedReturn: 0.14,
      annualizedVolatility: 0.13,
      benchmarkReturn: 0.11,
      benchmarkVolatility: 0.14,
      beta: 0.88,
      expenseRatio: 0.009, // 0.90%
      aumGrowthRate: 0.12,
      regulatoryRegistration: 'SEBI',
      isShariaCompliant: false,
    });

    assert.equal(result.expenseFilterPassed, true);
    assert.equal(result.isCompliant, true);
    assert.ok(result.compositeFundScore > 0.55);
    assert.ok(result.complianceNotes.some((n) => n.includes('SEBI')));
  });
});
