import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, FileText, Layers, MessagesSquare, Sparkles, TrendingUp, User, Users } from 'lucide-react';
import { useActiveClient, useAdvisorClients, setActiveClient } from '../advisor-store.ts';
import { formatMoney } from '../../../lib/format-money.ts';
import type { AdvisorClient } from '../types.ts';

interface ClientRosterProps {
  onOpenBriefForClient?: (client: AdvisorClient) => void;
  onNavigateToAdvisory?: () => void;
}

export function ClientRoster({ onOpenBriefForClient, onNavigateToAdvisory }: ClientRosterProps) {
  const activeClient = useActiveClient();
  const clients = useAdvisorClients();

  return (
    <section aria-label="Advisor Client Roster" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Advisor Client Roster</h2>
          <p className="text-xs text-muted">
            Managing 4 active cross-border client accounts across Europe & Asia corridors.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {clients.map((client) => {
          const isSelected = client.id === activeClient.id;
          const isFamily = client.householdMode === 'FAMILY_HOUSEHOLD';
          const isCritical = client.runwayBand === 'critical';
          const isWarning = client.runwayBand === 'warning';

          return (
            <div
              key={client.id}
              className={`flex flex-col justify-between rounded-card border p-4 transition-all ${
                isSelected
                  ? 'border-brand-600 bg-surface shadow-sm ring-1 ring-brand-600'
                  : 'border-line bg-surface hover:border-line-subtle hover:shadow-xs'
              }`}
            >
              <div>
                {/* Client Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-brand-50 font-bold text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                      {client.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink leading-tight">{client.name}</h3>
                      <p className="text-[11px] text-subtle leading-tight mt-0.5">{client.location}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isCritical
                        ? 'bg-danger-subtle text-danger'
                        : isWarning
                        ? 'bg-gold-subtle text-gold'
                        : 'bg-surface-subtle text-subtle'
                    }`}
                  >
                    {client.runwayMonths.toFixed(1)}m
                  </span>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-control bg-surface-subtle p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-medium text-subtle block">Net Worth</span>
                    <span className="font-semibold text-ink font-mono text-xs">
                      {client.netWorth === 95000 ? '~€0.1M' : formatMoney(client.netWorth, client.baseCurrency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-medium text-subtle block">Mode</span>
                    <span className="font-semibold text-ink text-xs flex items-center gap-1">
                      {isFamily ? <Users className="size-3" /> : <User className="size-3" />}
                      {isFamily ? 'Family' : 'Individual'}
                    </span>
                  </div>
                </div>

                {/* Drift / Alert Tag */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-[11px] font-medium leading-tight ${
                      client.driftAlert?.includes('Breach')
                        ? 'bg-danger-subtle text-danger'
                        : client.driftAlert?.includes('Drag')
                        ? 'bg-gold-subtle text-gold'
                        : 'bg-surface-subtle text-subtle'
                    }`}
                  >
                    {client.driftAlert?.includes('Breach') && <AlertTriangle className="size-3 shrink-0" />}
                    {client.driftAlert ?? 'Within ±5% corridor'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveClient(client.id);
                    if (onOpenBriefForClient) {
                      onOpenBriefForClient(client);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-600 cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>Brief</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveClient(client.id)}
                  className={`rounded-field px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-brand-600 text-white dark:text-brand-950 font-semibold'
                      : 'border border-line bg-surface text-ink hover:bg-surface-subtle'
                  }`}
                >
                  {isSelected ? 'Active' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
