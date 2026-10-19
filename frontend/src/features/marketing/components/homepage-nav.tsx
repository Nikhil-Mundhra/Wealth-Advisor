import { ArrowRight, BookOpen, ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import logoImg from '../../../assets/logo.png';
import logoDarkImg from '../../../assets/logo-dark.png';
import { ThemeToggle } from '../../../components/ui/theme-toggle.tsx';
import { LanguageSelect } from '../../../components/ui/language-select.tsx';
import { useSessionStatus } from '../../auth/session/use-session.ts';

interface HomepageNavProps {
  onNavigateSection?: (id: string, subtab?: string) => void;
}

export function HomepageNav({ onNavigateSection }: HomepageNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [docsDropdownOpen, setDocsDropdownOpen] = useState(false);
  const sessionStatus = useSessionStatus();
  const isAuthenticated = sessionStatus === 'authenticated';

  const navigateTo = (id: string, subtab?: string) => {
    setMobileMenuOpen(false);
    setDocsDropdownOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id, subtab);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link to="/home" className="flex items-center gap-3 text-ink">
          <div className="relative flex size-11 shrink-0 items-center justify-center">
            <img
              src={logoImg}
              alt="Syntropy AI Logo"
              className="size-11 object-contain dark:hidden"
            />
            <img
              src={logoDarkImg}
              alt="Syntropy AI Logo"
              className="hidden size-11 object-contain dark:block"
            />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ink">Syntropy AI</span>
        </Link>

        {/* Clean, Streamlined Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-7 text-sm font-medium md:flex">
          <button
            type="button"
            onClick={() => navigateTo('triad')}
            className="text-subtle transition-colors hover:text-ink cursor-pointer"
          >
            The Triad
          </button>

          <button
            type="button"
            onClick={() => navigateTo('simulator')}
            className="text-subtle transition-colors hover:text-ink cursor-pointer"
          >
            Interactive Engine
          </button>

          {/* Documentation Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDocsDropdownOpen((open) => !open)}
              aria-expanded={docsDropdownOpen}
              className="flex items-center gap-1.5 text-subtle transition-colors hover:text-ink cursor-pointer"
            >
              <BookOpen className="size-4" />
              <span>Documentation</span>
              <ChevronDown className={`size-3.5 transition-transform ${docsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {docsDropdownOpen && (
              <div
                onMouseLeave={() => setDocsDropdownOpen(false)}
                className="absolute left-0 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl backdrop-blur-md"
              >
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-subtle">
                  Architecture Specs
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'lifecycle')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">Advisor Lifecycle OS</span>
                  <span className="text-[11px] text-subtle">Pre/Post meeting lifecycle & CRM sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'mit-sloan')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">MIT Sloan Rigor Gap</span>
                  <span className="text-[11px] text-subtle">Income shocks, drift & bias fix</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'knowledge-graph')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">Semantic Knowledge Graph</span>
                  <span className="text-[11px] text-subtle">Complex Event Processing & alerts</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'positioning')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">Strategic Wedge Matrix</span>
                  <span className="text-[11px] text-subtle">B2B2C Co-Pilot vs. Direct B2C</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'compliance')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">Compliance & Guardrails</span>
                  <span className="text-[11px] text-subtle">Audit trails & zero training</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('documentation', 'blueprint')}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-surface-subtle cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ink">Execution Blueprint</span>
                  <span className="text-[11px] text-subtle">Phases 1-4 engineering roadmap</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Actions & Utilities */}
        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSelect />
          <ThemeToggle />

          {isAuthenticated ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-field bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 dark:text-brand-950"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center rounded-field border border-line px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface-subtle"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-field bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 dark:text-brand-950"
              >
                <span>Get Started</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex size-10 items-center justify-center rounded-field text-ink hover:bg-surface-subtle cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-surface px-4 py-6 shadow-lg md:hidden">
          <nav className="flex flex-col gap-4 text-base font-medium">
            <button
              type="button"
              onClick={() => navigateTo('triad')}
              className="text-left text-subtle hover:text-ink cursor-pointer"
            >
              The Triad Architecture
            </button>
            <button
              type="button"
              onClick={() => navigateTo('simulator')}
              className="text-left text-subtle hover:text-ink cursor-pointer"
            >
              Interactive Engine
            </button>
            <button
              type="button"
              onClick={() => navigateTo('documentation')}
              className="text-left font-semibold text-brand-700 dark:text-brand-600 cursor-pointer"
            >
              Documentation & Technical Specs
            </button>

            <div className="ml-3 flex flex-col gap-2 border-l border-line pl-3 text-sm text-subtle">
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'lifecycle')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • Advisor Lifecycle OS
              </button>
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'mit-sloan')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • MIT Sloan Quant Rigor Gap
              </button>
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'knowledge-graph')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • Semantic Knowledge Graph
              </button>
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'positioning')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • Strategic Wedge Matrix
              </button>
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'compliance')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • Compliance & Security
              </button>
              <button
                type="button"
                onClick={() => navigateTo('documentation', 'blueprint')}
                className="text-left hover:text-ink cursor-pointer"
              >
                • Execution Blueprint
              </button>
            </div>

            <div className="my-2 border-t border-line" />

            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-field bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white dark:text-brand-950"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-field border border-line px-4 py-2 text-center text-sm font-medium text-ink"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-field bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white dark:text-brand-950"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
