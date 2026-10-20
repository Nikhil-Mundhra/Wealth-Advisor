import { lazy, Suspense, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { DocumentationSection, type DocSubtab } from '../../features/marketing/components/documentation-section.tsx';
import { HomepageFooter } from '../../features/marketing/components/homepage-footer.tsx';
import { HomepageHero } from '../../features/marketing/components/homepage-hero.tsx';
import { HomepageNav } from '../../features/marketing/components/homepage-nav.tsx';
import { NeuroSymbolicSimulator } from '../../features/marketing/components/neuro-symbolic-simulator.tsx';
import { TriadOverviewSection } from '../../features/marketing/components/triad-overview-section.tsx';

const ParticlesBackground = lazy(() =>
  import('../../features/marketing/components/particles-background.tsx').then((m) => ({
    default: m.ParticlesBackground,
  }))
);

export function HomePage() {
  const [activeDocSubtab, setActiveDocSubtab] = useState<DocSubtab>('lifecycle');

  const handleNavigate = (id: string, subtab?: string) => {
    const docSubtabs: DocSubtab[] = ['lifecycle', 'mit-sloan', 'knowledge-graph', 'positioning', 'compliance', 'blueprint'];
    let targetId = id;
    let targetSubtab = subtab;

    if (docSubtabs.includes(id as DocSubtab)) {
      targetId = 'documentation';
      targetSubtab = id as DocSubtab;
    }

    if (targetSubtab) {
      setActiveDocSubtab(targetSubtab as DocSubtab);
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView?.({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-dvh bg-surface text-ink antialiased selection:bg-brand-600 selection:text-white">
      {/* Streamlined Sticky Header Navigation with Documentation tab */}
      <HomepageNav onNavigateSection={handleNavigate} />

      {/* Main Page Flow */}
      <main className="relative">
        {/* Lazy-loaded browser-side compute particle network */}
        <Suspense fallback={null}>
          <ParticlesBackground />
        </Suspense>

        {/* Hero Section */}
        <HomepageHero onScrollTo={handleNavigate} />

        {/* The 3 Core Pillars */}
        <TriadOverviewSection
          onLearnMoreWorkflow={() => handleNavigate('documentation', 'lifecycle')}
          onLearnMoreKnowledgeGraph={() => handleNavigate('documentation', 'knowledge-graph')}
          onLearnMoreMITSloan={() => handleNavigate('documentation', 'mit-sloan')}
        />

        {/* Interactive Neuro-Symbolic Simulator Playground */}
        <NeuroSymbolicSimulator />

        {/* Dedicated Documentation Hub with Interactive Subtabs */}
        <DocumentationSection
          activeSubtab={activeDocSubtab}
          onSubtabChange={setActiveDocSubtab}
        />

        {/* Institutional Call to Action */}
        <section className="border-t border-line bg-surface-subtle py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1 text-xs font-medium text-ink">
              <span>Advisor Sandbox & Execution Prototype</span>
            </span>

            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Bridge the gap to institutional execution.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Explore the live sandbox dashboard, test currency corridor rebalances, and experience
              fiduciary-grade AI automation with zero demographic penalty.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-field bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-950"
              >
                <span>Launch Interactive Sandbox</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-field border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span>Sign In to Platform</span>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-subtle">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-brand-600" />
                Cryptographic SHA-256 Ledger
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-brand-600" />
                Zero Client Data Training
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-brand-600" />
                Deterministic Calculation Shield
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <HomepageFooter />
    </div>
  );
}
