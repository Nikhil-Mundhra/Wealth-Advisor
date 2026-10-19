import { useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, Bot, CheckCircle2, ChevronRight, Cpu, HelpCircle, Layers, RefreshCcw, ShieldCheck, Sparkles, TrendingUp, XCircle } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  category: string;
  userPrompt: string;
  rawLLM: {
    title: string;
    description: string;
    flaw: string;
    metric: string;
  };
  neuroSymbolic: {
    title: string;
    description: string;
    middleware: string;
    quantSolver: string;
    metric: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'income-shock',
    title: 'Scenario 1: Sudden Income Shock',
    category: 'Consumption Smoothing',
    userPrompt: '"I unexpectedly lost my job this morning. How much should I cut my monthly spending?"',
    rawLLM: {
      title: 'Catastrophic Spending Cut (Panic Heuristic)',
      description:
        'Slashing spending by 70% immediately, cancelling all recurring commitments, and recommending liquidating stock holdings to prevent further market risk.',
      flaw: 'Completely ignores client’s existing 6-month liquid buffer. Induces unnecessary panic and forfeits equity recovery.',
      metric: '−70% lifestyle drop · 0% buffer utilization',
    },
    neuroSymbolic: {
      title: 'Deterministic Consumption Smoothing (Life-Cycle Model)',
      description:
        'Identifies €24,000 liquid cash reserves (7.5 months runway). Recommends drawing down €2,800/month from money market buffers while keeping equity allocation untouched.',
      middleware: 'Injected liquid reserves, burn rate & employment duration priors.',
      quantSolver: 'Life-cycle consumption Euler equation solver.',
      metric: '0% equity liquidation · Preserves compounding',
    },
  },
  {
    id: 'demographic-bias',
    title: 'Scenario 2: Vague Query & Demographic Bias',
    category: 'MIT Literacy Gap',
    userPrompt: '"Hi, I have about $150 to invest each month. What should I put it in?"',
    rawLLM: {
      title: 'Overly Conservative Stereotyped Allocation',
      description:
        'Recommends putting 40% into high-yield savings, 30% into short-term bonds, and 30% into low-volatility mutual funds due to conversational phrasing.',
      flaw: 'MIT Sloan Benchmark: Less structured, non-academic prompts trigger demographic bias, producing 4%–6% less wealth at retirement ($50k–$100k loss).',
      metric: '−$78,000 projected terminal retirement wealth',
    },
    neuroSymbolic: {
      title: 'Standardized Objective Utility Optimization',
      description:
        'Middleware intercepts query, removes non-financial demographic cues, and pulls user’s 32-year investment horizon: allocates 90% Global Low-Cost Equity Index.',
      middleware: 'Translated vague text into an "Academic-Grade Prompt" with CRRA utility function.',
      quantSolver: 'Mean-Variance & Glide-Path deterministic optimizer.',
      metric: '+$84,200 additional wealth · 0% demographic penalty',
    },
  },
  {
    id: 'portfolio-drift',
    title: 'Scenario 3: Market Rally & Portfolio Drift',
    category: 'Active Rebalancing',
    userPrompt: '"My US Tech stock portfolio gained 30% this year. Should I change anything?"',
    rawLLM: {
      title: 'Passive Drift Congratulation',
      description:
        '"Congratulations on your gains! Tech momentum is very strong right now, so holding your winners is a great way to let your capital grow."',
      flaw: 'Allows portfolio equity weight to drift unchecked from 50% target to 68%, dangerously exposing client to severe correction risk.',
      metric: 'Unchecked +18% drift above risk tolerance',
    },
    neuroSymbolic: {
      title: 'Automated ±5% Boundary Rebalancing Trigger',
      description:
        'Detects US Equities have exceeded the 50% target by +18%. Solves trade batch to trim 18% into Money Market and Fixed Income, staging custodial rebalance tickets.',
      middleware: 'Pulls current vs target weights from Client Knowledge Graph.',
      quantSolver: 'Deterministic cashflow & tax-aware rebalancing engine.',
      metric: 'Locks in gains · Restores risk boundary to 0% drift',
    },
  },
];

export function NeuroSymbolicSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);

  return (
    <section id="simulator" className="py-20 sm:py-28 bg-surface-subtle/40 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-control border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-600">
            <Cpu className="size-3.5" />
            <span>Illustrative Benchmark Simulator</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            See the Neuro-Symbolic Difference in Action
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Compare side-by-side how a standalone foundation LLM responds to high-stakes wealth events versus
            our hybrid architecture pairing Academic Prompt Middleware with deterministic quant solvers from the rules kernel.
          </p>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {SCENARIOS.map((scenario) => {
            const isSelected = selectedScenario.id === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedScenario(scenario)}
                className={`flex items-center gap-2 rounded-control px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs dark:text-brand-950'
                    : 'bg-surface border border-line text-muted hover:text-ink hover:bg-surface-subtle'
                }`}
              >
                <span>{scenario.title}</span>
                <span className={`text-[10px] rounded-control px-1.5 py-0.5 ${isSelected ? 'bg-white/20' : 'bg-surface-subtle text-subtle'}`}>
                  {scenario.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* User Prompt Banner */}
        <div className="mt-8 mx-auto max-w-3xl rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Simulated User Input</p>
          <p className="mt-1 font-display text-base sm:text-lg font-medium text-ink italic">
            {selectedScenario.userPrompt}
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: Raw LLM */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-control bg-red-100 dark:bg-red-950 text-danger">
                  <XCircle className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Raw Foundation LLM</h3>
                  <p className="text-xs text-subtle">Isolated text generation without quant solvers</p>
                </div>
              </div>
              <span className="rounded-control bg-red-50 dark:bg-red-950/60 border border-red-200/50 px-2 py-0.5 text-xs font-medium text-danger">
                Flawed Output
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-subtle uppercase tracking-wider">Generated Response</p>
                <p className="mt-1 text-sm font-semibold text-danger">
                  {selectedScenario.rawLLM.title}
                </p>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">
                  {selectedScenario.rawLLM.description}
                </p>
              </div>

              <div className="rounded-control bg-surface-subtle p-3 border border-line">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-ink">Identified MIT Sloan Flaw</p>
                    <p className="mt-0.5 text-xs text-muted leading-tight">
                      {selectedScenario.rawLLM.flaw}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-control bg-surface-subtle p-3 text-xs flex items-center justify-between border border-line">
                <span className="text-subtle">Financial Impact:</span>
                <span className="font-semibold text-danger tabular-nums">{selectedScenario.rawLLM.metric}</span>
              </div>
            </div>
          </div>

          {/* Right: Syntropy AI Neuro-Symbolic */}
          <div className="rounded-card border border-brand-600/40 bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-control bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Syntropy AI Hybrid Engine</h3>
                  <p className="text-xs text-subtle">Academic middleware + Deterministic quant core</p>
                </div>
              </div>
              <span className="rounded-control bg-brand-50 dark:bg-brand-950 border border-brand-600/20 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-600">
                Institutional Grade
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-subtle uppercase tracking-wider">Engine Output</p>
                <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-600">
                  {selectedScenario.neuroSymbolic.title}
                </p>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">
                  {selectedScenario.neuroSymbolic.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-control bg-surface-subtle p-2.5 border border-line">
                  <p className="font-semibold text-ink">Academic Middleware:</p>
                  <p className="mt-0.5 text-xs text-muted">{selectedScenario.neuroSymbolic.middleware}</p>
                </div>
                <div className="rounded-control bg-surface-subtle p-2.5 border border-line">
                  <p className="font-semibold text-ink">Quant Solver Executed:</p>
                  <p className="mt-0.5 text-xs text-muted">{selectedScenario.neuroSymbolic.quantSolver}</p>
                </div>
              </div>

              <div className="rounded-control bg-brand-50/70 dark:bg-brand-950/70 p-3 text-xs flex items-center justify-between border border-brand-600/20">
                <span className="text-ink font-medium">Outcome:</span>
                <span className="font-semibold text-brand-700 dark:text-brand-600 tabular-nums">{selectedScenario.neuroSymbolic.metric}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-subtle max-w-2xl mx-auto">
          Illustrative benchmark scenarios modeled after academic literature (MIT Sloan, FinRobot V2, and VERAFI SMT-lib formal verification). Live calculation shields and drift corridor constraints run deterministically via the <code className="font-mono text-ink">@wealth-advisor/rules</code> kernel in the Advisor Sandbox.
        </p>
      </div>
    </section>
  );
}
