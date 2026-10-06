import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
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
  return { api };
}

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
