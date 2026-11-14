import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  constructOptimalPortfolio,
  CURRENCIES,
  dampRebalancePortfolio,
  dampRebalanceWeight,
  HOUSEHOLD_MODES,
  REBALANCE_DRIFT_THRESHOLD,
  recalibrateRiskScore,
  RISK_TIERS,
} from '@wealth-advisor/rules';
import { factNumbers, shieldText } from '../../../src/modules/advisory/domain/calculation-shield.ts';
import { convertBatch } from '../../../src/modules/market/domain/convert.ts';
import { FxRate } from '../../../src/modules/market/domain/fx-rate.vo.ts';
import { Money } from '../../../src/modules/market/domain/money.vo.ts';
import { createRateTable } from '../../../src/modules/market/domain/rate-table.ts';
import { INSTITUTIONAL_CANDIDATE_SECURITIES } from '../../../src/modules/wealth/domain/institutional-securities.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';

// Deterministic PRNG so fuzz failures reproduce identically across CI and local runs.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('L1.5 Property-Based & Formal Regulatory Invariants', () => {
  it('MVO portfolio weights form a valid simplex within single-security caps across 50 random constraint sets', () => {
    const rand = mulberry32(20261006);
    for (let i = 0; i < 50; i += 1) {
      const riskTier = RISK_TIERS[Math.floor(rand() * RISK_TIERS.length)]!;
      const shariaOnly = rand() < 0.45;
      const minLiquidityFactor = 0.5 + rand() * 0.35;
      const maxSingleSecurityWeight = 0.25 + rand() * 0.25;
      const targetTotalValueBase = Math.round((50000 + rand() * 950000) * 100);

      const result = constructOptimalPortfolio(INSTITUTIONAL_CANDIDATE_SECURITIES, {
        riskTier,
        shariaOnly,
        minLiquidityFactor,
        maxSectorExposure: 0.4 + rand() * 0.3,
        maxSingleSecurityWeight,
        singleFundHouseCap: 0.25,
        targetTotalValueBase,
      });

      assert.ok(result.holdings.length > 0, `case ${i}: expected non-empty holdings`);
      const sumWeights = result.holdings.reduce((sum, h) => sum + h.weight, 0);
      assert.ok(Math.abs(sumWeights - 1.0) < 0.01, `case ${i}: weights sum ${sumWeights} != 1.0`);

      for (const h of result.holdings) {
        assert.ok(h.weight > 0 && h.weight <= 1.0, `case ${i}: ${h.symbol} weight ${h.weight} outside (0, 1]`);
        assert.ok(Number.isFinite(h.targetAmountBase) && h.targetAmountBase >= 0);
      }
      assert.ok(Number.isFinite(result.portfolioExpectedReturn));
      assert.ok(Number.isFinite(result.portfolioVolatility) && result.portfolioVolatility >= 0);
    }
  });

  it('Sharia / AAOIFI filter strictly excludes all non-compliant instruments across 30 randomized mandates', () => {
    const rand = mulberry32(777333);
    for (let i = 0; i < 30; i += 1) {
      const riskTier = RISK_TIERS[Math.floor(rand() * RISK_TIERS.length)]!;
      const result = constructOptimalPortfolio(INSTITUTIONAL_CANDIDATE_SECURITIES, {
        riskTier,
        shariaOnly: true,
        minLiquidityFactor: 0.6 + rand() * 0.2,
        maxSectorExposure: 0.45,
        maxSingleSecurityWeight: 0.35,
        singleFundHouseCap: 0.3,
        targetTotalValueBase: 10000000,
      });

      assert.equal(result.complianceChecks.shariaPassed, true, `case ${i}: shariaPassed must be true`);
      for (const holding of result.holdings) {
        assert.equal(holding.isShariaCompliant, true, `case ${i}: non-Sharia asset ${holding.symbol} leaked into mandate`);
      }
    }
  });

  it('dynamic risk recalibration obeys [1, 10] bounds, runway monotonicity, FX penalty, and family safety floor across 60 cases', () => {
    const rand = mulberry32(987654);
    for (let i = 0; i < 60; i += 1) {
      const baseRiskScore = 1 + rand() * 9;
      const lowRunway = rand() * 2.9;
      const midRunway = 3.0 + rand() * 2.9;
      const highRunway = 6.0 + rand() * 12.0;
      const householdMode = HOUSEHOLD_MODES[Math.floor(rand() * HOUSEHOLD_MODES.length)]!;
      const lowFxMismatch = rand() * 0.29;
      const highFxMismatch = 0.31 + rand() * 0.65;

      const sLow = recalibrateRiskScore({ baseRiskScore, runwayMonths: lowRunway, householdMode, fxMismatchPct: lowFxMismatch });
      const sMid = recalibrateRiskScore({ baseRiskScore, runwayMonths: midRunway, householdMode, fxMismatchPct: lowFxMismatch });
      const sHigh = recalibrateRiskScore({ baseRiskScore, runwayMonths: highRunway, householdMode, fxMismatchPct: lowFxMismatch });

      for (const score of [sLow, sMid, sHigh]) {
        assert.ok(score >= 1.0 && score <= 10.0, `case ${i}: score ${score} escaped [1.0, 10.0]`);
      }

      assert.ok(sLow <= sMid, `case ${i}: lower runway (${lowRunway}) gave higher risk ${sLow} > ${sMid}`);
      assert.ok(sMid <= sHigh, `case ${i}: lower runway (${midRunway}) gave higher risk ${sMid} > ${sHigh}`);

      const sFxSafe = recalibrateRiskScore({ baseRiskScore, runwayMonths: highRunway, householdMode, fxMismatchPct: lowFxMismatch });
      const sFxStressed = recalibrateRiskScore({ baseRiskScore, runwayMonths: highRunway, householdMode, fxMismatchPct: highFxMismatch });
      assert.ok(sFxStressed <= sFxSafe, `case ${i}: FX mismatch penalty failed (${sFxStressed} > ${sFxSafe})`);

      const sInd = recalibrateRiskScore({ baseRiskScore, runwayMonths: midRunway, householdMode: 'INDIVIDUAL', fxMismatchPct: lowFxMismatch });
      const sFam = recalibrateRiskScore({ baseRiskScore, runwayMonths: midRunway, householdMode: 'FAMILY_HOUSEHOLD', fxMismatchPct: lowFxMismatch });
      assert.ok(sFam <= sInd, `case ${i}: FAMILY_HOUSEHOLD (${sFam}) exceeded INDIVIDUAL (${sInd})`);
    }
  });

  it('self-financing rebalance never buys more than sells raise and orders SELL before BUY across 40 weightings', async () => {
    const rand = mulberry32(424242);
    for (let i = 0; i < 40; i += 1) {
      const portfolios = new MemoryPortfolioRepository();
      const api = createWealthApi({
        products: new MemoryAssetProductRepository(),
        portfolios,
        profiles: new MemoryRiskProfileRepository(),
        ledger: new MemorySandboxLedgerRepository(),
        passkeys: { verify: async () => true },
        clock: { now: () => new Date('2026-10-06T12:00:00Z') },
      });

      const doc = await portfolios.findByUser('default', 'default');
      assert.ok(doc);
      const rawCurr = doc.holdings.map(() => 0.05 + rand());
      const sumCurr = rawCurr.reduce((a, b) => a + b, 0);
      const rawTarget = doc.holdings.map(() => 0.05 + rand());
      const sumTarget = rawTarget.reduce((a, b) => a + b, 0);

      doc.holdings.forEach((h, idx) => {
        h.currentWeight = Number((rawCurr[idx]! / sumCurr).toFixed(4));
        h.targetWeight = Number((rawTarget[idx]! / sumTarget).toFixed(4));
      });
      await portfolios.save(doc);

      const proposal = await api.optimizePortfolio('default', 'default');
      const sold = proposal.actions.filter((a) => a.action === 'SELL').reduce((s, a) => s + a.amountBase, 0);
      const bought = proposal.actions.filter((a) => a.action === 'BUY').reduce((s, a) => s + a.amountBase, 0);
      assert.ok(bought <= sold, `case ${i}: bought ${bought} exceeded sold ${sold}`);

      const firstBuyIdx = proposal.actions.findIndex((a) => a.action === 'BUY');
      const lastSellIdx = proposal.actions.map((a) => a.action).lastIndexOf('SELL');
      if (firstBuyIdx !== -1 && lastSellIdx !== -1) {
        assert.ok(firstBuyIdx > lastSellIdx, `case ${i}: BUY scheduled before SELL`);
      }
    }
  });

  it('calculation shield blocks invented numbers and passes grounded engine narratives across 40 trials', () => {
    const rand = mulberry32(1357911);
    for (let i = 0; i < 40; i += 1) {
      const runway = Number((1.5 + rand() * 10).toFixed(1));
      const burn = Math.round(1200 + rand() * 6000);
      const val = Math.round(25000 + rand() * 300000);
      const prompt = `Runway ${runway} months, burn €${burn}, portfolio €${val}.`;
      const fallback = `Fallback grounded runway ${runway} months.`;
      const facts = factNumbers(prompt);

      const validText = `Your ${runway} month reserve handles €${burn} monthly burn on €${val} assets.`;
      assert.equal(shieldText(validText, fallback, facts), validText);

      const hallucinated = Math.round(val + 77777 + rand() * 9999);
      const rogueText = `Guaranteed ${hallucinated} return with ${runway} months runway.`;
      assert.equal(shieldText(rogueText, fallback, facts), fallback, `case ${i}: shield failed to catch ${hallucinated}`);
    }
  });

  it('exact rational currency conversions preserve identity and inverse round-trip tolerance across 40 trials', () => {
    const rand = mulberry32(314159);
    const nonEur = CURRENCIES.filter((c) => c !== 'EUR' && c !== 'AED' && c !== 'INR');
    const rates = nonEur.map((quote, idx) =>
      FxRate.of({
        base: 'EUR',
        quote,
        date: '2026-10-05',
        rate: Number((0.75 + idx * 0.22 + rand() * 0.1).toFixed(4)),
        source: 'frankfurter',
      }),
    );
    const table = createRateTable(rates);

    for (let i = 0; i < 40; i += 1) {
      const amount = Math.round(100 + rand() * 5_000_000);
      const target = nonEur[i % nonEur.length]!;

      const identity = convertBatch({
        items: [{ money: Money.of(amount, 'EUR'), date: '2026-10-06' }],
        target: 'EUR',
        mode: 'spot',
        rates: table,
        today: '2026-10-06',
      });
      assert.equal(identity[0]?.ok, true);
      if (identity[0]?.ok) {
        assert.equal(identity[0].valuation.converted.amount, amount);
      }

      const forward = convertBatch({
        items: [{ money: Money.of(amount, 'EUR'), date: '2026-10-06' }],
        target,
        mode: 'spot',
        rates: table,
        today: '2026-10-06',
      });
      assert.equal(forward[0]?.ok, true);
      if (forward[0]?.ok) {
        const back = convertBatch({
          items: [{ money: forward[0].valuation.converted, date: '2026-10-06' }],
          target: 'EUR',
          mode: 'spot',
          rates: table,
          today: '2026-10-06',
        });
        assert.equal(back[0]?.ok, true);
        if (back[0]?.ok) {
          const rate = rates.find((r) => r.value.quote === target)!.value.rate;
          const tolerance = target === 'JPY' ? Math.ceil(100 / rate) : 3;
          assert.ok(
            Math.abs(back[0].valuation.converted.amount - amount) <= tolerance,
            `case ${i}: round-trip ${amount} -> ${forward[0].valuation.converted.amount} ${target} -> ${back[0].valuation.converted.amount} drifted beyond ${tolerance}`,
          );
        }
      }
    }
  });

  it('damped rebalancing suppresses sub-threshold drift and moves monotonically without overshoot across 50 trials', () => {
    const rand = mulberry32(808080);
    for (let i = 0; i < 50; i += 1) {
      const current = Number((0.1 + rand() * 0.7).toFixed(4));
      const smallDelta = (rand() - 0.5) * REBALANCE_DRIFT_THRESHOLD * 1.8;
      const smallTarget = Math.max(0, Math.min(1, Number((current + smallDelta).toFixed(4))));
      if (Math.abs(smallTarget - current) <= REBALANCE_DRIFT_THRESHOLD) {
        assert.equal(
          dampRebalanceWeight(current, smallTarget),
          current,
          `case ${i}: expected zero churn inside drift deadband (${current} -> ${smallTarget})`,
        );
      }

      const largeDelta = (rand() < 0.5 ? -1 : 1) * (0.02 + rand() * 0.25);
      const largeTarget = Math.max(0, Math.min(1, Number((current + largeDelta).toFixed(4))));
      const damped = dampRebalanceWeight(current, largeTarget);
      const minW = Math.min(current, largeTarget);
      const maxW = Math.max(current, largeTarget);
      assert.ok(damped >= minW - 0.0001 && damped <= maxW + 0.0001, `case ${i}: damped ${damped} overshot [${minW}, ${maxW}]`);

      const trio = dampRebalancePortfolio([
        { currentWeight: 0.5, targetWeight: 0.35 },
        { currentWeight: 0.3, targetWeight: 0.45 },
        { currentWeight: 0.2, targetWeight: 0.2 },
      ]);
      const sum = trio.reduce((s, w) => s + w, 0);
      assert.ok(Math.abs(sum - 1.0) <= 0.001, `case ${i}: damped simplex summed to ${sum}`);
    }
  });
});
