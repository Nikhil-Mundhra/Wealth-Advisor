import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAdvisoryApi } from '../../../src/modules/advisory/advisory.api.ts';
import { LlmGateway } from '../../../src/modules/advisory/domain/llm-gateway.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';

function setupApis() {
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const finance = createFinanceApi({
    accounts: new MemoryAccountRepository(),
    transactions: new MemoryTransactionRepository(),
    clock,
  });
  const wealth = createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys: unregisteredPasskeyVerifier,
    clock,
  });
  return { finance, wealth };
}

function setup() {
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const finance = createFinanceApi({
    accounts: new MemoryAccountRepository(),
    transactions: new MemoryTransactionRepository(),
    clock,
  });
  const wealth = createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys: unregisteredPasskeyVerifier,
    clock,
  });
  const gateway = new LlmGateway();
  const api = createAdvisoryApi({ finance, wealth, gateway });
  return { api };
}

describe('AdvisoryApi', () => {
  it('delivers grounded advice and three-pillar rationale in English', async () => {
    const { api } = setup();
    const res = await api.chat('default', 'default', {
      message: 'My EUR income dropped and remittances to Asia are getting expensive. What should I do?',
      locale: 'en',
      householdMode: 'FAMILY_HOUSEHOLD',
    });

    assert.ok(res.reply.includes('family household'));
    assert.ok(res.threePillarRationale.personalFinance.length > 0);
    assert.ok(res.threePillarRationale.crossBorder.includes('remittance'));
    assert.ok(res.threePillarRationale.wealthStrategy.includes('equities'));
    assert.equal(res.actionCards.length, 2);
    assert.equal(res.actionCards[0].cardType, 'PROPOSAL');
  });

  it('delivers three-pillar rationale across multilingual locales', async () => {
    const { api } = setup();
    const zh = await api.chat('default', 'default', {
      message: '汇率波动怎么办？',
      locale: 'zh-CN',
      householdMode: 'FAMILY_HOUSEHOLD',
    });

    assert.ok(zh.reply.includes('家庭'));
    assert.ok(zh.complianceDisclaimer.includes('沙盒顾问模式'));
  });

  it('supports openai and gemini providers with graceful fallback to grounded mock', async () => {
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
    const finance = createFinanceApi({
      accounts: new MemoryAccountRepository(),
      transactions: new MemoryTransactionRepository(),
      clock,
    });
    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios: new MemoryPortfolioRepository(),
      ledger: new MemorySandboxLedgerRepository(),
      passkeys: unregisteredPasskeyVerifier,
      clock,
    });
    const gateway = new LlmGateway({
      geminiApiKey: 'test-dummy-gemini-key',
      openaiApiKey: 'test-dummy-openai-key',
    });

    const openaiApi = createAdvisoryApi({
      finance,
      wealth,
      gateway,
      getActiveProvider: async () => 'openai',
    });

    const res = await openaiApi.chat('default', 'default', {
      message: 'Can I rebalance safely?',
      locale: 'en',
      householdMode: 'INDIVIDUAL',
    });

    assert.ok(res.reply.includes('individual profile'));
    assert.ok(res.actionCards.length === 2);
    assert.equal(res.actionCards[0].cardType, 'PROPOSAL');
    assert.ok(res.actionCards[0].payload.valuationTotalBase > 0);
  });

  it('keeps a live model reply only when its numbers come from the engines', async () => {
    const { finance, wealth } = setupApis();
    const gateway = new LlmGateway({ geminiApiKey: 'test-key' });
    const api = createAdvisoryApi({ finance, wealth, gateway, getActiveProvider: async () => 'gemini' });
    const deterministic = await createAdvisoryApi({ finance, wealth, gateway: new LlmGateway() }).chat('default', 'default', {
      message: 'Can I rebalance safely?',
      locale: 'en',
      householdMode: 'INDIVIDUAL',
    });
    const modelOutput = {
      reply: 'Rebalancing is safe and will return 12.7% a year.',
      personalFinance: 'Keep your buffer topped up.',
      crossBorder: 'Hedge your remittance corridors.',
      wealthStrategy: 'Hold the target weights.',
    };
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(modelOutput) }] } }] }), {
        status: 200,
      });
    try {
      const res = await api.chat('default', 'default', { message: 'Can I rebalance safely?', locale: 'en', householdMode: 'INDIVIDUAL' });
      assert.equal(res.reply, deterministic.reply);
      assert.equal(res.threePillarRationale.crossBorder, 'Hedge your remittance corridors.');
      assert.equal(res.threePillarRationale.wealthStrategy, 'Hold the target weights.');
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

