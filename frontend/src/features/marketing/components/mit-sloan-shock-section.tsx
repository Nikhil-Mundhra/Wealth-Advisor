import { AlertOctagon, ArrowUpRight, BarChart3, Calculator, Check, ShieldAlert, TrendingDown, Users, X } from 'lucide-react';
import marketShockImg from '../../../assets/market-shock.jpg';

export function MITSloanShockSection() {
  return (
    <section id="mit-sloan" className="py-20 sm:py-28 bg-surface-subtle/50 border-y border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-red-500/20 bg-red-50 dark:bg-red-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            <ShieldAlert className="size-3.5" />
            <span>MIT Sloan Research & The Quantitative Rigor Gap</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Why Raw LLMs Fail Financial Math: <br />
            <span className="text-red-600 dark:text-red-400">The 3 Fatal Flaws Exposed by MIT Sloan</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            A landmark MIT Sloan study revealed that while general LLMs provide coherent baseline advice,
            they catastrophicly fail at income shocks, allow portfolio drift, and penalize non-academic users
            with up to <strong className="text-ink font-semibold">$100,000 less retirement wealth</strong>.
            Here is how our neuro-symbolic engine fixes it.
          </p>
        </div>

        {/* 16:9 Image Showcase: Sitting over text as an editorial focal header */}
        <div className="mt-10 overflow-hidden rounded-card border border-line bg-surface shadow-xs">
          <img
            src={marketShockImg}
            alt="Late-night trading desk showing a plummeting stock chart, calculator, coffee, and financial statements during a market shock"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-subtle px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-control bg-danger" />
              <p className="text-xs text-ink">
                <span className="font-semibold">Stress Test: Market & Income Shock</span> · Lifecycle consumption smoothing vs. panic spend cut
              </p>
            </div>
            <span className="text-[11px] font-medium text-subtle">
              MIT Sloan Empirical Research Dataset
            </span>
          </div>
        </div>

        {/* Three Flaws & Quantitative Fixes: Clean 3-Column Responsive Grid Under The Image */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Flaw 1: Income Shocks */}
          <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-5 shadow-xs transition hover:border-brand-600/40">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-control bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-bold shrink-0">
                    1
                  </span>
                  <h3 className="text-base font-semibold text-ink">Income Shocks</h3>
                </div>
                <span className="rounded-control bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 shrink-0">
                  Raw LLM Failure
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                <strong className="text-ink">The Flaw:</strong> When simulated users lose employment, standard LLMs recommend slashing
                spending by 60%–80% immediately, ignoring existing 6–12 month liquid cash buffers.
              </p>
            </div>
            <div className="mt-4 rounded-control bg-brand-50/60 dark:bg-brand-950/60 p-3 text-xs text-brand-900 dark:text-brand-100 border border-brand-600/20">
              <strong className="text-brand-700 dark:text-brand-600">Syntropy AI Fix:</strong> Deterministic life-cycle
              consumption smoothing models. Calibrated liquidity drawdowns maintain baseline lifestyle while preserving compound equities.
            </div>
          </div>

          {/* Flaw 2: Portfolio Drift */}
          <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-5 shadow-xs transition hover:border-brand-600/40">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-control bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-bold shrink-0">
                    2
                  </span>
                  <h3 className="text-base font-semibold text-ink">Unmanaged Drift</h3>
                </div>
                <span className="rounded-control bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 shrink-0">
                  Raw LLM Failure
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                <strong className="text-ink">The Flaw:</strong> As markets rally or crash, standard LLMs praise gains without recognizing
                that asset allocations have dangerously skewed away from target risk parameters.
              </p>
            </div>
            <div className="mt-4 rounded-control bg-brand-50/60 dark:bg-brand-950/60 p-3 text-xs text-brand-900 dark:text-brand-100 border border-brand-600/20">
              <strong className="text-brand-700 dark:text-brand-600">Syntropy AI Fix:</strong> Automated ±5% boundary detection
              triggers deterministic rebalancing proposals, trimming bloated positions into fixed income or liquidity reserves.
            </div>
          </div>

          {/* Flaw 3: Demographic & Prompt Bias */}
          <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-5 shadow-xs transition hover:border-brand-600/40">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-control bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-bold shrink-0">
                    3
                  </span>
                  <h3 className="text-base font-semibold text-ink">Demographic Bias</h3>
                </div>
                <span className="rounded-control bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400 shrink-0">
                  Raw LLM Failure
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                <strong className="text-ink">The Flaw:</strong> Prompts phrased by female or less financially literate users trigger overly
                conservative rules-of-thumb, causing an estimated <strong className="text-red-600 dark:text-red-400">$50k–$100k wealth penalty</strong>.
              </p>
            </div>
            <div className="mt-4 rounded-control bg-brand-50/60 dark:bg-brand-950/60 p-3 text-xs text-brand-900 dark:text-brand-100 border border-brand-600/20">
              <strong className="text-brand-700 dark:text-brand-600">Syntropy AI Fix:</strong> Academic Prompt Middleware.
              Normalizes user inquiries into objective mathematical parameters with zero demographic bias.
            </div>
          </div>
        </div>

        {/* Quant Solver vs LLM Comparison Matrix */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="bg-surface-subtle px-6 py-4 border-b border-line">
            <h3 className="text-sm font-semibold text-ink">Architectural Comparison: Raw LLM vs. Syntropy AI Neuro-Symbolic</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-line bg-surface-subtle/50 text-subtle">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Financial Challenge</th>
                  <th className="py-3.5 px-6 font-semibold text-red-600 dark:text-red-400">Raw LLM Approach (MIT Study)</th>
                  <th className="py-3.5 px-6 font-semibold text-brand-700 dark:text-brand-600">Syntropy AI Neuro-Symbolic Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                <tr>
                  <td className="py-4 px-6 font-medium text-ink">Income Shock (Job Loss)</td>
                  <td className="py-4 px-6 text-red-700 dark:text-red-400">Drastic spending collapse; fails to use emergency reserves.</td>
                  <td className="py-4 px-6 text-brand-700 dark:text-brand-600 font-medium">Life-cycle consumption smoothing draws from liquid cash runway.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-ink">Portfolio Rebalancing</td>
                  <td className="py-4 px-6 text-red-700 dark:text-red-400">Passive drift; equity weights inflate unchecked.</td>
                  <td className="py-4 px-6 text-brand-700 dark:text-brand-600 font-medium">Deterministic triggers execute at ±5% drift boundaries.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-ink">Non-Academic User Query</td>
                  <td className="py-4 px-6 text-red-700 dark:text-red-400">Generic rule of thumb, conservative bias, $50k-$100k wealth penalty.</td>
                  <td className="py-4 px-6 text-brand-700 dark:text-brand-600 font-medium">Intent enrichment translates prompt into academic utility curve.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-ink">Mathematical Accuracy</td>
                  <td className="py-4 px-6 text-red-700 dark:text-red-400">Stochastic text token guessing; frequent compounding math errors.</td>
                  <td className="py-4 px-6 text-brand-700 dark:text-brand-600 font-medium">Deterministic Python/quant solvers via MCP tool calling.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
