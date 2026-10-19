import { Outlet } from 'react-router';
import { Spinner } from '../../components/ui/spinner.tsx';
import { AppShell } from '../../components/layout/app-shell.tsx';
import { useSessionStatus } from '../../features/auth/session/use-session.ts';
import { HomePage } from './home-page.tsx';

// Dual-mode root route:
// - Anonymous visitors see the market-ready public Homepage.
// - Authenticated users see the AppShell containing DashboardPage.
export function RootRoute() {
  const status = useSessionStatus();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-brand-600">
        <Spinner label="Loading" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <HomePage />;
  }

  return <AppShell />;
}
