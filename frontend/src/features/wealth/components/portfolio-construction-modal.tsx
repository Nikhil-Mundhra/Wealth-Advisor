import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronRight, RefreshCw, Scale, ShieldCheck, X } from 'lucide-react';
import type { ConstructPortfolioResponse, JurisdictionEnum, RiskTierEnum } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier } from '@wealth-advisor/rules';
import { Button } from '../../../components/ui/button.tsx';
import { useConstructPortfolio } from '../api/use-construct-portfolio.ts';
import { AllocationTab } from './construction/allocation-tab.tsx';
import { ComplianceTab } from './construction/compliance-tab.tsx';
import { RationaleTab } from './construction/rationale-tab.tsx';
import { StressTab } from './construction/stress-tab.tsx';
import { useStrings } from '../../../lib/dictionaries.ts';

interface PortfolioConstructionModalProps {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  defaultCurrency?: string;
  defaultRiskScore?: number;
  initialTotalValue?: number;
}

const TAB_IDS = ['allocation', 'rationale', 'stress', 'compliance'] as const;
type TabId = (typeof TAB_IDS)[number];

const tabDomId = (id: TabId) => `pc-tab-${id}`;
const panelDomId = (id: TabId) => `pc-panel-${id}`;

function TabButton({ id, label, active, onSelect }: { id: TabId; label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      id={tabDomId(id)}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelDomId(id)}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      className={`px-3 py-2 border-b-2 transition cursor-pointer ${
        active ? 'border-brand-600 text-brand-700 dark:text-brand-300 font-semibold' : 'border-transparent text-subtle hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

const METRIC_TONE = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  neutral: 'text-ink',
  brand: 'text-brand-700 dark:text-brand-400',
  risk: 'text-danger',
} as const;

type MetricTone = keyof typeof METRIC_TONE;

function MetricCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: MetricTone }) {
  return (
    <div className="rounded-field border border-line bg-surface p-3">
      <span className="text-[11px] font-medium text-subtle block">{label}</span>
      <span className={`font-display text-lg font-bold ${METRIC_TONE[tone]}`}>{value}</span>
      <span className="text-[10px] text-subtle block mt-0.5">{note}</span>
    </div>
  );
}

function summaryMetrics(result: ConstructPortfolioResponse, strings: ReturnType<typeof useStrings>) {
  return [
    { label: strings['portfolio.construction.metric.expectedReturn'], value: `+${result.portfolioExpectedReturn}%`, note: strings['portfolio.construction.metric.note.expectedReturn'], tone: 'positive' },
    { label: strings['portfolio.construction.metric.volatility'], value: `${result.portfolioVolatility}%`, note: strings['portfolio.construction.metric.note.volatility'], tone: 'neutral' },
    { label: strings['portfolio.construction.metric.sharpe'], value: `${result.portfolioSharpeRatio}`, note: strings['portfolio.construction.metric.note.sharpe'], tone: 'brand' },
    { label: strings['portfolio.construction.metric.duration'], value: `${result.durationWeightedExposure} yrs`, note: strings['portfolio.construction.metric.note.duration'], tone: 'neutral' },
    { label: strings['portfolio.construction.metric.var95'], value: `-${result.monteCarlo.valueAtRisk95}%`, note: strings['portfolio.construction.metric.note.var95'], tone: 'risk' },
  ] as const;
}

export function PortfolioConstructionModal({
  open,
  onClose,
  clientName = 'Elena Vance',
  defaultCurrency = 'EUR',
  defaultRiskScore = 6.8,
  initialTotalValue = 95000,
}: PortfolioConstructionModalProps) {
  const strings = useStrings();

  const TABS = [
    { id: 'allocation', label: strings['portfolio.construction.tab.allocation'] },
    { id: 'rationale', label: strings['portfolio.construction.tab.rationale'] },
    { id: 'stress', label: strings['portfolio.construction.tab.stress'] },
    { id: 'compliance', label: strings['portfolio.construction.tab.compliance'] },
  ] as const;

  // Lazy: the first solve reads this state, so it must start from the client's own score.
  const [riskTier, setRiskTier] = useState<RiskTierEnum>(() => mapScoreToRiskTier(defaultRiskScore));
  const [jurisdiction, setJurisdiction] = useState<JurisdictionEnum>('GLOBAL');
  const [shariaOnly, setShariaOnly] = useState(false);
  const [whatIfRateShiftBps, setWhatIfRateShiftBps] = useState(0); // -200 to +200 bps
  const [activeTab, setActiveTab] = useState<TabId>('allocation');

  // The parent mounts this modal once, so a client switch arrives only as a changed score prop.
  useEffect(() => {
    setRiskTier(mapScoreToRiskTier(defaultRiskScore));
  }, [defaultRiskScore]);

  const { mutate: construct, data: result, isPending } = useConstructPortfolio();

  // Built from primitive state only, so the effect keys on those values rather than object identity.
  const buildRequest = () => ({
    riskTier,
    jurisdiction,
    shariaOnly,
    targetTotalValueBase: initialTotalValue * 100, // minor units
  });

  // Re-solves when the modal opens or any input behind the request changes.
  useEffect(() => {
    if (open) {
      construct(buildRequest());
    }
  }, [open, riskTier, jurisdiction, shariaOnly, initialTotalValue]);

  if (!open) return null;

  const handleSolve = () => construct(buildRequest());

  // The strip stays one tab stop; arrows move selection and focus together (automatic activation).
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % TABS.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + TABS.length) % TABS.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = TABS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = TABS[nextIndex];
    setActiveTab(next.id);
    document.getElementById(tabDomId(next.id))?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-construction-title"
        className="relative w-full max-w-5xl rounded-card border border-line bg-surface p-6 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                {strings['portfolio.construction.engineTitle']}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                <Scale className="size-3" />
                {strings['portfolio.construction.solverBadge']}
              </span>
            </div>
            <h2 id="portfolio-construction-title" className="font-display text-xl font-bold text-ink mt-1">
              {strings['portfolio.construction.title'].replace('{clientName}', clientName)}
            </h2>
            <p className="mt-1 text-xs text-subtle">
              {strings['portfolio.construction.subtitle']}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-subtle hover:text-ink hover:bg-surface-subtle transition cursor-pointer"
            aria-label={strings['portfolio.construction.closeAria']}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Controls Bar: Risk Tier, Jurisdiction, Sharia Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-field border border-line bg-surface-subtle/70">
          <div>
            <label htmlFor="pc-construction-risk-tier" className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              {strings['portfolio.construction.riskTierLabel']}
            </label>
            <select
              id="pc-construction-risk-tier"
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value as RiskTierEnum)}
              className="w-full text-xs rounded border border-line bg-surface px-2.5 py-1.5 font-medium text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="conservative">{strings['portfolio.construction.riskTier.conservative']}</option>
              <option value="moderate">{strings['portfolio.construction.riskTier.moderate']}</option>
              <option value="aggressive">{strings['portfolio.construction.riskTier.aggressive']}</option>
              <option value="very_aggressive">{strings['portfolio.construction.riskTier.veryAggressive']}</option>
            </select>
          </div>

          <div>
            <label htmlFor="pc-construction-jurisdiction" className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              {strings['portfolio.construction.jurisdictionLabel']}
            </label>
            <select
              id="pc-construction-jurisdiction"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value as JurisdictionEnum)}
              className="w-full text-xs rounded border border-line bg-surface px-2.5 py-1.5 font-medium text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="GLOBAL">{strings['portfolio.construction.jurisdiction.global']}</option>
              <option value="INDIA">{strings['portfolio.construction.jurisdiction.india']}</option>
              <option value="UAE">{strings['portfolio.construction.jurisdiction.uae']}</option>
            </select>
          </div>

          <div>
            {/* Caption, not a label: a <label for> here would replace the toggle's own state-bearing name. */}
            <span className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              {strings['portfolio.construction.shariaLabel']}
            </span>
            <button
              type="button"
              onClick={() => setShariaOnly(!shariaOnly)}
              className={`w-full text-xs rounded border px-2.5 py-1.5 font-medium transition flex items-center justify-center gap-1.5 ${
                shariaOnly
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-line bg-surface text-subtle hover:text-ink'
              }`}
            >
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {shariaOnly ? strings['portfolio.construction.sharia.on'] : strings['portfolio.construction.sharia.off']}
            </button>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSolve}
              disabled={isPending}
              className="w-full py-1.5 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? strings['portfolio.construction.solving'] : strings['portfolio.construction.resolve']}
            </Button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        {result && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summaryMetrics(result, strings).map(({ label, value, note, tone }) => (
              <MetricCard key={label} label={label} value={value} note={note} tone={tone} />
            ))}
          </div>
        )}

        <div
          role="tablist"
          aria-label={strings['portfolio.construction.tablistLabel']}
          className="flex border-b border-line text-xs font-medium gap-1"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map(({ id, label }) => (
            <TabButton
              key={id}
              id={id}
              label={id === 'allocation' ? `${label} (${result?.holdings.length ?? 0} Holdings)` : label}
              active={activeTab === id}
              onSelect={() => setActiveTab(id)}
            />
          ))}
        </div>

        {activeTab === 'allocation' && result && (
          <div role="tabpanel" id={panelDomId('allocation')} aria-labelledby={tabDomId('allocation')} tabIndex={0}>
            <AllocationTab result={result} defaultCurrency={defaultCurrency} />
          </div>
        )}

        {activeTab === 'rationale' && result && (
          <div role="tabpanel" id={panelDomId('rationale')} aria-labelledby={tabDomId('rationale')} tabIndex={0}>
            <RationaleTab result={result} />
          </div>
        )}

        {activeTab === 'stress' && result && (
          <div role="tabpanel" id={panelDomId('stress')} aria-labelledby={tabDomId('stress')} tabIndex={0}>
            <StressTab result={result} rateShiftBps={whatIfRateShiftBps} onRateShiftChange={setWhatIfRateShiftBps} />
          </div>
        )}

        {activeTab === 'compliance' && result && (
          <div role="tabpanel" id={panelDomId('compliance')} aria-labelledby={tabDomId('compliance')} tabIndex={0}>
            <ComplianceTab result={result} riskTier={riskTier} shariaOnly={shariaOnly} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-subtle">
            {strings['portfolio.construction.footer.tagline']}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs">
              {strings['portfolio.construction.footer.close']}
            </Button>
            <a
              href="/advisory"
              className="rounded-field bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:text-brand-950 flex items-center gap-1"
            >
              {strings['portfolio.construction.footer.consult']}
              <ChevronRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
