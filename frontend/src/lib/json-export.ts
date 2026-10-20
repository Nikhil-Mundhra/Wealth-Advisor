// JSON export of the sandbox execution ledger for audit review and tax filing.

export interface LedgerJsonMeta {
  period: string;
  baselineCurrency: string;
  // Provenance: live ledger API vs the demo baseline shown when it is unreachable.
  source: 'live-api' | 'demo-baseline';
}

export function serializeLedgerToJson(entries: Record<string, unknown>[], meta: LedgerJsonMeta): string {
  return (
    JSON.stringify(
      {
        report: 'Tax and Sandbox Execution Ledger',
        period: meta.period,
        baselineCurrency: meta.baselineCurrency,
        source: meta.source,
        entries,
      },
      null,
      2,
    ) + '\n'
  );
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
