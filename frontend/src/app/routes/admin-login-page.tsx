import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ADMIN_ROLE } from '@wealth-advisor/rules';
import { Shield, Lock } from 'lucide-react';
import { Alert } from '../../components/ui/alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { FormField } from '../../components/ui/form-field.tsx';
import { Input } from '../../components/ui/input.tsx';
import { PasswordInput } from '../../components/ui/password-input.tsx';
import { authApi } from '../../features/auth/api/auth-api.ts';
import { useLogin } from '../../features/auth/api/use-login.ts';
import { clearSession } from '../../features/auth/session/session-store.ts';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your administrator credentials.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login.mutateAsync({ email, password, clientType: 'WEB', rememberMe: false });
      const me = await authApi.me();
      if (!me.roles.includes(ADMIN_ROLE)) {
        await authApi.logout();
        clearSession();
        setError('Access denied: Account is not authorized as a platform operator.');
        setLoading(false);
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('Invalid operator credentials. Access restricted.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-subtle p-4">
      <div className="w-full max-w-md rounded-panel border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-field bg-brand-600/10 text-brand-600 dark:text-brand-400">
            <Shield aria-hidden className="size-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">Operator Console</h1>
          <p className="mt-1 text-xs text-subtle">
            Restricted system administration portal for platform operators
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Operator email">
            {(control) => (
              <Input
                {...control}
                type="email"
                autoComplete="email"
                placeholder="admin@syntropy.ch"
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
                placeholder="Enter operator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </FormField>

          <Button type="submit" fullWidth loading={loading}>
            <Lock aria-hidden className="mr-1.5 size-4" />
            Authenticate to Console
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-subtle">
          <Link to="/login" className="hover:text-ink hover:underline">
            ← Client Portal
          </Link>
          <Link to="/advisor/login" className="hover:text-ink hover:underline">
            Wealth Analyst Workstation →
          </Link>
        </div>
      </div>
    </div>
  );
}
