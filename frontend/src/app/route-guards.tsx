import { Navigate, Outlet } from 'react-router';
import { Spinner } from '../components/ui/spinner.tsx';
import { useMe } from '../features/auth/api/use-me.ts';
import { useSessionStatus } from '../features/auth/session/use-session.ts';

function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand-600">
      <Spinner label="Loading" />
    </div>
  );
}

// Signed-in pages: anonymous visitors go to /login.
export function ProtectedRoute() {
  const status = useSessionStatus();
  if (status === 'loading') return <FullPageSpinner />;
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}

// Signup and login: visitors who are already signed in go home.
export function GuestRoute() {
  const status = useSessionStatus();
  if (status === 'loading') return <FullPageSpinner />;
  return status === 'anonymous' ? <Outlet /> : <Navigate to="/" replace />;
}

// Admin console: signed-in non-admins go home. Roles arrive with the session.
export function AdminRoute() {
  const me = useMe();
  if (me.isPending) return <FullPageSpinner />;
  if (me.isError || !me.data?.roles.includes('ADMIN')) return <Navigate to="/" replace />;
  return <Outlet />;
}
