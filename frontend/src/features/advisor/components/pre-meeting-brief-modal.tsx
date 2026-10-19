import { AlertTriangle, CheckCircle2, Copy, FileText, Globe, Layers, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useActiveClient } from '../advisor-store.ts';
import type { AdvisorClient } from '../types.ts';

interface PreMeetingBriefModalProps {
  open: boolean;
  onClose: () => void;
  client?: AdvisorClient;
  onNavigateToAdvisory?: () => void;
}

export function PreMeetingBriefModal({ open, onClose, client: propClient, onNavigateToAdvisory }: PreMeetingBriefModalProps) {
  const activeClient = useActiveClient();
  const client = propClient ?? activeClient;
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const brief = client.preMeetingBrief;

  const handleCopy = () => {
    const text = `PRE-MEETING BRIEF: ${client.name}\n${brief.headline}\n\nSUMMARY:\n${brief.summary}\n\nRUNWAY & DRIFT:\n- ${brief.runwayStatus}\n- ${brief.driftAlert ?? 'Within tolerance'}\n\nAGENDA:\n${brief.recommendedAgenda.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nPROPOSED ACTIONS:\n${brief.proposedActions.map((a) => `- ${a}`).join('\n')}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
        className="relative w-full max-w-2xl rounded-card border border-line bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
                AI Advisor OS · 30-Second Pre-Meeting Briefing
              </span>
              <h2 id="brief-title" className="font-display text-lg font-bold text-ink">
                {client.name} ({client.householdMode === 'FAMILY_HOUSEHOLD' ? 'Family Household' : 'Individual'})
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-subtle hover:text-ink hover:bg-surface-subtle transition cursor-pointer"
            aria-label="Close brief"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5">
          {/* Headline Banner */}
          <div className="rounded-field border border-brand-600/30 bg-brand-50/50 p-4 dark:bg-brand-950/40">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-800 dark:text-brand-300">
              <AlertTriangle className="size-4 shrink-0 text-brand-600" />
              <span>{brief.headline}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {brief.summary}
            </p>
          </div>

          {/* Key Quantitative Diagnostics Strip */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-field border border-line bg-surface-subtle p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                Emergency Runway Gauge
              </span>
              <p className="mt-1 text-xs font-semibold text-ink">{brief.runwayStatus}</p>
            </div>

            <div className="rounded-field border border-line bg-surface-subtle p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                Asset Allocation Drift Status
              </span>
              <p className="mt-1 text-xs font-semibold text-ink">
                {brief.driftAlert ?? 'Within ±5% corridor'}
              </p>
            </div>
          </div>

          {/* FX Remittance Shock Alert (if present) */}
          {brief.fxShockAlert && (
            <div className="rounded-field border border-gold/30 bg-gold-subtle/40 p-3.5 text-xs text-ink flex items-start gap-2.5">
              <Globe className="size-4 text-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-gold">Cross-Border Corridor Exposure:</span>
                <span className="text-muted leading-relaxed mt-0.5 block">{brief.fxShockAlert}</span>
              </div>
            </div>
          )}

          {/* Recommended Meeting Agenda */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-2.5">
              Recommended Advisor Agenda
            </h3>
            <ol className="space-y-2 text-xs">
              {brief.recommendedAgenda.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 rounded-control border border-line bg-surface p-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-bold text-[11px] text-ink">
                    {idx + 1}
                  </span>
                  <span className="text-ink leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Proposed Execution Tickets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-2.5">
              Pre-Calculated Rebalance Actions
            </h3>
            <ul className="space-y-1.5 text-xs">
              {brief.proposedActions.map((action, idx) => (
                <li key={idx} className="flex items-center gap-2 rounded-control bg-surface-subtle px-3 py-2 text-ink">
                  <CheckCircle2 className="size-3.5 text-brand-600 shrink-0" />
                  <span className="font-medium font-mono text-[11px]">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-field border border-line bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-surface-subtle transition cursor-pointer"
          >
            <Copy className="size-3.5" />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Briefing to Clipboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onNavigateToAdvisory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAdvisory();
                }}
                className="inline-flex items-center gap-1.5 rounded-field bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 dark:text-brand-950 cursor-pointer"
              >
                <Layers className="size-3.5" />
                <span>Simulate in Advisory Copilot</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-field border border-line bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-surface-subtle cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
