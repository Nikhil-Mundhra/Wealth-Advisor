import { ADMIN_ROLE } from '@wealth-advisor/rules';
import { ArrowLeftRight, LayoutDashboard, MessagesSquare, ScrollText, Settings, Shield } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
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

function linkClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 items-center gap-3 rounded-field px-3 text-sm', isActive ? 'bg-surface-subtle text-ink' : 'text-subtle hover:text-ink');
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-brand-600 dark:text-brand-700' : 'text-subtle');
}

// Signed-in frame: top header on every viewport, sidebar on desktop, bottom tabs on mobile.
export function AppShell() {
  const strings = useStrings();
  const me = useMe();
  const navigate = useNavigate();
  const isAdmin = Boolean(me.data?.roles.includes(ADMIN_ROLE));

  const [briefOpen, setBriefOpen] = useState(false);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface text-ink md:pl-60">
      {/* Advisor Modals */}
      <PreMeetingBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        onNavigateToAdvisory={() => navigate('/advisory')}
      />
      <InstrumentComparisonModal
        open={instrumentsOpen}
        onClose={() => setInstrumentsOpen(false)}
      />

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <p className="px-5 pb-2 pt-6 text-lg font-semibold tracking-tight">{strings['app.name']}</p>
        <nav aria-label={strings['nav.main']} className="flex flex-col gap-1 px-3">
          {TABS.map(({ to, key, Icon, ...rest }) => (
            <NavLink key={to} to={to} {...rest} className={linkClass}>
              <Icon aria-hidden className="size-5" />
              {strings[key]}
            </NavLink>
          ))}
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
      </aside>

      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold tracking-tight md:hidden">{strings['app.name']}</p>
            <ClientSelector
              onOpenBrief={() => setBriefOpen(true)}
              onOpenInstruments={() => setInstrumentsOpen(true)}
            />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
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
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:pb-12 md:pt-8">
        <Outlet />
      </main>

      <nav
        aria-label={strings['header.nav.mobile']}
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map(({ to, key, Icon, ...rest }) => (
          <NavLink key={to} to={to} {...rest} className={tabClass}>
            <Icon aria-hidden className="size-5" />
            {strings[key]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
