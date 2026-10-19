import { ChevronDown, Sparkles, User, Users } from 'lucide-react';
import { useState } from 'react';
import { useActiveClient, useAdvisorClients, setActiveClient } from '../advisor-store.ts';

interface ClientSelectorProps {
  onOpenBrief?: () => void;
  onOpenInstruments?: () => void;
}

export function ClientSelector({ onOpenBrief, onOpenInstruments }: ClientSelectorProps) {
  const activeClient = useActiveClient();
  const clients = useAdvisorClients();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {/* Active Client Dropdown Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex items-center gap-2.5 rounded-field border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-brand-600 cursor-pointer"
          aria-expanded={dropdownOpen}
          aria-label="Select active advisory client"
        >
          <div className="flex size-6 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-600 text-[11px]">
            {activeClient.name.split(' ').map((n) => n[0]).join('')}
          </div>

          <div className="text-left hidden sm:block">
            <span className="font-semibold text-ink block leading-tight">{activeClient.name}</span>
            <span className="text-[10px] text-subtle block leading-tight">
              {activeClient.householdMode === 'FAMILY_HOUSEHOLD' ? 'Family' : 'Individual'} · {activeClient.location}
            </span>
          </div>

          <ChevronDown className="size-3.5 text-subtle" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute left-0 mt-2 z-50 w-72 rounded-card border border-line bg-surface p-2 shadow-lg animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-subtle">
                Advisor Client Roster
              </div>

              <div className="py-1 space-y-1">
                {clients.map((client) => {
                  const isSelected = client.id === activeClient.id;
                  const isFamily = client.householdMode === 'FAMILY_HOUSEHOLD';
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setActiveClient(client.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-field p-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100 font-semibold'
                          : 'text-ink hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-full bg-surface-subtle border border-line text-xs font-bold">
                          {client.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{client.name}</p>
                          <p className="text-[10px] text-subtle leading-tight mt-0.5">
                            {client.location} · {client.runwayMonths.toFixed(1)}m runway
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          client.runwayBand === 'critical'
                            ? 'bg-danger-subtle text-danger'
                            : client.runwayBand === 'warning'
                            ? 'bg-gold-subtle text-gold'
                            : 'bg-surface-subtle text-subtle'
                        }`}
                      >
                        {client.runwayMonths.toFixed(1)}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Action: Pre-Meeting Brief Trigger */}
      {onOpenBrief && (
        <button
          type="button"
          onClick={onOpenBrief}
          className="inline-flex items-center gap-1.5 rounded-field border border-brand-600/30 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-600 cursor-pointer"
          title="Open AI Pre-Meeting Briefing"
        >
          <Sparkles className="size-3.5" />
          <span className="hidden md:inline">Pre-Meeting Brief</span>
        </button>
      )}

      {/* Quick Action: Product Comparison Trigger */}
      {onOpenInstruments && (
        <button
          type="button"
          onClick={onOpenInstruments}
          className="inline-flex items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-subtle cursor-pointer"
          title="Compare Institutional Instruments"
        >
          <span className="hidden md:inline">Product Comparison</span>
          <span className="md:hidden">Products</span>
        </button>
      )}
    </div>
  );
}
