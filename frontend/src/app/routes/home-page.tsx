import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import { useLogout } from '../../features/auth/api/use-logout.ts';
import { useMe } from '../../features/auth/api/use-me.ts';

// Signed-in placeholder: backend status, who you are, sign out, and the "Ask AI" stub.
export function HomePage() {
  const me = useMe();
  const logout = useLogout();
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [backend, setBackend] = useState<'checking' | 'ok' | 'unreachable'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => setBackend(response.ok ? 'ok' : 'unreachable'))
      .catch(() => setBackend('unreachable'));
  }, []);

  async function askAi() {
    const response = await fetch('/api/ai').catch(() => null);
    const body = (await response?.json().catch(() => null)) as { message?: string } | null;
    setAiMessage(body?.message ?? 'Backend unreachable.');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Wealth Advisor</h1>
      <p className="text-sm text-subtle">Backend: {backend}</p>
      {me.isPending && <Spinner label="Loading your profile" />}
      {me.isError && <Alert>Could not load your profile.</Alert>}
      {me.data && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-field border border-line p-5 text-sm">
          <dt className="text-subtle">Email</dt>
          <dd>{me.data.email}</dd>
          <dt className="text-subtle">Roles</dt>
          <dd>{me.data.roles.join(', ')}</dd>
          <dt className="text-subtle">Member since</dt>
          <dd>{new Date(me.data.createdAt).toLocaleDateString()}</dd>
        </dl>
      )}
      <div className="flex gap-3">
        <Button onClick={askAi}>Ask AI</Button>
        <Button variant="outline" loading={logout.isPending} onClick={() => logout.mutate()}>
          Sign out
        </Button>
      </div>
      {aiMessage && <Alert tone="info">{aiMessage}</Alert>}
    </main>
  );
}
