import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router';
import { Button } from '../../../components/ui/button.tsx';
import { Spinner } from '../../../components/ui/spinner.tsx';
import { ME_QUERY_KEY, useMe } from '../api/use-me.ts';
import { getAccessToken } from '../session/session-store.ts';

// Shown when the token exists but the identity lookup fails. Retrying here stops a
// page → login → home → page loop on persistent lookup failures.
export function MeErrorState() {
  const queryClient = useQueryClient();
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-medium text-ink">Session lookup failed</p>
      <p className="text-sm text-subtle">Your sign-in is still active. Try again.</p>
      <Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })}>
        Retry
      </Button>
    </div>
  );
}

// Identity gate for signed-in pages: spinner while roles resolve, never a demo
// fixture; the error state above when the lookup fails; login only when signed out.
export function MeGate({ children }: { children: ReactNode }) {
  const me = useMe();
  if (me.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-brand-600">
        <Spinner label="Loading" />
      </div>
    );
  }
  if (me.isError || !me.data) {
    return <MeErrorState />;
  }
  return <>{children}</>;
}
