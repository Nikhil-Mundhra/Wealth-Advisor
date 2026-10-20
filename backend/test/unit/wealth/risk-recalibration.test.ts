import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recalibrateRiskScore } from '@wealth-advisor/rules';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';

function setupWealth() {
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  return createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys: unregisteredPasskeyVerifier,
    clock,
  });
}

describe('recalibrateRiskScore', () => {
  it('leaves a healthy family buffer untouched', () => {
    assert.equal(
      recalibrateRiskScore({ baseRiskScore: 7.0, runwayMonths: 8.0, householdMode: 'FAMILY_HOUSEHOLD' }),
      7.0,
    );
  });

  it('penalizes Elena family cashflow squeeze in the warning band', () => {
    assert.equal(
      recalibrateRiskScore({ baseRiskScore: 7.0, runwayMonths: 3.2, householdMode: 'FAMILY_HOUSEHOLD' }),
      6.0,
    );
  });

  it('stacks the FX mismatch penalty above 30 percent exposure', () => {
    assert.equal(
      recalibrateRiskScore({
        baseRiskScore: 7.0,
        runwayMonths: 3.2,
        householdMode: 'FAMILY_HOUSEHOLD',
        fxMismatchPct: 35,
      }),
      5.0,
    );
  });

  it('ignores FX exposure at exactly 30 percent', () => {
    assert.equal(
      recalibrateRiskScore({
        baseRiskScore: 7.0,
        runwayMonths: 8.0,
        householdMode: 'FAMILY_HOUSEHOLD',
        fxMismatchPct: 30,
      }),
      7.0,
    );
  });

  it('drops two points on a student tuition shock below critical runway', () => {
    assert.equal(
      recalibrateRiskScore({ baseRiskScore: 6.5, runwayMonths: 1.8, householdMode: 'INDIVIDUAL' }),
      4.5,
    );
  });

  it('clamps at the 1.0 floor under combined stress', () => {
    assert.equal(
      recalibrateRiskScore({
        baseRiskScore: 1.5,
        runwayMonths: 0.5,
        householdMode: 'INDIVIDUAL',
        fxMismatchPct: 90,
      }),
      1.0,
    );
  });
});

describe('optimizePortfolio recalibration', () => {
  it('recalibrates the seeded Elena portfolio from 4.0 to 6.0', async () => {
    const wealth = setupWealth();
    const proposal = await wealth.optimizePortfolio('default', 'default', {
      householdMode: 'FAMILY_HOUSEHOLD',
    });
    assert.equal(proposal.effectiveRiskScore, 6.0);
    const stored = await wealth.getPortfolio('default', 'default');
    assert.equal(stored.effectiveRiskScore, 6.0);
  });

  it('applies the FX penalty when mismatch is reported', async () => {
    const wealth = setupWealth();
    const proposal = await wealth.optimizePortfolio('default', 'default', {
      householdMode: 'FAMILY_HOUSEHOLD',
      fxMismatchPct: 40,
    });
    assert.equal(proposal.effectiveRiskScore, 5.0);
  });
});
