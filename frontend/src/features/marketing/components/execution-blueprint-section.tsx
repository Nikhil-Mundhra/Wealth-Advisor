import { CheckCircle2, ChevronRight, Cpu, FileText, GitPullRequest, Layers, Network, TestTube } from 'lucide-react';

export function ExecutionBlueprintSection() {
  const phases = [
    {
      number: '01',
      title: 'Structured Intake & Diagnostic Engine',
      status: 'Live in Sandbox',
      description:
        'Structured 7-question client profiling wizard extracting the exact academic variables (corridors, liquid buffers, risk score), with vision statement parsing on the roadmap.',
      deliverables: ['7-Step Onboarding Questionnaire', 'Corridor & Runway Profiler', 'Document OCR (Roadmap)'],
    },
    {
      number: '02',
      title: 'The Deterministic Quant Core',
      status: 'Active Engine',
      description:
        'Deterministic financial modeling engine: life-cycle cashflow shock logic, automated ±5% drift boundary calculation, currency corridor valuation, and calculation shield.',
      deliverables: ['Consumption Smoothing', '±5% Drift Rebalancing Solvers', 'Deterministic Calculation Shield'],
    },
    {
      number: '03',
      title: 'Workflow & Ecosystem Integrations',
      status: 'Roadmap (Not Built)',
      description:
        'Future roadmap integrations: two-way sync with leading advisor CRMs (Wealthbox, Redtail) and Open Banking account aggregation (Plaid).',
      deliverables: ['Two-Way CRM Sync (Roadmap)', 'Pre/Post Meeting Automation', 'Plaid Gateway (Roadmap)'],
    },
    {
      number: '04',
      title: 'Automated Persona Benchmarking & Eval Suite',
      status: 'Research Benchmark',
      description:
        'Evaluation methodology testing synthetic investor personas mirroring MIT Sloan’s benchmark to verify zero demographic penalty.',
      deliverables: ['Synthetic Persona Testbed (22-89)', 'Income Shock Stress-Tests', 'Zero Demographic Bias Guarantee'],
    },
  ];

  return (
    <section id="blueprint" className="py-20 sm:py-28 bg-surface border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-600">
            <Layers className="size-3.5" />
            <span>Pillar 5 · Engineering Roadmap</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Execution Blueprint: <br />
            <span className="text-brand-700 dark:text-brand-600">From Architecture to Production Scale</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Building a defensible market-ready wealth platform demands rigorous phase-by-phase execution,
            anchored in deterministic quantitative code and institutional integration.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase) => (
            <div
              key={phase.number}
              className="relative flex flex-col justify-between rounded-card border border-line bg-surface p-6 shadow-xs transition hover:border-brand-600/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-bold text-brand-700/30 dark:text-brand-600/30">
                    {phase.number}
                  </span>
                  <span className="rounded-control bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-600">
                    {phase.status}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-bold text-ink">{phase.title}</h3>

                <p className="mt-2 text-xs leading-relaxed text-muted">{phase.description}</p>
              </div>

              <div className="mt-6 border-t border-line pt-4 space-y-1.5">
                {phase.deliverables.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-subtle">
                    <CheckCircle2 className="size-3.5 text-brand-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
