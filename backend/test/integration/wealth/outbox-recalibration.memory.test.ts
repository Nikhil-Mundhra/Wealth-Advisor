import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TRANSACTION_INGESTED } from '@wealth-advisor/contracts';
import { DurableOutboxEventBus, createMemoryOutboxStore } from '#core/events/outbox-bus.ts';
import { createProcessedEvents } from '#core/events/processed-events.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';

describe('DurableOutboxEventBus cross-module recalibration', () => {
  it('propagates ingested spending spikes asynchronously to recalibrate wealth portfolio risk', async () => {
    const now = new Date('2026-10-06T12:00:00Z');
    const clock = { now: () => now };
    const bus = new DurableOutboxEventBus({ clock, autoDrain: true });
    const accounts = new MemoryAccountRepository();
    const transactions = new MemoryTransactionRepository();
    const finance = createFinanceApi({ accounts, transactions, clock, events: bus });

    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios: new MemoryPortfolioRepository(),
      profiles: new MemoryRiskProfileRepository(),
      ledger: new MemorySandboxLedgerRepository(),
      passkeys: unregisteredPasskeyVerifier,
      clock,
      finance,
      processed: createProcessedEvents('memory', async () => { throw new Error('unused'); }, clock),
    });

    bus.subscribe(TRANSACTION_INGESTED.type, async (event) => {
      await wealth.onTransactionIngested(event);
    });

    const baselineSummary = await finance.getCashflowSummary('default', 'default');
    const before = await wealth.getPortfolio('default', 'default');
    const accountList = await finance.getAccounts('default', 'default');
    const eurAccount = accountList.accounts.find((a) => a.currency === 'EUR');
    assert.ok(eurAccount);

    await finance.ingestTransaction('default', 'default', {
      accountId: eurAccount.id,
      externalId: 'tx-spike-outbox-1',
      category: 'EXPENSE_DISCRETIONARY',
      amount: 3_000_000,
      currency: 'EUR',
      description: 'Unexpected hospital & emergency remittance spike',
      timestamp: now.toISOString(),
    });

    const after = await wealth.getPortfolio('default', 'default');
    const stats = await bus.stats();
    assert.equal(stats.delivered, 1);
    assert.equal(stats.deadLettered, 0);
    assert.ok(after.burnRateRunwayMonths < baselineSummary.runwayMonths);
    assert.ok(after.effectiveRiskScore <= before.baseRiskScore);
  });
});
