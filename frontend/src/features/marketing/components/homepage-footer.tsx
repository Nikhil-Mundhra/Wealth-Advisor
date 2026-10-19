import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import logoImg from '../../../assets/logo.png';
import logoDarkImg from '../../../assets/logo-dark.png';

export function HomepageFooter() {
  return (
    <footer className="border-t border-line bg-surface pt-16 pb-12 text-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/home" className="flex items-center gap-3 text-ink">
              <div className="relative flex size-10 shrink-0 items-center justify-center">
                <img
                  src={logoImg}
                  alt="Syntropy AI Logo"
                  className="size-10 object-contain dark:hidden"
                />
                <img
                  src={logoDarkImg}
                  alt="Syntropy AI Logo"
                  className="hidden size-10 object-contain dark:block"
                />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">Syntropy AI</span>
            </Link>

            <p className="max-w-md text-xs leading-relaxed text-subtle">
              The institutional-grade AI Wealth Operating System bridging raw LLMs with deterministic quantitative
              rigor. Unifying an automated advisor lifecycle, a semantic knowledge graph, and MIT Sloan
              bias mitigation.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-subtle px-2.5 py-1 text-ink font-medium">
                <ShieldCheck className="size-3.5 text-brand-600" />
                SHA-256 Ledger
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-subtle px-2.5 py-1 text-ink font-medium">
                <Lock className="size-3.5 text-gold" />
                Zero Training Guarantee
              </span>
            </div>
          </div>

          {/* Column 1: Core Architecture */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink">The Architecture</p>
            <ul className="mt-4 space-y-2.5 text-xs text-subtle">
              <li>
                <a href="#triad" className="hover:text-ink transition">The Triad Core</a>
              </li>
              <li>
                <a href="#documentation" className="hover:text-ink transition">Advisor Lifecycle OS</a>
              </li>
              <li>
                <a href="#documentation" className="hover:text-ink transition">MIT Sloan Rigor Gap</a>
              </li>
              <li>
                <a href="#documentation" className="hover:text-ink transition">Semantic Knowledge Graph</a>
              </li>
              <li>
                <a href="#simulator" className="hover:text-ink transition">Interactive Simulator</a>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform & App */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink">Live Platform</p>
            <ul className="mt-4 space-y-2.5 text-xs text-subtle">
              <li>
                <Link to="/" className="hover:text-ink transition">Dashboard Overview</Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-ink transition">Multi-Currency Holdings</Link>
              </li>
              <li>
                <Link to="/cashflow" className="hover:text-ink transition">Cashflow & Remittances</Link>
              </li>
              <li>
                <Link to="/advisory" className="hover:text-ink transition">AI Advisory Engine</Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-ink transition">Risk Profiler Wizard</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Access */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink">Access & Security</p>
            <ul className="mt-4 space-y-2.5 text-xs text-subtle">
              <li>
                <Link to="/login" className="hover:text-ink transition">Client & Advisor Login</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-ink transition">Create Account</Link>
              </li>
              <li>
                <Link to="/settings/security" className="hover:text-ink transition">Passkeys & Security</Link>
              </li>
              <li>
                <Link to="/settings/ledger" className="hover:text-ink transition">Cryptographic Ledger</Link>
              </li>
              <li>
                <a href="#positioning" className="hover:text-ink transition">B2B2C vs B2C Matrix</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory & Fiduciary Disclaimers */}
        <div className="mt-12 border-t border-line pt-8 text-[11px] leading-relaxed text-subtle space-y-3">
          <p>
            <strong>Regulatory Disclosure:</strong> Syntropy AI provides algorithmic intelligence, execution
            workflows, and quantitative analysis tools for licensed financial advisors and self-directed investors.
            Outputs are deterministically modeled via Python and mathematical solver engines. Past performance is
            no guarantee of future financial results. Simulation and rebalancing proposals do not constitute an
            unconditional guarantee of investment returns.
          </p>
          <p>
            <strong>Fiduciary & FIDO2 Verification:</strong> In B2B2C deployments, the human financial advisor remains
            the licensed fiduciary holding legal responsibility for all client recommendations. All trade proposals
            require human-in-the-loop authorization verified via FIDO2 / WebAuthn cryptographic biometric proof.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-subtle">
            <p>© 2026 Syntropy AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Tamper-Evident Ledger</span>
              <span>Calculation Shield</span>
              <span>Zero Client PII Training</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
