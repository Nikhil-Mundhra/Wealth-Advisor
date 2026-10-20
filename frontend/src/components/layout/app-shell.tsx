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
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { hasAdvisorRole } from '@wealth-advisor/rules';
import logoImg from '../../assets/logo.png';
import logoDarkImg from '../../assets/logo-dark.png';
import { ME_QUERY_KEY, useMe } from '../../features/auth/api/use-me.ts';
import {
  getAdminActingSession,
  returnToAdminSession,
  type ActingSessionInfo,
} from '../../features/auth/session/acting-session.ts';
import { ClientSelector } from '../../features/advisor/components/client-selector.tsx';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';
import { LanguageSelect } from '../ui/language-select.tsx';
import { ThemeToggle } from '../ui/theme-toggle.tsx';

// Client Den Navigation (Strictly private personal wealth management)
const CLIENT_TABS = [
  { to: '/', key: 'nav.dashboard', Icon: LayoutDashboard, end: true },
  { to: '/cashflow', key: 'nav.cashflow', Icon: ArrowLeftRight },
  { to: '/advisory', key: 'nav.advisory', Icon: MessagesSquare },
] as const;

// Advisor Workstation Navigation (Institutional oversight of client book)
const ADVISOR_NAV_ITEMS = [
  { to: '/advisor', label: 'Client Overview', Icon: Users, end: true },
] as const;

// System Admin Console Navigation (Supervisory operators)
const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', Icon: Shield, end: true },
  { to: '/admin/users', label: 'User Accounts', Icon: Users },
  { to: '/admin/credentials', label: 'Demo Credentials', Icon: KeyRound },
  { to: '/admin/models', label: 'Models & Keys', Icon: Cpu },
  { to: '/admin/tenants', label: 'Tenants', Icon: Building2 },
  { to: '/admin/api-keys', label: 'API Keys', Icon: Key },
] as const;

function linkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex min-h-11 items-center gap-3 rounded-field px-3 text-sm transition-colors',
    isActive ? 'bg-surface-subtle text-ink font-medium' : 'text-subtle hover:text-ink'
  );
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex min-h-11 flex-col items-center justify-center gap-1 text-xs transition-colors',
    isActive ? 'text-brand-600 dark:text-brand-700 font-medium' : 'text-subtle'
  );
}

// Banner displayed ONLY when an administrator is actively testing a demo persona
function ActingBanner() {
  const [acting, setActing] = useState<ActingSessionInfo | null>(() => getAdminActingSession());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCheck = () => setActing(getAdminActingSession());
    window.addEventListener('storage', handleCheck);
    return () => window.removeEventListener('storage', handleCheck);
  }, []);

  if (!acting) return null;

  const handleReturn = async () => {
    const success = returnToAdminSession();
    if (success) {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      navigate('/admin/credentials');
    }
  };

  return (
    <aside
      aria-label="Admin demo session active"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-gold/40 bg-gold/15 px-4 py-2 text-xs backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-ink">
        <Shield aria-hidden className="size-4 text-gold shrink-0" />
        <span className="font-semibold text-gold-dark dark:text-gold-light">
          Admin Acting Mode:
        </span>
        <span className="text-subtle">
          Acting as <strong className="text-ink font-semibold">{acting.name}</strong> ({acting.roleBadge} · {acting.category})
        </span>
      </div>
      <button
        type="button"
        onClick={handleReturn}
        className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/20 px-3 py-1 font-semibold text-xs text-ink hover:bg-gold/30 transition-colors cursor-pointer"
      >
        <ArrowLeft aria-hidden className="size-3 text-gold" />
        <span>Return to Admin Console</span>
      </button>
    </aside>
  );
}

// Signed-in frame: Clean separation between Client Den, Advisor Workstation, and Admin Console.
export function AppShell() {
  const strings = useStrings();
  const location = useLocation();
  const { data: me, isPending: mePending } = useMe();
  // Hide until roles resolve so advisors see no client-tab flash.
  const showAdvisoryTab = !mePending && (!me || !hasAdvisorRole(me.roles));
  const clientTabs = CLIENT_TABS.filter((tab) => tab.to !== '/advisory' || showAdvisoryTab);

  const isAdminSection = location.pathname.startsWith('/admin');
  const isAdvisorSection =
    location.pathname.startsWith('/advisor') ||
    // Advisors reach /settings/* from the workstation sidebar; keep the advisor chrome there.
    // ADVISOR role only — admins keep the client chrome on settings as before.
    (location.pathname.startsWith('/settings') && (me?.roles.includes('ADVISOR') ?? false));

  return (
    <div className="min-h-dvh bg-surface text-ink md:pl-60">
      {/* Impersonation Banner for Operators */}
      <ActingBanner />

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 pb-2 pt-6">
          <Link
            to={isAdminSection ? '/admin' : isAdvisorSection ? '/advisor' : '/'}
            aria-label={strings['app.name']}
            className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-90"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center">
              <img
                src={logoImg}
                alt="Syntropy AI Logo"
                className="size-8 object-contain dark:hidden"
              />
              <img
                src={logoDarkImg}
                alt="Syntropy AI Logo"
                className="hidden size-8 object-contain dark:block"
              />
            </div>
            <p className="text-lg font-semibold tracking-tight">{strings['app.name']}</p>
          </Link>
          {isAdvisorSection && (
            <div className="mt-1 flex items-center gap-1.5 pl-10.5">
              <Briefcase aria-hidden className="size-3 text-gold" />
              <span className="font-semibold text-[11px] uppercase tracking-wider text-gold">Advisor Workstation</span>
            </div>
          )}
        </div>

        {/* 1. Admin Console Sidebar */}
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
            <NavLink to="/advisor" className={linkClass}>
              <Briefcase aria-hidden className="size-5 text-gold" />
              <span>Advisor Workstation</span>
            </NavLink>
          </nav>
        ) : isAdvisorSection ? (
          /* 2. Advisor Workstation Sidebar */
          <nav aria-label="Advisor workstation navigation" className="flex flex-col gap-1 px-3 mt-2">
            {ADVISOR_NAV_ITEMS.map(({ to, label, Icon, ...rest }) => (
              <NavLink key={to} to={to} {...rest} className={linkClass}>
                <Icon aria-hidden className="size-5 text-gold" />
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="my-2 border-t border-line" />
            <NavLink to="/settings/security" className={linkClass}>
              <Settings aria-hidden className="size-5" />
              {strings['header.settings']}
            </NavLink>
            <div className="my-3 border-t border-line" />
            <NavLink to="/" className={linkClass}>
              <ArrowLeft aria-hidden className="size-5 text-subtle" />
              <span>Exit to Client App</span>
            </NavLink>
          </nav>
        ) : (
          /* 3. Client's Den Sidebar (Strictly personal portfolio, NO admin or advisor tabs) */
          <nav aria-label={strings['nav.main']} className="flex flex-col gap-1 px-3 mt-2">
            {clientTabs.map(({ to, key, Icon, ...rest }) => (
              <NavLink key={to} to={to} {...rest} className={linkClass}>
                <Icon aria-hidden className="size-5" />
                {strings[key]}
              </NavLink>
            ))}
            <div className="my-2 border-t border-line" />
            <NavLink to="/settings/security" className={linkClass}>
              <Settings aria-hidden className="size-5" />
              {strings['header.settings']}
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
            <Link
              to={isAdminSection ? '/admin' : isAdvisorSection ? '/advisor' : '/'}
              aria-label={strings['app.name']}
              className="flex items-center gap-2 text-ink md:hidden"
            >
              <div className="relative flex size-7 shrink-0 items-center justify-center">
                <img
                  src={logoImg}
                  alt="Syntropy AI Logo"
                  className="size-7 object-contain dark:hidden"
                />
                <img
                  src={logoDarkImg}
                  alt="Syntropy AI Logo"
                  className="hidden size-7 object-contain dark:block"
                />
              </div>
              <p className="text-lg font-semibold tracking-tight">{strings['app.name']}</p>
            </Link>
            {isAdminSection && (
              <div className="flex items-center gap-2">
                <Shield aria-hidden className="size-4 text-gold" />
                <span className="font-semibold text-xs tracking-wider uppercase text-subtle">
                  Admin Console
                </span>
              </div>
            )}
            {isAdvisorSection && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold border border-gold/20">
                  <Briefcase aria-hidden className="size-3.5" />
                  <span>Institutional</span>
                </div>
                {/* Advisor can switch between clients in the workstation */}
                <ClientSelector />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
            {isAdminSection && (
              <NavLink
                to="/"
                aria-label="Exit Admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface hover:text-ink transition-colors"
              >
                <ArrowLeft aria-hidden className="size-3.5 text-subtle" />
                <span>Exit Admin</span>
              </NavLink>
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
          isAdminSection ? 'grid-cols-5' : isAdvisorSection ? 'grid-cols-3' : 'grid-cols-3'
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
        ) : isAdvisorSection ? (
          <>
            <NavLink to="/advisor" end className={tabClass}>
              <Users aria-hidden className="size-5" />
              <span>Clients</span>
            </NavLink>
            <NavLink to="/settings/security" className={tabClass}>
              <Settings aria-hidden className="size-5" />
              <span>{strings['header.settings']}</span>
            </NavLink>
            <NavLink to="/" className={tabClass}>
              <ArrowLeft aria-hidden className="size-5" />
              <span>Exit</span>
            </NavLink>
          </>
        ) : (
          clientTabs.map(({ to, key, Icon, ...rest }) => (
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
