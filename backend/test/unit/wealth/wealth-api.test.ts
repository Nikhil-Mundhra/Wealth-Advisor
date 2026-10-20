import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import type { PasskeyVerifier, SandboxLedgerRepository } from '../../../src/modules/wealth/application/ports.ts';
import type { SandboxLedgerDocument } from '../../../src/modules/wealth/infrastructure/db/documents/sandbox-ledger.document.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';

const acceptingPasskeys: PasskeyVerifier = { verify: async () => true };

function setup(passkeys: PasskeyVerifier = acceptingPasskeys) {
  const products = new MemoryAssetProductRepository();
  const portfolios = new MemoryPortfolioRepository();
  const profiles = new MemoryRiskProfileRepository();
  const ledger = new MemorySandboxLedgerRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createWealthApi({ products, portfolios, profiles, ledger, passkeys, clock });
  return { api, portfolios, profiles, ledger };
}

const PASSKEY = {
  credentialId: 'cred_test_123',
  clientDataJson: 'eyJjaGFsbGVuZ2UiOiJ0ZXN0In0',
  authenticatorData: 'SZYN5YgOjGh0NBcPZHZgOn4_krmg100eqmzVoArgHrEdAAAAAA',
  signature: 'MEQCID4Zq8Z8...',
};

describe('WealthApi', () => {
  it('returns seeded Elena portfolio and products', async () => {
    const { api } = setup();
    const portfolio = await api.getPortfolio('default', 'default');
    assert.equal(portfolio.baseCurrency, 'EUR');
    assert.equal(portfolio.totalValuationBase, 9500000);
    assert.equal(portfolio.holdings.length, 3);

    const prods = await api.getProducts();
    assert.ok(prods.products.length >= 4);
    for (const p of prods.products) {
      assert.ok(['STOCK', 'BOND', 'MUTUAL_FUND_ETF'].includes(p.securityType), `${p.symbol} lacks a security type`);
    }
    const types = new Set(prods.products.map((p) => p.securityType));
    assert.deepEqual([...types].sort(), ['BOND', 'MUTUAL_FUND_ETF', 'STOCK']);
  });

  it('optimizes portfolio generating rebalance proposal', async () => {
    const { api } = setup();
    const proposal = await api.optimizePortfolio('default', 'default');
    // Seeded Elena squeeze: base 7.0 at 3.2 months family runway recalibrates to 6.0.
    assert.equal(proposal.effectiveRiskScore, 6.0);
    assert.ok(proposal.actions.length > 0);
    assert.ok(proposal.rationale.personalFinance.length > 0);
    assert.ok(proposal.rationale.crossBorder.length > 0);
    assert.ok(proposal.rationale.wealthStrategy.length > 0);
  });

  it('never plans buys the sells cannot fund', async () => {
    const { api } = setup();
    const { actions } = await api.optimizePortfolio('default', 'default');
    const sold = actions.filter((a) => a.action === 'SELL').reduce((sum, a) => sum + a.amountBase, 0);
    const bought = actions.filter((a) => a.action === 'BUY').reduce((sum, a) => sum + a.amountBase, 0);
    assert.ok(bought <= sold, `bought ${bought} against ${sold} sold`);
    // Sells are listed first, so the list is executable in the order it is written.
    assert.ok(actions.findIndex((a) => a.action === 'BUY') > actions.findIndex((a) => a.action === 'SELL'));
  });

  it('caps a buy at the proceeds still available', async () => {
    const { api, portfolios } = setup();
    // One holding far above target and one far below it: the buy asks for more than the sell releases.
    const doc = await portfolios.findByUser('default', 'default');
    if (!doc) throw new Error('seeded portfolio expected');
    doc.holdings[0].currentWeight = 0.9;
    doc.holdings[0].targetWeight = 0.1;
    doc.holdings[1].currentWeight = 0.05;
    doc.holdings[1].targetWeight = 0.85;
    await portfolios.save(doc);

    const { actions } = await api.optimizePortfolio('default', 'default');
    const sold = actions.filter((a) => a.action === 'SELL').reduce((sum, a) => sum + a.amountBase, 0);
    const bought = actions.filter((a) => a.action === 'BUY').reduce((sum, a) => sum + a.amountBase, 0);
    assert.equal(bought, sold);
    assert.ok(sold > 0);
  });

  it('executes sandbox trade with passkey and generates SHA-256 audit digest', async () => {
    const { api } = setup();
    const res = await api.executeTrade('default', 'default', {
      orderType: 'PORTFOLIO_REBALANCE',
      trades: [
        { assetSymbol: 'CSPX.LSE', action: 'SELL', amountBase: 1900000, targetWeight: 0.4 },
        { assetSymbol: 'IEAC.LSE', action: 'BUY', amountBase: 950000, targetWeight: 0.35 },
      ],
      passkeyAssertion: {
        credentialId: 'cred_test_123',
        clientDataJson: 'eyJjaGFsbGVuZ2UiOiJ0ZXN0In0',
        authenticatorData: 'SZYN5YgOjGh0NBcPZHZgOn4_krmg100eqmzVoArgHrEdAAAAAA',
        signature: 'MEQCID4Zq8Z8...',
      },
    });

    assert.equal(res.success, true);
    assert.equal(res.ledgerEntry.status, 'COMMITTED');
    assert.ok(res.ledgerEntry.auditDigest.length === 64);
    assert.ok(res.ledgerEntry.transactionHash.startsWith('0x'));

    const ledger = await api.getLedger('default', 'default');
    assert.equal(ledger.entries.length, 1);
    assert.equal(ledger.entries[0].auditDigest, res.ledgerEntry.auditDigest);
  });

  it('refuses a target weight the profile never proposed', async () => {
    const { api, portfolios } = setup();
    const before = await portfolios.findByUser('default', 'default');
    const original = before?.holdings[0]?.targetWeight ?? 0;

    await assert.rejects(
      () =>
        api.executeTrade('default', 'default', {
          orderType: 'PORTFOLIO_REBALANCE',
          // A caller-supplied weight, not the recorded target: 99% of the portfolio on one symbol.
          trades: [{ assetSymbol: 'CSPX.LSE', action: 'BUY', amountBase: 100000, targetWeight: 0.99 }],
          passkeyAssertion: PASSKEY,
        }),
      /no permitted rebalance/,
    );

    const after = await portfolios.findByUser('default', 'default');
    assert.equal(after?.holdings[0]?.currentWeight, before?.holdings[0]?.currentWeight);
    assert.equal(after?.holdings[0]?.targetWeight, original);
  });

  it('refuses a trade for a symbol the portfolio does not hold', async () => {
    const { api } = setup();
    await assert.rejects(
      () =>
        api.executeTrade('default', 'default', {
          orderType: 'PORTFOLIO_REBALANCE',
          trades: [{ assetSymbol: 'NOT-HELD.LSE', action: 'BUY', amountBase: 100000, targetWeight: 0.1 }],
          passkeyAssertion: PASSKEY,
        }),
      /no permitted rebalance/,
    );
  });

  it('leaves the portfolio unchanged when the ledger refuses the entry', async () => {
    const { api, portfolios } = setup();
    const failing: SandboxLedgerRepository = {
      async append(): Promise<never> {
        throw new Error('ledger unavailable');
      },
      async findAllByUser(): Promise<SandboxLedgerDocument[]> {
        return [];
      },
    };
    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios,
      ledger: failing,
      passkeys: acceptingPasskeys,
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
    });
    const before = await portfolios.findByUser('default', 'default');
    const trade = { assetSymbol: 'CSPX.LSE', action: 'SELL' as const, amountBase: 100, targetWeight: before?.holdings[0]?.targetWeight ?? 0 };

    await assert.rejects(() =>
      wealth.executeTrade('default', 'default', { orderType: 'PORTFOLIO_REBALANCE', trades: [trade], passkeyAssertion: PASSKEY }),
    );

    const after = await portfolios.findByUser('default', 'default');
    assert.equal(after?.holdings[0]?.currentWeight, before?.holdings[0]?.currentWeight);
    assert.equal(after?.lastRebalancedAt, before?.lastRebalancedAt);
  });

  it('moves the portfolio to the recorded targets once the ledger has the entry', async () => {
    const { api, portfolios, ledger } = setup();
    const before = await portfolios.findByUser('default', 'default');
    const trade = { assetSymbol: 'CSPX.LSE', action: 'SELL' as const, amountBase: 100, targetWeight: before?.holdings[0]?.targetWeight ?? 0 };

    const res = await api.executeTrade('default', 'default', {
      orderType: 'PORTFOLIO_REBALANCE',
      trades: [trade],
      passkeyAssertion: PASSKEY,
    });
    assert.equal(res.success, true);

    const after = await portfolios.findByUser('default', 'default');
    assert.equal(after?.holdings[0]?.currentWeight, trade.targetWeight);
    assert.equal(after?.lastRebalancedAt?.toISOString(), '2026-10-06T12:00:00.000Z');
    assert.equal((await ledger.findAllByUser('default', 'default')).length, 1);
  });

  it('rejects trade execution without passkey assertion proof', async () => {
    const { api } = setup();
    await assert.rejects(
      () =>
        api.executeTrade('default', 'default', {
          orderType: 'PORTFOLIO_REBALANCE',
          trades: [],
          passkeyAssertion: {
            credentialId: '',
            clientDataJson: '',
            authenticatorData: '',
            signature: '',
          },
        }),
      /passkey signature required/,
    );
  });

  it('refuses an assertion the verifier rejects, before any ledger entry or portfolio change', async () => {
    const { api, portfolios, ledger } = setup({ verify: async () => false });
    const before = await portfolios.findByUser('default', 'default');
    const trade = { assetSymbol: 'CSPX.LSE', action: 'SELL' as const, amountBase: 100, targetWeight: before?.holdings[0]?.targetWeight ?? 0 };

    await assert.rejects(
      () => api.executeTrade('default', 'default', { orderType: 'PORTFOLIO_REBALANCE', trades: [trade], passkeyAssertion: PASSKEY }),
      (error: { code?: string }) => error.code === 'WL_1004',
    );

    assert.deepEqual(await ledger.findAllByUser('default', 'default'), []);
    const after = await portfolios.findByUser('default', 'default');
    assert.equal(after?.holdings[0]?.currentWeight, before?.holdings[0]?.currentWeight);
  });

  it('returns seeded risk profile for demo user', async () => {
    const { api } = setup();
    const profile = await api.getProfile('default', 'default');
    assert.equal(profile.summary.baseRiskScore, 7.0);
    assert.equal(profile.summary.effectiveRiskBand, 'moderate');
    assert.ok(profile.answers.countries.residence === 'DE');
  });

  it('throws WL_1006 when risk profile does not exist for an unknown user', async () => {
    const { api } = setup();
    await assert.rejects(
      () => api.getProfile('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
      (err: { code?: string }) => err.code === 'WL_1006',
    );
  });

  it('saves and calculates updated risk profile, recomputing base risk score on the portfolio', async () => {
    const { api, portfolios } = setup();
    const updated = await api.saveProfile('default', 'default', {
      psychology: ['PROTECT_CAPITAL'],
      countries: {
        residence: 'AE',
        incomeSources: ['AE'],
        remittanceDestinations: ['IN'],
      },
      instruments: ['MONEY_MARKET_CASH'],
      holdings: {
        cashSavings: { amount: 50000, currency: 'AED' },
        brokerageStocks: { amount: 0, currency: 'AED' },
        retirementPension: { amount: 0, currency: 'AED' },
        otherAssets: { amount: 0, currency: 'AED' },
      },
      age: 45,
      goals: {
        tags: ['RETIREMENT', 'EMERGENCY_BUFFER'],
        notes: 'Capital preservation in UAE.',
      },
      stressResponse: 'CUT_RISK',
    });

    assert.equal(updated.summary.effectiveRiskBand, 'conservative');
    assert.deepEqual(updated.summary.corridorCurrencies, ['AED', 'INR']);

    const portfolio = await portfolios.findByUser('default', 'default');
    assert.equal(portfolio?.baseRiskScore, updated.summary.baseRiskScore);
  });

  it('constructs a moderate multi-asset portfolio with stocks, bonds and ETFs', async () => {
    const { api } = setup();
    const result = await api.constructPortfolio('default', 'default', { riskTier: 'moderate' });

    const types = new Set(result.holdings.map((h) => h.securityType));
    assert.ok(types.has('STOCK'), `expected a STOCK holding, got ${[...types]}`);
    assert.ok(types.has('BOND'), `expected a BOND holding, got ${[...types]}`);
    assert.ok(types.has('MUTUAL_FUND_ETF'), `expected a MUTUAL_FUND_ETF holding, got ${[...types]}`);

    const totalWeight = result.holdings.reduce((sum, h) => sum + h.weight, 0);
    assert.ok(Math.abs(totalWeight - 1.0) < 0.001, `weights sum to ${totalWeight}`);
  });

  it('constructs optimal portfolio integrating technical, fundamental, bond, and mutual fund analytics', async () => {
    const { api } = setup();
    const result = await api.constructPortfolio('default', 'default');

    assert.ok(result.holdings.length > 0);
    const totalWeight = result.holdings.reduce((sum, h) => sum + h.weight, 0);
    assert.ok(Math.abs(totalWeight - 1.0) < 0.001);

    assert.ok(result.portfolioExpectedReturn > 0);
    assert.ok(result.portfolioVolatility > 0);
    assert.ok(result.durationWeightedExposure >= 0);

    // Stress testing and Monte Carlo
    assert.equal(result.stressTestOutcomes.length, 4);
    assert.equal(result.monteCarlo.numSimulations, 2000);
    assert.ok(result.monteCarlo.valueAtRisk95 >= 0);

    // Rationale multi-pillar and source attribution
    assert.ok(result.rationale.personalFinance.length > 0);
    assert.ok(result.rationale.crossBorder.length > 0);
    assert.ok(result.rationale.wealthStrategy.length > 0);
    assert.ok(result.rationale.technicalAttribution.length > 0);
    assert.ok(result.rationale.fundamentalAttribution.length > 0);
    assert.ok(result.rationale.regulatoryAttribution.length > 0);
    assert.ok(result.sourceAttribution.length >= 5);
  });

  it('constructs Sharia-compliant portfolio when requested or for UAE clients', async () => {
    const { api } = setup();
    const result = await api.constructPortfolio('default', 'default', {
      shariaOnly: true,
      riskTier: 'moderate',
    });

    assert.ok(result.holdings.length > 0);
    for (const h of result.holdings) {
      assert.equal(h.isShariaCompliant, true);
    }
    assert.equal(result.complianceChecks.shariaPassed, true);
    assert.ok(result.rationale.regulatoryAttribution.includes('Sharia'));
  });

  it('constructs jurisdiction-specific portfolio for India or UAE', async () => {
    const { api } = setup();
    const indiaResult = await api.constructPortfolio('default', 'default', {
      jurisdiction: 'INDIA',
    });
    assert.ok(indiaResult.holdings.length > 0);
    assert.ok(indiaResult.holdings.some((h) => h.symbol.includes('.NSE') || h.symbol.includes('GSEC') || h.symbol.includes('HDFC')));

    const uaeResult = await api.constructPortfolio('default', 'default', {
      jurisdiction: 'UAE',
    });
    assert.ok(uaeResult.holdings.length > 0);
    assert.ok(uaeResult.holdings.some((h) => h.symbol.includes('SUKUK') || h.symbol.includes('.DFM')));
  });
});
