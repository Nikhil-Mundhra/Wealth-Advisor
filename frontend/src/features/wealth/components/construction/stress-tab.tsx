import type { ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { Sliders } from 'lucide-react';

function monteCarloPercentiles(result: ConstructPortfolioResponse) {
  const { percentiles } = result.monteCarlo;
  return [
    { label: '5th %ile (Worst)', value: `${percentiles.p5}%`, tone: 'text-danger' },
    { label: '25th %ile', value: `${percentiles.p25}%`, tone: 'text-gold' },
    { label: '50th %ile (Median)', value: `+${percentiles.p50}%`, tone: 'text-ink' },
    { label: '75th %ile', value: `+${percentiles.p75}%`, tone: 'text-emerald-600' },
    { label: '95th %ile (Best)', value: `+${percentiles.p95}%`, tone: 'text-emerald-600' },
  ] as const;
}

export function StressTab({
  result,
  rateShiftBps,
  onRateShiftChange,
}: {
  result: ConstructPortfolioResponse;
  rateShiftBps: number;
  onRateShiftChange: (bps: number) => void;
}) {
  // duration x yield shift, expressed as a percentage price move on the bond sleeve.
  const duration = result.durationWeightedExposure;
  const whatIfBondValueShiftPct = -(duration * (rateShiftBps / 10000)) * 100;

  return (
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
          {monteCarloPercentiles(result).map(({ label, value, tone }) => (
            <div key={label} className="p-2 rounded bg-surface-subtle">
              <span className="text-[10px] text-subtle block">{label}</span>
              <span className={`font-mono font-bold ${tone}`}>{value}</span>
            </div>
          ))}
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
            aria-label="Policy rate shift in basis points"
            min="-200"
            max="200"
            step="25"
            value={rateShiftBps}
            onChange={(e) => onRateShiftChange(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-brand-600"
          />
          <span className="text-xs font-mono w-16">+200 bps</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-brand-500/10">
          <span>Applied Macro Shift: <strong className="font-mono text-ink">{rateShiftBps > 0 ? `+${rateShiftBps}` : rateShiftBps} bps</strong></span>
          <span>
            Simulated Bond Sleeve Price Shift:{' '}
            <strong className={`font-mono ${whatIfBondValueShiftPct >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
              {whatIfBondValueShiftPct >= 0 ? `+${whatIfBondValueShiftPct.toFixed(2)}` : whatIfBondValueShiftPct.toFixed(2)}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
