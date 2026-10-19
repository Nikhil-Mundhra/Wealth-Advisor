import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sliders,
  TrendingUp,
  X,
} from 'lucide-react';
import type { ConstructPortfolioResponse, JurisdictionEnum, RiskTierEnum } from '@wealth-advisor/contracts';
import { Button } from '../../../components/ui/button.tsx';
import { formatMoney } from '../../../lib/format-money.ts';
import { useConstructPortfolio } from '../api/use-construct-portfolio.ts';

interface PortfolioConstructionModalProps {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  defaultCurrency?: string;
  defaultRiskScore?: number;
  initialTotalValue?: number;
}

export function PortfolioConstructionModal({
  open,
  onClose,
  clientName = 'Elena Vance',
  defaultCurrency = 'EUR',
  defaultRiskScore = 6.8,
  initialTotalValue = 95000,
}: PortfolioConstructionModalProps) {
  const [riskTier, setRiskTier] = useState<RiskTierEnum>('moderate');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionEnum>('GLOBAL');
  const [shariaOnly, setShariaOnly] = useState(false);
  const [whatIfRateShiftBps, setWhatIfRateShiftBps] = useState(0); // -200 to +200 bps
  const [activeTab, setActiveTab] = useState<'allocation' | 'rationale' | 'stress' | 'compliance'>('allocation');

  const { mutate: construct, data: result, isPending } = useConstructPortfolio();

  // Run on modal open
  useEffect(() => {
    if (open) {
      construct({
        riskTier,
        jurisdiction,
        shariaOnly,
        targetTotalValueBase: initialTotalValue * 100, // minor units
      });
    }
  }, [open, riskTier, jurisdiction, shariaOnly, initialTotalValue]);

  if (!open) return null;

  const handleSolve = () => {
    construct({
      riskTier,
      jurisdiction,
      shariaOnly,
      targetTotalValueBase: initialTotalValue * 100,
    });
  };

  // What-if simulated yield impact on portfolio
  const duration = result?.durationWeightedExposure ?? 4.2;
  const yieldShiftDecimal = whatIfRateShiftBps / 10000;
  const whatIfBondValueShiftPct = -(duration * yieldShiftDecimal) * 100;

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
            <label className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Client Risk Tier
            </label>
            <select
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
            <label className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Market Jurisdiction
            </label>
            <select
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
            <label className="block text-[11px] font-semibold text-subtle uppercase mb-1">
              Sharia Compliance Filter
            </label>
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
            <div className="rounded-field border border-line bg-surface p-3">
              <span className="text-[11px] font-medium text-subtle block">Expected Annual Return</span>
              <span className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                +{result.portfolioExpectedReturn}%
              </span>
              <span className="text-[10px] text-subtle block mt-0.5">Asset-weighted prior</span>
            </div>

            <div className="rounded-field border border-line bg-surface p-3">
              <span className="text-[11px] font-medium text-subtle block">Portfolio Volatility</span>
              <span className="font-display text-lg font-bold text-ink">
                {result.portfolioVolatility}%
              </span>
              <span className="text-[10px] text-subtle block mt-0.5">Cross-asset dampened</span>
            </div>

            <div className="rounded-field border border-line bg-surface p-3">
              <span className="text-[11px] font-medium text-subtle block">Sharpe Ratio</span>
              <span className="font-display text-lg font-bold text-brand-700 dark:text-brand-400">
                {result.portfolioSharpeRatio}
              </span>
              <span className="text-[10px] text-subtle block mt-0.5">Excess return / risk</span>
            </div>

            <div className="rounded-field border border-line bg-surface p-3">
              <span className="text-[11px] font-medium text-subtle block">Duration Exposure</span>
              <span className="font-display text-lg font-bold text-ink">
                {result.durationWeightedExposure} yrs
              </span>
              <span className="text-[10px] text-subtle block mt-0.5">Modified duration</span>
            </div>

            <div className="rounded-field border border-line bg-surface p-3">
              <span className="text-[11px] font-medium text-subtle block">1Y 95% Value at Risk</span>
              <span className="font-display text-lg font-bold text-danger">
                -{result.monteCarlo.valueAtRisk95}%
              </span>
              <span className="text-[10px] text-subtle block mt-0.5">Monte Carlo 5th percentile</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line text-xs font-medium gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('allocation')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'allocation'
                ? 'border-brand-600 text-brand-700 dark:text-brand-300 font-semibold'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            Optimal Allocation ({result?.holdings.length ?? 0} Holdings)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rationale')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'rationale'
                ? 'border-brand-600 text-brand-700 dark:text-brand-300 font-semibold'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            Fiduciary Rationale (6 Pillars)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'stress'
                ? 'border-brand-600 text-brand-700 dark:text-brand-300 font-semibold'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            Stress Tests & What-If Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-brand-600 text-brand-700 dark:text-brand-300 font-semibold'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            Regulatory Compliance Checklist
          </button>
        </div>

        {/* TAB 1: Optimal Multi-Asset Allocation Table */}
        {activeTab === 'allocation' && result && (
          <div className="overflow-x-auto rounded-field border border-line bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-subtle text-subtle">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Security & Ticker</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Asset Sleeve</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Target Weight</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Capital Allocation</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Exp. Return</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Volatility</th>
                  <th scope="col" className="px-3 py-2.5 text-center font-semibold">Scores (T / F / Q)</th>
                  <th scope="col" className="px-3 py-2.5 text-center font-semibold">Composite</th>
                  <th scope="col" className="px-3 py-2.5 text-center font-semibold">Sharia Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.holdings.map((h) => (
                  <tr key={h.symbol} className="hover:bg-surface-subtle/50 transition">
                    <td className="px-3 py-3 font-medium">
                      <span className="font-mono font-bold text-ink block">{h.symbol}</span>
                      <span className="text-[11px] text-subtle block">{h.name}</span>
                      <span className="text-[10px] text-muted block">{h.sector}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-control bg-surface-subtle border border-line px-2 py-0.5 text-[10px] font-medium text-ink">
                        {h.assetClass}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                      {(h.weight * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ink">
                      {formatMoney(Math.round(h.targetAmountBase / 100), defaultCurrency as any)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{(h.expectedReturn * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-subtle">
                      {(h.annualVolatility * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-[11px] text-subtle">
                      <span title="Technical Score">{h.technicalScore.toFixed(2)}</span> /{' '}
                      <span title="Fundamental Valuation Score">{h.fundamentalScore.toFixed(2)}</span> /{' '}
                      <span title="Quality & Liquidity Score">{h.qualityScore.toFixed(2)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-block rounded-full bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700 dark:text-brand-300">
                        {h.compositeScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {h.isShariaCompliant ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Sharia Certified
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">Conventional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Fiduciary Rationale Narrative */}
        {activeTab === 'rationale' && result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <FileText className="size-3.5" />
                Pillar 1: Personal Finance & Runway Buffer
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.personalFinance}</p>
            </div>

            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <FileText className="size-3.5" />
                Pillar 2: Cross-Border Remittance Protection
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.crossBorder}</p>
            </div>

            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <TrendingUp className="size-3.5" />
                Pillar 3: Wealth Allocation Strategy
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.wealthStrategy}</p>
            </div>

            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <Activity className="size-3.5" />
                Pillar 4: Technical Analysis Attribution
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.technicalAttribution}</p>
            </div>

            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <Scale className="size-3.5" />
                Pillar 5: Fundamental DCF Valuation Attribution
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.fundamentalAttribution}</p>
            </div>

            <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                <ShieldCheck className="size-3.5" />
                Pillar 6: Regulatory & Fiduciary Attribution
              </div>
              <p className="text-xs text-ink leading-relaxed">{result.rationale.regulatoryAttribution}</p>
            </div>

            {/* Source Attributions */}
            <div className="md:col-span-2 rounded-field border border-line bg-surface-subtle p-3 text-xs">
              <span className="font-semibold text-subtle block mb-1">Source Model Attribution:</span>
              <ul className="list-disc list-inside space-y-0.5 text-muted text-[11px]">
                {result.sourceAttribution.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: Stress Testing & What-If Calculator */}
        {activeTab === 'stress' && result && (
          <div className="flex flex-col gap-5">
            {/* Macroeconomic Stress Tests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-2">
                Macroeconomic Scenario Stress Tests
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.stressTestOutcomes.map((scenario) => (
                  <div
                    key={scenario.scenarioName}
                    className={`rounded-field border p-3 flex flex-col justify-between ${
                      scenario.portfolioValueChangePct < -10
                        ? 'border-danger/30 bg-danger/5'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">{scenario.scenarioName}</span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            scenario.portfolioValueChangePct >= 0
                              ? 'text-emerald-600'
                              : scenario.portfolioValueChangePct < -10
                                ? 'text-danger'
                                : 'text-gold'
                          }`}
                        >
                          {scenario.portfolioValueChangePct > 0 ? `+${scenario.portfolioValueChangePct}` : scenario.portfolioValueChangePct}%
                        </span>
                      </div>
                      <p className="text-[11px] text-subtle mt-1">{scenario.description}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
                      <span>Est. Drawdown: {scenario.estimatedDrawdownPct}%</span>
                      <span>Constraint: {scenario.violatesConstraint ? 'Exceeded Limit' : 'Within Tolerance'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monte Carlo Simulation Percentiles */}
            <div className="rounded-field border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
                  2,000-Path Monte Carlo Return Distribution (1-Year Horizon)
                </h3>
                <span className="text-[11px] font-mono text-muted">Bootstrapped Variance</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-subtle block">5th %ile (Worst)</span>
                  <span className="font-mono font-bold text-danger">{result.monteCarlo.percentiles.p5}%</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-subtle block">25th %ile</span>
                  <span className="font-mono font-bold text-gold">{result.monteCarlo.percentiles.p25}%</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-subtle block">50th %ile (Median)</span>
                  <span className="font-mono font-bold text-ink">+{result.monteCarlo.percentiles.p50}%</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-subtle block">75th %ile</span>
                  <span className="font-mono font-bold text-emerald-600">+{result.monteCarlo.percentiles.p75}%</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-subtle block">95th %ile (Best)</span>
                  <span className="font-mono font-bold text-emerald-600">+{result.monteCarlo.percentiles.p95}%</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-subtle pt-3 border-t border-line">
                <span>95% Conditional Value at Risk (CVaR / Expected Shortfall): <strong className="text-danger font-mono">{result.monteCarlo.cvar95}%</strong></span>
                <span>Max Simulated Drawdown: <strong className="text-danger font-mono">{result.monteCarlo.maxSimulatedDrawdown}%</strong></span>
              </div>
            </div>

            {/* Interactive What-If Calculator */}
            <div className="rounded-field border border-brand-500/20 bg-brand-500/5 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
                <Sliders className="size-4" />
                Interactive "What-If" Interest Rate Shift Simulator
              </div>
              <p className="text-xs text-subtle">
                Drag the policy rate slider to simulate immediate capital impact on the fixed income and sukuk sleeve based on {duration} years duration:
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono w-16 text-right">-200 bps</span>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="25"
                  value={whatIfRateShiftBps}
                  onChange={(e) => setWhatIfRateShiftBps(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-brand-600"
                />
                <span className="text-xs font-mono w-16">+200 bps</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-brand-500/10">
                <span>Applied Macro Shift: <strong className="font-mono text-ink">{whatIfRateShiftBps > 0 ? `+${whatIfRateShiftBps}` : whatIfRateShiftBps} bps</strong></span>
                <span>
                  Simulated Bond Sleeve Price Shift:{' '}
                  <strong className={`font-mono ${whatIfBondValueShiftPct >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
                    {whatIfBondValueShiftPct >= 0 ? `+${whatIfBondValueShiftPct.toFixed(2)}` : whatIfBondValueShiftPct.toFixed(2)}%
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Regulatory & Fiduciary Compliance Checklist */}
        {activeTab === 'compliance' && result && (
          <div className="rounded-field border border-line bg-surface p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-1">
              Fiduciary & Jurisdiction Rule Verification Matrix
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
                <CheckCircle2 className={`size-4 mt-0.5 ${result.complianceChecks.shariaPassed ? 'text-emerald-600' : 'text-danger'}`} />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">SCA / AAOIFI Sharia Compliance</span>
                  <span className="text-subtle">
                    {shariaOnly
                      ? 'Strict filter verified: All portfolio holdings are certified Sharia-compliant sukuk or non-financial equities with compliant debt ratios.'
                      : 'Dual-jurisdiction portfolio contains compliant sovereign sukuk alongside conventional diversification assets.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
                <CheckCircle2 className={`size-4 mt-0.5 ${result.complianceChecks.fundHouseCapPassed ? 'text-emerald-600' : 'text-danger'}`} />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Fund House Concentration Cap (≤ 15%)</span>
                  <span className="text-subtle">
                    No single asset management company or sponsor exceeds the 15% maximum portfolio concentration limit.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
                <CheckCircle2 className={`size-4 mt-0.5 ${result.complianceChecks.liquidityPassed ? 'text-emerald-600' : 'text-danger'}`} />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Minimum Liquidity Factor (≥ 0.70)</span>
                  <span className="text-subtle">
                    All allocated instruments possess verified daily trading volume meeting institutional liquidity criteria.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
                <CheckCircle2 className={`size-4 mt-0.5 ${result.complianceChecks.durationCapPassed ? 'text-emerald-600' : 'text-danger'}`} />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Duration Risk Ceiling ({riskTier.toUpperCase()})</span>
                  <span className="text-subtle">
                    Duration-weighted bond exposure ({result.durationWeightedExposure} yrs) sits within the risk tier fiduciary ceiling.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-surface-subtle">
                <CheckCircle2 className={`size-4 mt-0.5 ${result.complianceChecks.sectorCapsPassed ? 'text-emerald-600' : 'text-danger'}`} />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">Single Sector Exposure Limit (≤ 30%)</span>
                  <span className="text-subtle">
                    No single macroeconomic industry sector exceeds 30% of total equity and credit exposure.
                  </span>
                </div>
              </div>
            </div>
          </div>
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
