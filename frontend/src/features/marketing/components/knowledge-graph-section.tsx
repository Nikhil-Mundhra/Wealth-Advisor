import { Activity, BellRing, Database, FileSpreadsheet, GitBranch, HeartHandshake, Layers, Network, Sparkles, TrendingUp, Zap } from 'lucide-react';

export function KnowledgeGraphSection() {
  return (
    <section id="knowledge-graph" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Narrative */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-control border border-gold/30 bg-gold-subtle px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <Network className="size-3.5" />
              <span>Semantic Data Architecture</span>
            </div>

            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Hyper-Personalization Powered by a <br />
              <span className="text-gold">Unified Client Knowledge Graph</span>
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Stateless chatbots lose context between sessions and hallucinate client relationships. Our
              enterprise data architecture unifies structured custodial data and unstructured
              life-event signals into a connected graph database and vector store.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-4 rounded-xl border border-line bg-surface-subtle p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-subtle text-gold">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Structured & Unstructured Fusion</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Merges live account balances (Plaid/Yodlee — Roadmap), 1040 tax returns, and estate docs with unstructured
                    meeting transcripts and email communications into a single ontological view.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-line bg-surface-subtle p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-subtle text-gold">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Complex Event Processing (CEP)</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Background event listeners detect critical life signals—such as marriage, newborn dependents,
                    real estate acquisitions, or salary shifts—automatically triggering portfolio and insurance reviews.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-line bg-surface-subtle p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-subtle text-gold">
                  <BellRing className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Proactive Next-Best-Action Signals</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Continuously scans client bases to flag excessive cash drag in low-yield checking, harvest tax-loss
                    windows, and identify held-away assets before attrition occurs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Graph Architecture Representation */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-line bg-surface-subtle/70 p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="size-5 text-gold" />
                  <span className="text-sm font-semibold text-ink">Live Client Knowledge Graph</span>
                </div>
                <span className="rounded-control bg-surface-subtle border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink">
                  Continuous Sync Active
                </span>
              </div>

              {/* Central Graph Visual Diagram */}
              <div className="mt-6 space-y-4">
                {/* Node 1: Client Entity */}
                <div className="mx-auto max-w-sm rounded-xl border border-gold/40 bg-surface p-3 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Central Node</span>
                  <p className="text-sm font-bold text-ink">Client Entity: Elena Vance (Expat Family)</p>
                  <p className="text-[11px] text-subtle">Household Mode: Family · Risk Score: 6.8 / 10</p>
                </div>

                {/* Connecting Edges */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-subtle">
                  <div className="flex flex-col items-center">
                    <span className="h-4 w-px bg-line" />
                    <span>Holdings Feed</span>
                    <span className="h-4 w-px bg-line" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="h-4 w-px bg-gold" />
                    <span className="text-gold font-semibold">Life Event CEP</span>
                    <span className="h-4 w-px bg-gold" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="h-4 w-px bg-line" />
                    <span>Market Stack</span>
                    <span className="h-4 w-px bg-line" />
                  </div>
                </div>

                {/* Sub-Nodes Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-line bg-surface p-3 text-center">
                    <p className="text-xs font-semibold text-ink">€95,000 Portfolio</p>
                    <p className="mt-1 text-[10px] text-subtle">4 Currencies (EUR/USD/SGD/GBP)</p>
                  </div>

                  <div className="rounded-lg border border-gold/50 bg-gold-subtle/40 p-3 text-center ring-1 ring-gold/30">
                    <p className="text-xs font-semibold text-gold">Child Born in Q2</p>
                    <p className="mt-1 text-[10px] text-muted">Education Goal + €15k Cover Triggered</p>
                  </div>

                  <div className="rounded-lg border border-line bg-surface p-3 text-center">
                    <p className="text-xs font-semibold text-ink">ECB & FX Rates</p>
                    <p className="mt-1 text-[10px] text-subtle">Real-Time Corridor Volatility</p>
                  </div>
                </div>

                {/* Next Best Action Notification Banner */}
                <div className="mt-4 rounded-xl border border-brand-600/30 bg-brand-50/70 dark:bg-brand-950/70 p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="size-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-900 dark:text-brand-100">
                        Proactive Next-Best-Action Signal Generated:
                      </p>
                      <p className="mt-1 text-xs text-brand-800 dark:text-brand-200 leading-relaxed">
                        Excess liquid cash drag detected: €12,400 in 0.05% checking. Propose transferring to 3.8% Money Market
                        while locking FX hedge for Asian education remittance corridor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
