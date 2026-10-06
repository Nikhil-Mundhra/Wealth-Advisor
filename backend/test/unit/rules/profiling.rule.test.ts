import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateBaseRiskScore,
  deriveCorridorCurrencies,
  deriveTimeHorizonYears,
  mapStressAnswerToRiskBand,
  type ProfilingAnswersInput,
} from '@wealth-advisor/rules';

const sampleAnswers: ProfilingAnswersInput = {
  psychology: ['STEADY_GROWTH'],
  countries: {
    residence: 'DE',
    incomeSources: ['DE', 'GB'],
    remittanceDestinations: ['CN'],
  },
  instruments: ['GLOBAL_EQUITIES', 'TECH_GROWTH_EQUITIES'],
  holdings: {
    cashSavings: { amount: 10000, currency: 'EUR' },
    brokerageStocks: { amount: 40000, currency: 'EUR' },
    retirementPension: { amount: 20000, currency: 'EUR' },
    otherAssets: { amount: 0, currency: 'EUR' },
  },
  age: 32,
  goals: {
    tags: ['RETIREMENT', 'FAMILY_SUPPORT'],
    notes: 'Support parents in Shanghai',
  },
  stressResponse: 'STAY_INVESTED',
};

describe('profiling.rule', () => {
  it('maps stress answers to appropriate risk bands', () => {
    assert.equal(mapStressAnswerToRiskBand('CUT_RISK'), 'conservative');
    assert.equal(mapStressAnswerToRiskBand('STAY_INVESTED'), 'moderate');
    assert.equal(mapStressAnswerToRiskBand('BUY_MORE'), 'aggressive');
  });

  it('derives investment horizon from age', () => {
    assert.equal(deriveTimeHorizonYears(30), 35);
    assert.equal(deriveTimeHorizonYears(60), 5);
    assert.equal(deriveTimeHorizonYears(80), 5);
    assert.equal(deriveTimeHorizonYears(10), 40);
  });

  it('derives unique corridor currencies from country codes', () => {
    const currencies = deriveCorridorCurrencies({
      residence: 'DE',
      incomeSources: ['GB'],
      remittanceDestinations: ['CN', 'SG'],
    });
    assert.deepEqual(currencies.sort(), ['CNY', 'EUR', 'GBP', 'SGD'].sort());
  });

  it('calculates expected base risk score and clamps within [1.0, 10.0]', () => {
    const moderateScore = calculateBaseRiskScore(sampleAnswers);
    assert.ok(moderateScore >= 5.0 && moderateScore <= 8.0, `Score was ${moderateScore}`);

    // Conservative extreme
    const conservativeAnswers: ProfilingAnswersInput = {
      ...sampleAnswers,
      psychology: ['PROTECT_CAPITAL'],
      instruments: ['MONEY_MARKET_CASH'],
      age: 70,
      stressResponse: 'CUT_RISK',
    };
    const lowScore = calculateBaseRiskScore(conservativeAnswers);
    assert.equal(lowScore, 1.0);

    // Aggressive extreme
    const aggressiveAnswers: ProfilingAnswersInput = {
      ...sampleAnswers,
      psychology: ['MAX_GROWTH'],
      instruments: ['GLOBAL_EQUITIES', 'TECH_GROWTH_EQUITIES'],
      age: 22,
      stressResponse: 'BUY_MORE',
    };
    const highScore = calculateBaseRiskScore(aggressiveAnswers);
    assert.equal(highScore, 10.0);
  });
});
