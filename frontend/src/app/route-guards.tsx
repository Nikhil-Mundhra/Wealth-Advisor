import { Navigate, Outlet } from 'react-router';
import { Spinner } from '../components/ui/spinner.tsx';
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
