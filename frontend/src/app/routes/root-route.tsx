import { Navigate } from 'react-router';
import { ADMIN_ROLE, ADVISOR_ROLE } from '@wealth-advisor/rules';
import { Spinner } from '../../components/ui/spinner.tsx';
import { AppShell } from '../../components/layout/app-shell.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { getAdminActingSession } from '../../features/auth/session/acting-session.ts';
import { useSessionStatus } from '../../features/auth/session/use-session.ts';
import { HomePage } from './home-page.tsx';

// Dual-mode root route:
// - Anonymous visitors see the market-ready public Homepage.
// - Authenticated staff land in their own portal; acting-as-client still reaches `/`.
export function RootRoute() {
  const status = useSessionStatus();
  const { data: me, isPending } = useMe();

  if (status === 'loading' || (status === 'authenticated' && isPending)) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-brand-600">
        <Spinner label="Loading" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <HomePage />;
  }

  if (!getAdminActingSession()) {
    if (me?.roles.includes(ADMIN_ROLE)) return <Navigate to="/admin" replace />;
    if (me?.roles.includes(ADVISOR_ROLE)) return <Navigate to="/advisor" replace />;
  }

  return <AppShell />;
}
