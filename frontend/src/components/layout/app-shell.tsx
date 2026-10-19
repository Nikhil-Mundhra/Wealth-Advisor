import { ADMIN_ROLE, ADVISOR_ROLE } from '@wealth-advisor/rules';
import {
  ArrowLeft,
  ArrowLeftRight,
  Briefcase,
  Building2,
  Cpu,
  Key,
  KeyRound,
  LayoutDashboard,
  MessagesSquare,
  ScrollText,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useMe } from '../../features/auth/api/use-me.ts';
import { ClientSelector } from '../../features/advisor/components/client-selector.tsx';
import { PreMeetingBriefModal } from '../../features/advisor/components/pre-meeting-brief-modal.tsx';
import { InstrumentComparisonModal } from '../../features/advisor/components/instrument-comparison-modal.tsx';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { LanguageSelect } from '../ui/language-select.tsx';
import { ThemeToggle } from '../ui/theme-toggle.tsx';

const TABS = [
  { to: '/', key: 'nav.dashboard', Icon: LayoutDashboard, end: true },
  { to: '/cashflow', key: 'nav.cashflow', Icon: ArrowLeftRight },
  { to: '/advisory', key: 'nav.advisory', Icon: MessagesSquare },
] as const;

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', Icon: Shield, end: true },
  { to: '/admin/users', label: 'User Accounts', Icon: Users },
  { to: '/admin/credentials', label: 'Demo Credentials', Icon: KeyRound },
  { to: '/admin/models', label: 'Models & Keys', Icon: Cpu },
  { to: '/admin/tenants', label: 'Tenants', Icon: Building2 },
  { to: '/admin/api-keys', label: 'API Keys', Icon: Key },
] as const;

function linkClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 items-center gap-3 rounded-field px-3 text-sm', isActive ? 'bg-surface-subtle text-ink font-medium' : 'text-subtle hover:text-ink');
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-brand-600 dark:text-brand-700 font-medium' : 'text-subtle');
}

// Signed-in frame: top header on every viewport, sidebar on desktop, bottom tabs on mobile.
export function AppShell() {
  const strings = useStrings();
  const me = useMe();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = Boolean(me.data?.roles.includes(ADMIN_ROLE));
  const isAdvisor = Boolean(me.data?.roles.some((r) => r === ADVISOR_ROLE || r === ADMIN_ROLE));
  const isAdminSection = location.pathname.startsWith('/admin');

  const [briefOpen, setBriefOpen] = useState(false);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface text-ink md:pl-60">
      {/* Advisor Modals (Only rendered when not in Admin section) */}
      {!isAdminSection && (
        <>
          <PreMeetingBriefModal
            open={briefOpen}
            onClose={() => setBriefOpen(false)}
            onNavigateToAdvisory={() => navigate('/advisory')}
          />
          <InstrumentComparisonModal
            open={instrumentsOpen}
            onClose={() => setInstrumentsOpen(false)}
          />
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 pb-2 pt-6">
          <p className="text-lg font-semibold tracking-tight">{strings['app.name']}</p>
          {isAdminSection && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="flex size-1.5 rounded-full bg-gold" />
              <span className="font-semibold text-[11px] uppercase tracking-wider text-gold">Admin Console</span>
            </div>
          )}
        </div>

        {isAdminSection ? (
          <nav aria-label="Admin console navigation" className="flex flex-col gap-1 px-3 mt-2">
            {ADMIN_NAV_ITEMS.map(({ to, label, Icon, ...rest }) => (
              <NavLink key={to} to={to} {...rest} className={linkClass}>
                <Icon aria-hidden className="size-5 text-gold" />
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="my-3 border-t border-line" />
            <NavLink to="/" className={linkClass}>
              <ArrowLeft aria-hidden className="size-5 text-subtle" />
              <span>Exit to Client App</span>
            </NavLink>
            {isAdvisor && (
              <NavLink to="/advisor" className={linkClass}>
                <Briefcase aria-hidden className="size-5 text-gold" />
                <span>Advisor Workstation</span>
              </NavLink>
            )}
          </nav>
        ) : (
          <nav aria-label={strings['nav.main']} className="flex flex-col gap-1 px-3 mt-2">
            {TABS.map(({ to, key, Icon, ...rest }) => (
              <NavLink key={to} to={to} {...rest} className={linkClass}>
                <Icon aria-hidden className="size-5" />
                {strings[key]}
              </NavLink>
            ))}
            {isAdvisor && (
              <NavLink to="/advisor" className={linkClass}>
                <Briefcase aria-hidden className="size-5 text-gold" />
                {strings['nav.advisor']}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                <Shield aria-hidden className="size-5 text-gold" />
                {strings['admin.overview']}
              </NavLink>
            )}
            <div className="my-2 border-t border-line" />
            <NavLink to="/settings/security" className={linkClass}>
              <Settings aria-hidden className="size-5" />
              {strings['settings.security']}
            </NavLink>
            <NavLink to="/settings/ledger" className={linkClass}>
              <ScrollText aria-hidden className="size-5" />
              {strings['settings.ledger']}
            </NavLink>
          </nav>
        )}
      </aside>

      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold tracking-tight md:hidden">{strings['app.name']}</p>
            {isAdminSection ? (
              <div className="flex items-center gap-2">
                <Shield aria-hidden className="size-4 text-gold" />
                <span className="font-semibold text-xs tracking-wider uppercase text-subtle">
                  Operator Mode
                </span>
              </div>
            ) : isAdvisor ? (
              <ClientSelector
                onOpenBrief={() => setBriefOpen(true)}
                onOpenInstruments={() => setInstrumentsOpen(true)}
              />
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
            {isAdminSection ? (
              <NavLink
                to="/"
                aria-label="Exit Admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface hover:text-ink transition-colors"
              >
                <ArrowLeft aria-hidden className="size-3.5 text-subtle" />
                <span>Exit Admin</span>
              </NavLink>
            ) : (
              <>
                {isAdvisor && (
                  <NavLink
                    to="/advisor"
                    aria-label={strings['nav.advisor']}
                    className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-subtle"
                  >
                    <Briefcase aria-hidden className="size-5 text-gold" />
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    aria-label="Admin"
                    className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-subtle"
                  >
                    <Shield aria-hidden className="size-5 text-gold" />
                  </NavLink>
                )}
                <NavLink
                  to="/settings/security"
                  aria-label={strings['header.settings']}
                  className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-subtle"
                >
                  <Settings aria-hidden className="size-5" />
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pt-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label={strings['header.nav.mobile']}
        className={cn(
          'fixed inset-x-0 bottom-0 z-10 grid border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden',
          isAdminSection ? 'grid-cols-5' : 'grid-cols-3'
        )}
      >
        {isAdminSection ? (
          <>
            <NavLink to="/admin" end className={tabClass}>
              <Shield aria-hidden className="size-5" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/admin/users" className={tabClass}>
              <Users aria-hidden className="size-5" />
              <span>Users</span>
            </NavLink>
            <NavLink to="/admin/credentials" className={tabClass}>
              <KeyRound aria-hidden className="size-5" />
              <span>Demos</span>
            </NavLink>
            <NavLink to="/admin/models" className={tabClass}>
              <Cpu aria-hidden className="size-5" />
              <span>Models</span>
            </NavLink>
            <NavLink to="/" className={tabClass}>
              <ArrowLeft aria-hidden className="size-5" />
              <span>Exit</span>
            </NavLink>
          </>
        ) : (
          TABS.map(({ to, key, Icon, ...rest }) => (
            <NavLink key={to} to={to} {...rest} className={tabClass}>
              <Icon aria-hidden className="size-5" />
              {strings[key]}
            </NavLink>
          ))
        )}
      </nav>
    </div>
  );
}
