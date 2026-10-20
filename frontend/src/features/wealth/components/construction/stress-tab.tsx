import type { ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { Sliders } from 'lucide-react';
import { useStrings } from '../../../../lib/dictionaries.ts';

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
  const strings = useStrings();

  // duration x yield shift, expressed as a percentage price move on the bond sleeve.
  const duration = result.durationWeightedExposure;
  const whatIfBondValueShiftPct = -(duration * (rateShiftBps / 10000)) * 100;

  return (
    <div className="flex flex-col gap-5">
      {/* Macroeconomic Stress Tests */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-2">
          {strings['portfolio.construction.stress.scenarioTitle']}
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
                <span>{strings['portfolio.construction.stress.drawdown']} {scenario.estimatedDrawdownPct}%</span>
                <span>{strings['portfolio.construction.stress.constraint']} {scenario.violatesConstraint ? strings['portfolio.construction.stress.exceeded'] : strings['portfolio.construction.stress.within']}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monte Carlo Simulation Percentiles */}
      <div className="rounded-field border border-line bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
            {strings['portfolio.construction.stress.monteCarloTitle']}
          </h3>
          <span className="text-[11px] font-mono text-muted">{strings['portfolio.construction.stress.bootstrappedVariance']}</span>
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
          <span>{strings['portfolio.construction.stress.cvar']} <strong className="text-danger font-mono">{result.monteCarlo.cvar95}%</strong></span>
          <span>{strings['portfolio.construction.stress.maxDrawdown']} <strong className="text-danger font-mono">{result.monteCarlo.maxSimulatedDrawdown}%</strong></span>
        </div>
      </div>

      {/* Interactive What-If Calculator */}
      <div className="rounded-field border border-brand-500/20 bg-brand-500/5 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
          <Sliders className="size-4" />
          {strings['portfolio.construction.stress.whatIfTitle']}
        </div>
        <p className="text-xs text-subtle">
          {strings['portfolio.construction.stress.whatIfBody'].replace('{duration}', duration.toFixed(1))}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono w-16 text-right">{strings['portfolio.construction.stress.minus200']}</span>
          <input
            type="range"
            aria-label={strings['portfolio.construction.stress.sliderAria']}
            min="-200"
            max="200"
            step="25"
            value={rateShiftBps}
            onChange={(e) => onRateShiftChange(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-brand-600"
          />
          <span className="text-xs font-mono w-16">{strings['portfolio.construction.stress.plus200']}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-brand-500/10">
          <span>{strings['portfolio.construction.stress.appliedShift']} <strong className="font-mono text-ink">{rateShiftBps > 0 ? `+${rateShiftBps}` : rateShiftBps} bps</strong></span>
          <span>
            {strings['portfolio.construction.stress.bondShift']}{' '}
            <strong className={`font-mono ${whatIfBondValueShiftPct >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
              {whatIfBondValueShiftPct >= 0 ? `+${whatIfBondValueShiftPct.toFixed(2)}` : whatIfBondValueShiftPct.toFixed(2)}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
