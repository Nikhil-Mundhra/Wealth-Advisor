import { describe, expect, it } from 'vitest';
import { escapeCsvValue, serializeLedgerToCsv, toCsvRow, type LedgerRow } from './csv-export.ts';

describe('escapeCsvValue and toCsvRow', () => {
  it('leaves standard alphanumeric strings unquoted', () => {
    expect(escapeCsvValue('2026-09-30')).toBe('2026-09-30');
    expect(escapeCsvValue('TIER_3_EXECUTE')).toBe('TIER_3_EXECUTE');
  });

  it('escapes and quotes values containing commas', () => {
    expect(escapeCsvValue('Buy equities, rebalance bonds')).toBe('"Buy equities, rebalance bonds"');
  });

  it('escapes and quotes values containing double quotes', () => {
    expect(escapeCsvValue('Execute "Urgent" swap')).toBe('"Execute ""Urgent"" swap"');
  });

  it('escapes and quotes values containing newlines', () => {
    expect(escapeCsvValue("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvValue("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
  });

  it('joins values with commas using RFC 4180 rules', () => {
    const row = toCsvRow(['2026-09-30', 'Sell "ETF", buy notes', 100]);
    expect(row).toBe('2026-09-30,"Sell ""ETF"", buy notes",100');
  });
});

describe('serializeLedgerToCsv', () => {
  it('starts with UTF-8 BOM prefix', () => {
    const csv = serializeLedgerToCsv([]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('serializes an empty ledger without throwing', () => {
    expect(() => serializeLedgerToCsv([])).not.toThrow();
    const csv = serializeLedgerToCsv([]);
    expect(csv).toContain('Timestamp,Action,Tier,Audit Digest,Passkey Proof Present');
  });

  it('serializes rows with metadata and escapes special characters properly', () => {
    const entries: LedgerRow[] = [
      {
        timestamp: '2026-09-30 18:42 UTC',
        action: 'Rebalance 20% US equities, move to cash\nNote: "Quarterly"',
        tier: 'TIER_3_EXECUTE',
        auditDigest: '9f2c41ab...e7',
        passkeyProofPresent: true,
      },
      {
        timestamp: '2026-09-30 18:15 UTC',
        action: 'Simulate -5% EUR shock',
        tier: 'TIER_2_SIMULATE',
        auditDigest: '41bd09cc...12',
        passkeyProofPresent: false,
      },
    ];

    const meta = {
      period: '2026-09-01 to 2026-09-30',
      baselineCurrency: 'EUR',
    };

    const csv = serializeLedgerToCsv(entries, meta);

    expect(csv).toContain('Report,Tax and Sandbox Execution Ledger');
    expect(csv).toContain('Period,2026-09-01 to 2026-09-30');
    expect(csv).toContain('Baseline Currency,EUR');
    expect(csv).toContain('"Rebalance 20% US equities, move to cash\nNote: ""Quarterly"""');
    expect(csv).toContain('TIER_3_EXECUTE,9f2c41ab...e7,YES');
    expect(csv).toContain('TIER_2_SIMULATE,41bd09cc...12,NO');
  });
});
