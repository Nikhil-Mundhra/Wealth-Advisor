import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';

function setup() {
  const accounts = new MemoryAccountRepository();
  const transactions = new MemoryTransactionRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createFinanceApi({ accounts, transactions, clock });
  return { api };
}

describe('FinanceApi', () => {
  it('loads seeded accounts across EUR, GBP, and SGD', async () => {
    const { api } = setup();
    const res = await api.getAccounts('default', 'default');
    assert.equal(res.accounts.length, 3);
    const currencies = res.accounts.map((a) => a.currency);
    assert.ok(currencies.includes('EUR'));
    assert.ok(currencies.includes('GBP'));
    assert.ok(currencies.includes('SGD'));
  });

  it('computes burn rate and runway adapting to household mode', async () => {
    const { api } = setup();

    const family = await api.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    assert.equal(family.householdMode, 'FAMILY_HOUSEHOLD');
    assert.equal(family.reserveMultiplier, 2.0);
    assert.ok(family.runwayMonths > 0);
    assert.equal(family.remittanceCorridors.length, 2);

    const individual = await api.getCashflowSummary('default', 'default', 'INDIVIDUAL');
    assert.equal(individual.householdMode, 'INDIVIDUAL');
    assert.equal(individual.reserveMultiplier, 1.0);
    // Individual runway is longer than family runway because reserve requirement is lower
    assert.ok(individual.runwayMonths >= family.runwayMonths);
  });
});
