import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { INSTITUTIONAL_INSTRUMENTS } from '../instruments-data.ts';
import type { InstitutionalInstrument } from '../types.ts';
import { useState } from 'react';

interface InstrumentComparisonModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstrumentComparisonModal({ open, onClose }: InstrumentComparisonModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'Equities' | 'Fixed Income' | 'Money Market'>('ALL');

  if (!open) return null;

  const filteredInstruments = selectedFilter === 'ALL'
    ? INSTITUTIONAL_INSTRUMENTS
    : INSTITUTIONAL_INSTRUMENTS.filter((i) => i.category === selectedFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-title"
        className="relative w-full max-w-4xl rounded-card border border-line bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
              Institutional Product Architecture
            </span>
            <h2 id="comparison-title" className="font-display text-xl font-bold text-ink">
              Instrument Comparison Matrix
            </h2>
            <p className="mt-1 text-xs text-muted">
              Liquid UCITS ETFs and money-market instruments utilized by Syntropy AI deterministic optimizer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-subtle hover:text-ink hover:bg-surface-subtle transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(['ALL', 'Equities', 'Fixed Income', 'Money Market'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-control px-3 py-1 font-medium transition cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-brand-600 text-white dark:text-brand-950 font-semibold'
                  : 'bg-surface-subtle text-subtle hover:text-ink border border-line'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-4 overflow-x-auto rounded-field border border-line">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-surface-subtle text-subtle">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Instrument & ISIN</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Asset Sleeve</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">TER</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Yield</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Domicile & Policy</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Tax & Fiduciary Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredInstruments.map((instrument) => (
                <tr key={instrument.ticker} className="hover:bg-surface-subtle/50 transition">
                  <td className="px-3 py-3 font-medium">
                    <span className="font-bold text-ink block font-mono">{instrument.ticker}</span>
                    <span className="text-[11px] text-muted block">{instrument.name}</span>
                    <span className="text-[10px] text-subtle font-mono block mt-0.5">{instrument.isin}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-control bg-surface-subtle border border-line px-2 py-0.5 text-[10px] font-medium text-ink">
                      {instrument.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-ink">
                    {instrument.ter.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-ink">
                    {instrument.yieldPct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3">
                    <span className="block text-ink">{instrument.domicile} ({instrument.currency})</span>
                    <span className="text-[10px] text-subtle block">{instrument.distributionPolicy} · {instrument.replication}</span>
                  </td>
                  <td className="px-3 py-3 max-w-xs text-[11px] leading-relaxed text-muted">
                    {instrument.taxEfficiencyNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs">
          <div className="flex items-center gap-1.5 text-subtle">
            <ShieldCheck className="size-4 text-brand-600" />
            <span>All instruments are UCITS compliant with daily liquidity and physical replication transparency.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-field border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
