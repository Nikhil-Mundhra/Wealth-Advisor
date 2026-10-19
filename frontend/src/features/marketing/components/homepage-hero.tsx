import { ArrowRight, CheckCircle2, ChevronRight, Cpu, Layers, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

interface HomepageHeroProps {
  onScrollTo: (id: string) => void;
}

export function HomepageHero({ onScrollTo }: HomepageHeroProps) {
  return (
    <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-control border border-line bg-surface-subtle px-3 py-1 text-xs font-medium text-ink">
            <span>AI Wealth Architecture</span>
            <span className="text-subtle">·</span>
            <span className="text-subtle">Advisor OS · Knowledge Graph · MIT Sloan Rigor</span>
          </div>

          {/* Main Title */}
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl sm:leading-[1.15] lg:text-7xl">
            Bridging the gap between raw LLMs and institutional financial execution.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Advisors don’t need another standalone chatbot. Syntropy AI fuses an automated client lifecycle
            operating system, a semantic knowledge graph, and deterministic quantitative solvers
            engineered to eliminate the MIT Sloan income shock and demographic bias gap.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-field bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-950"
            >
              <span>Launch Advisor Sandbox</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => onScrollTo('simulator')}
              className="inline-flex items-center gap-2 rounded-field border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 cursor-pointer"
            >
              <Cpu className="size-4 text-brand-600" aria-hidden="true" />
              <span>Test Neuro-Symbolic Engine</span>
            </button>

            <button
              type="button"
              onClick={() => onScrollTo('mit-sloan')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-subtle transition hover:text-ink cursor-pointer"
            >
              <span>Read Research Gap</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Live Architecture Flow Banner */}
        <div className="mt-14 sm:mt-16">
          <div className="mx-auto max-w-5xl rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-control bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Neuro-Symbolic Advisory Pipeline</h2>
                  <p className="text-xs text-subtle">Natural language intake → Academic prompt middleware → Deterministic quant core</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-ink">
                  <ShieldCheck className="size-3.5 text-brand-600" />
                  SHA-256 Ledger
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-ink">
                  <Lock className="size-3.5 text-gold" />
                  Zero Model Training
                </span>
              </div>
            </div>

            {/* 3-Step Pipeline Card Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-control border border-line bg-surface-subtle p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
                  Layer 1 · Advisor OS
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">Workflow & Intake</h3>
                <p className="mt-1 text-xs text-subtle">
                  Pre-meeting briefings, 1040 statement parsing, and two-way CRM sync with human-in-the-loop signoff.
                </p>
                <div className="mt-3 text-xs font-medium text-muted">
                  Saves 10+ hrs/wk per advisor
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-control border border-line bg-surface-subtle p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                  Layer 2 · Knowledge Graph
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">Client Knowledge Graph</h3>
                <p className="mt-1 text-xs text-subtle">
                  Unifies holdings, private market feeds, and life-event signals into a continuous semantic graph.
                </p>
                <div className="mt-3 text-xs font-medium text-muted">
                  Proactive next-best-actions (CEP)
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-control border border-line bg-surface-subtle p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
                  Layer 3 · MIT Sloan Rigor
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">Deterministic Quant Core</h3>
                <p className="mt-1 text-xs text-subtle">
                  Consumption smoothing for income shocks, glide paths, and automated ±5% drift rebalancing.
                </p>
                <div className="mt-3 text-xs font-medium text-muted">
                  Erases 4%–6% demographic bias gap
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Trust & Institutional Metrics Strip */}
        <div className="mt-14 border-y border-line py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div className="p-2">
              <p className="font-display text-3xl font-bold tracking-tight text-ink tabular-nums sm:text-4xl">10+ hrs</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-subtle">Saved / Advisor / Wk</p>
              <p className="mt-0.5 text-xs text-muted">Automated meeting lifecycle sync</p>
            </div>
            <div className="p-2">
              <p className="font-display text-3xl font-bold tracking-tight text-brand-700 dark:text-brand-600 tabular-nums sm:text-4xl">0%</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-subtle">Demographic Bias</p>
              <p className="mt-0.5 text-xs text-muted">Standardized utility & academic prompts</p>
            </div>
            <div className="p-2">
              <p className="font-display text-3xl font-bold tracking-tight text-ink tabular-nums sm:text-4xl">±5%</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-subtle">Drift Boundary</p>
              <p className="mt-0.5 text-xs text-muted">Automated rebalancing triggers</p>
            </div>
            <div className="p-2">
              <p className="font-display text-3xl font-bold tracking-tight text-ink tabular-nums sm:text-4xl">100%</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-subtle">Audit Trail Verified</p>
              <p className="mt-0.5 text-xs text-muted">Zero LLM training on client PII</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
