// RFC 4180 CSV serializer with UTF-8 BOM for spreadsheet and tax filing export.

export interface LedgerRow {
  timestamp: string;
  action: string;
  tier: string;
  auditDigest: string;
  passkeyProofPresent: boolean;
}

export interface LedgerExportMeta {
  period: string;
  baselineCurrency: string;
}

export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvValue).join(',');
}

export function serializeLedgerToCsv(
  entries: LedgerRow[],
  meta?: LedgerExportMeta,
): string {
  const rows: string[] = [];

  if (meta) {
    rows.push(toCsvRow(['Report', 'Tax and Sandbox Execution Ledger']));
    rows.push(toCsvRow(['Period', meta.period]));
    rows.push(toCsvRow(['Baseline Currency', meta.baselineCurrency]));
    rows.push('');
  }

  rows.push(toCsvRow(['Timestamp', 'Action', 'Tier', 'Audit Digest', 'Passkey Proof Present']));

  for (const entry of entries) {
    rows.push(
      toCsvRow([
        entry.timestamp,
        entry.action,
        entry.tier,
        entry.auditDigest,
        entry.passkeyProofPresent ? 'YES' : 'NO',
      ]),
    );
  }

  return '\uFEFF' + rows.join('\r\n') + '\r\n';
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
