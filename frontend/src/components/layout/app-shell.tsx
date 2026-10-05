import { ArrowLeftRight, LayoutDashboard, MessagesSquare, Settings, Wallet } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { LanguageSelect } from '../ui/language-select.tsx';
import { ThemeToggle } from '../ui/theme-toggle.tsx';

const TABS = [
  { to: '/', key: 'nav.dashboard', Icon: LayoutDashboard, end: true },
  { to: '/portfolio', key: 'nav.portfolio', Icon: Wallet },
  { to: '/cashflow', key: 'nav.cashflow', Icon: ArrowLeftRight },
  { to: '/advisory', key: 'nav.advisory', Icon: MessagesSquare },
] as const;

function linkClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 items-center gap-3 rounded-field px-3 text-sm', isActive ? 'bg-surface-subtle text-ink' : 'text-subtle hover:text-ink');
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return cn('flex min-h-11 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-brand-600 dark:text-brand-100' : 'text-subtle');
}

// Signed-in frame: top header on every viewport, sidebar on desktop, bottom tabs on mobile.
export function AppShell() {
  const strings = useStrings();
  return (
    <div className="min-h-dvh bg-surface text-ink md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <p className="px-5 pb-2 pt-6 text-lg font-semibold tracking-tight">{strings['app.name']}</p>
        <nav aria-label={strings['nav.main']} className="flex flex-col gap-1 px-3">
          {TABS.map(({ to, key, Icon, ...rest }) => (
            <NavLink key={to} to={to} {...rest} className={linkClass}>
              <Icon aria-hidden className="size-5" />
              {strings[key]}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
          <p className="text-lg font-semibold tracking-tight md:hidden">{strings['app.name']}</p>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
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
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
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
