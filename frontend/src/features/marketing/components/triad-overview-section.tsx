import { ArrowRight, Bot, Cpu, Database, Network, ShieldAlert, Sparkles, Workflow } from 'lucide-react';

interface TriadOverviewSectionProps {
  onLearnMoreWorkflow?: () => void;
  onLearnMoreKnowledgeGraph?: () => void;
  onLearnMoreMITSloan?: () => void;
}

export function TriadOverviewSection({
  onLearnMoreWorkflow,
  onLearnMoreKnowledgeGraph,
  onLearnMoreMITSloan,
}: TriadOverviewSectionProps) {
  return (
    <section id="triad" className="py-20 sm:py-28 bg-surface-subtle/30 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
            The Three Foundational Pillars
          </span>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            The Triad Architecture Required to Win Market Execution
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Raw LLMs cannot execute institutional wealth management alone. Production-ready readiness
            demands three interdependent layers solving the workflow, knowledge, and mathematical rigor gaps.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {/* Triad 1: Advisor Lifecycle OS */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-8 shadow-sm transition hover:shadow-md hover:border-brand-600/40">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                <Workflow className="size-6" />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
                  Pillar 1 · Workflow Engine
                </span>
                <span className="rounded-control bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                  Execution Layer
                </span>
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                Advisor Workflow Operating System
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                Advisors reject standalone chatbots that require duplicate data entry. Institutional wealth management
                demands automating the entire advisory lifecycle: pre-meeting briefs, real-time transcription,
                multimodal document intake (1040s, statements), and automated two-way CRM syncs (Wealthbox, Redtail, eMoney).
              </p>

              <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-subtle">
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Pre-meeting briefing with holdings & drift alerts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Human-in-the-loop trade staging & follow-ups</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Eliminates 10+ hours/week of administrative friction</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLearnMoreWorkflow}
              className="mt-8 flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-600 dark:text-brand-600 cursor-pointer"
            >
              <span>Explore Advisor OS</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Triad 2: Unified Semantic Graph */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-8 shadow-sm transition hover:shadow-md hover:border-gold/50">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gold-subtle text-gold">
                <Network className="size-6" />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  Pillar 2 · Semantic Graph
                </span>
                <span className="rounded-control bg-gold-subtle px-2 py-0.5 text-[11px] font-medium text-gold">
                  Data Engine
                </span>
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                Unified Client Knowledge Graph
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                Hyper-personalization cannot rely on isolated prompt strings. Our enterprise data architecture
                unifies structured holdings, custodial feeds, tax records, and unstructured meeting transcripts
                into a live connected knowledge graph paired with Complex Event Processing (CEP).
              </p>

              <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-subtle">
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                  <span>Proactive Next-Best-Action triggers across accounts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                  <span>Life-event detection: marriage, career shifts, baby</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                  <span>Continuous cash drag & held-away asset harvesting</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLearnMoreKnowledgeGraph}
              className="mt-8 flex items-center gap-2 text-sm font-semibold text-gold transition hover:opacity-80 cursor-pointer"
            >
              <span>Explore Knowledge Graph</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Triad 3: MIT Sloan Research */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-8 shadow-sm transition hover:shadow-md hover:border-brand-600/40">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                <Cpu className="size-6" />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-600">
                  Pillar 3 · MIT Sloan Research
                </span>
                <span className="rounded-control bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 text-[11px] font-medium">
                  Rigor Gap Solved
                </span>
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                Solving the Bias & Shock Flaws
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                MIT Sloan proved that general LLMs exhibit 3 fatal flaws: panic over-cutting during income shocks,
                unmanaged portfolio drift, and a 4%–6% retirement wealth gap for non-academic prompts. Our
                neuro-symbolic engine separates natural language reasoning from deterministic quant math.
              </p>

              <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs text-subtle">
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Academic Prompt Middleware standardizes utility functions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Deterministic Monte Carlo consumption-smoothing solvers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                  <span>Enforces automated ±5% active drift rebalancing</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLearnMoreMITSloan}
              className="mt-8 flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-600 dark:text-brand-600 cursor-pointer"
            >
              <span>Explore MIT Sloan Benchmark</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
