import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ADVISOR_ROLE, ADMIN_ROLE } from '@wealth-advisor/rules';
import { Briefcase, ChevronRight, Lock } from 'lucide-react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { FormField } from '../../components/ui/form-field.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PasswordInput } from '../../components/ui/password-input.tsx';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { useLogin } from '../../features/auth/api/use-login.ts';
import { clearSession, getAccessToken } from '../../features/auth/session/session-store.ts';

export function AdvisorLoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your wealth analyst credentials.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const hadSession = getAccessToken() !== null;
      await login.mutateAsync({ email, password, clientType: 'WEB', rememberMe: false });
      const me = await authApi.me();
      if (!me.roles.includes(ADVISOR_ROLE) && !me.roles.includes(ADMIN_ROLE)) {
        if (!hadSession) {
          await authApi.logout();
          clearSession();
        }
        setError('Access denied: Account is not authorized as an institutional Wealth Analyst. Please use the client portal.');
        setLoading(false);
        return;
      }
      navigate('/advisor', { replace: true });
    } catch {
      setError('Invalid analyst credentials. Please verify your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-subtle p-4">
      <div className="w-full max-w-md rounded-panel border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-field bg-gold/10 text-gold dark:text-gold-light">
            <Briefcase aria-hidden className="size-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">Wealth Analyst Workstation</h1>
          <p className="mt-1 text-xs text-subtle">
            Institutional surveillance terminal for fiduciary portfolio managers & analysts
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Institutional email">
            {(control) => (
              <Input
                {...control}
                type="email"
                autoComplete="email"
                placeholder="analyst@syntropy.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Password">
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </FormField>

          <Button type="submit" fullWidth loading={loading}>
            <Lock aria-hidden className="mr-1.5 size-4" />
            Sign in to Workstation
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 text-xs">
          <div className="flex items-center justify-between text-subtle">
            <span>Are you a private client?</span>
            <Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-700">
              Personal Client Portal <ChevronRight aria-hidden className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
