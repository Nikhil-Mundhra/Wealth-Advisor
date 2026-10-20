import { describe, expect, it } from 'vitest';
import { serializeLedgerToJson } from './json-export.ts';

describe('serializeLedgerToJson', () => {
  it('wraps entries with the report envelope', () => {
    const json = serializeLedgerToJson([{ action: 'Rebalance', digest: 'abc' }], {
      period: 'September 2026',
      baselineCurrency: 'EUR',
    });
    const parsed = JSON.parse(json);
    expect(parsed.report).toBe('Tax and Sandbox Execution Ledger');
    expect(parsed.period).toBe('September 2026');
    expect(parsed.entries).toHaveLength(1);
  });
});
