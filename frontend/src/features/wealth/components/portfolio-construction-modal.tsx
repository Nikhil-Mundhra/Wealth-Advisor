import { useEffect, useState } from 'react';
import { ChevronRight, RefreshCw, Scale, ShieldCheck, X } from 'lucide-react';
import type { ConstructPortfolioResponse, JurisdictionEnum, RiskTierEnum } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier } from '@wealth-advisor/rules';
import { Button } from '../../../components/ui/button.tsx';
import { useConstructPortfolio } from '../api/use-construct-portfolio.ts';
import { AllocationTab } from './construction/allocation-tab.tsx';
import { ComplianceTab } from './construction/compliance-tab.tsx';
import { RationaleTab } from './construction/rationale-tab.tsx';
import { StressTab } from './construction/stress-tab.tsx';

interface PortfolioConstructionModalProps {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  defaultCurrency?: string;
  defaultRiskScore?: number;
  initialTotalValue?: number;
}

const TABS = [
  { id: 'allocation', label: 'Optimal Allocation' },
  { id: 'rationale', label: 'Fiduciary Rationale (6 Pillars)' },
  { id: 'stress', label: 'Stress Tests & What-If Calculator' },
  { id: 'compliance', label: 'Regulatory Compliance Checklist' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function TabButton({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
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

function summaryMetrics(result: ConstructPortfolioResponse) {
  return [
    { label: 'Expected Annual Return', value: `+${result.portfolioExpectedReturn}%`, note: 'Asset-weighted prior', tone: 'positive' },
    { label: 'Portfolio Volatility', value: `${result.portfolioVolatility}%`, note: 'Cross-asset dampened', tone: 'neutral' },
    { label: 'Sharpe Ratio', value: `${result.portfolioSharpeRatio}`, note: 'Excess return / risk', tone: 'brand' },
    { label: 'Duration Exposure', value: `${result.durationWeightedExposure} yrs`, note: 'Modified duration', tone: 'neutral' },
    { label: '1Y 95% Value at Risk', value: `-${result.monteCarlo.valueAtRisk95}%`, note: 'Monte Carlo 5th percentile', tone: 'risk' },
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
                Quantitative Portfolio Construction Engine
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                <Scale className="size-3" />
                Multi-Asset Mean-Variance Solver
              </span>
            </div>
            <h2 id="portfolio-construction-title" className="font-display text-xl font-bold text-ink mt-1">
              Fiduciary Portfolio Construction: {clientName}
            </h2>
            <p className="mt-1 text-xs text-subtle">
              Integrates Technical Analysis, DCF Fundamental Valuation, Sukuk & Bond Duration/Convexity Models, and Mutual Fund Performance Screens.
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

        {/* Controls Bar: Risk Tier, Jurisdiction, Sharia Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-field border border-line bg-surface-subtle/70">
          <div>
            <label htmlFor="pc-construction-risk-tier" className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Client Risk Tier
            </label>
            <select
              id="pc-construction-risk-tier"
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value as RiskTierEnum)}
              className="w-full text-xs rounded border border-line bg-surface px-2.5 py-1.5 font-medium text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="conservative">Conservative (λ = 8.0, Max Dur 3.5y)</option>
              <option value="moderate">Moderate (λ = 4.5, Max Dur 5.5y)</option>
              <option value="aggressive">Aggressive (λ = 2.5, Max Dur 7.5y)</option>
              <option value="very_aggressive">Very Aggressive (λ = 1.2, Max Dur 10y)</option>
            </select>
          </div>

          <div>
            <label htmlFor="pc-construction-jurisdiction" className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Market Jurisdiction
            </label>
            <select
              id="pc-construction-jurisdiction"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value as JurisdictionEnum)}
              className="w-full text-xs rounded border border-line bg-surface px-2.5 py-1.5 font-medium text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="GLOBAL">Global & Cross-Border (US, EU, GCC, Asia)</option>
              <option value="INDIA">India (NSE, G-Secs, SEBI Funds)</option>
              <option value="UAE">UAE & GCC (DFM, Sovereign Sukuk, SCA)</option>
            </select>
          </div>

          <div>
            {/* Caption, not a label: a <label for> here would replace the toggle's own state-bearing name. */}
            <span className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Sharia Compliance Filter
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
              {shariaOnly ? 'SCA Sharia-Certified Only' : 'All Asset Types (Conventional & Sukuk)'}
            </button>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSolve}
              disabled={isPending}
              className="w-full py-1.5 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Solving Optimization...' : 'Re-Solve Optimal Portfolio'}
            </Button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        {result && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summaryMetrics(result).map(({ label, value, note, tone }) => (
              <MetricCard key={label} label={label} value={value} note={note} tone={tone} />
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line text-xs font-medium gap-1">
          {TABS.map(({ id, label }) => (
            <TabButton
              key={id}
              label={id === 'allocation' ? `${label} (${result?.holdings.length ?? 0} Holdings)` : label}
              active={activeTab === id}
              onSelect={() => setActiveTab(id)}
            />
          ))}
        </div>

        {activeTab === 'allocation' && result && (
          <AllocationTab result={result} defaultCurrency={defaultCurrency} />
        )}

        {activeTab === 'rationale' && result && <RationaleTab result={result} />}

        {activeTab === 'stress' && result && (
          <StressTab result={result} rateShiftBps={whatIfRateShiftBps} onRateShiftChange={setWhatIfRateShiftBps} />
        )}

        {activeTab === 'compliance' && result && (
          <ComplianceTab result={result} riskTier={riskTier} shariaOnly={shariaOnly} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-subtle">
            Syntropy AI Wealth Platform · Expanded Portfolio Construction Engine
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Close
            </Button>
            <a
              href="/advisory"
              className="rounded-field bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:text-brand-950 flex items-center gap-1"
            >
              Consult Copilot with Allocation
              <ChevronRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
