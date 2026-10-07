import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import type { SandboxLedgerRepository } from '../../../src/modules/wealth/application/ports.ts';
import type { SandboxLedgerDocument } from '../../../src/modules/wealth/infrastructure/db/documents/sandbox-ledger.document.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';

function setup() {
  const products = new MemoryAssetProductRepository();
  const portfolios = new MemoryPortfolioRepository();
  const ledger = new MemorySandboxLedgerRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createWealthApi({ products, portfolios, ledger, clock });
  return { api, portfolios, ledger };
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
  });

  it('optimizes portfolio generating rebalance proposal', async () => {
    const { api } = setup();
    const proposal = await api.optimizePortfolio('default', 'default');
    assert.equal(proposal.effectiveRiskScore, 4.0);
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
});
