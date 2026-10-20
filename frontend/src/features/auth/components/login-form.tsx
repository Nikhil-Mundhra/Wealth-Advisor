import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginRequest } from '@wealth-advisor/contracts';
import { ADVISOR_ROLE, ADMIN_ROLE } from '@wealth-advisor/rules';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { Checkbox } from '../../../components/ui/checkbox.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { PasswordInput } from '../../../components/ui/password-input.tsx';
import { useContractForm } from '../../../lib/forms/use-contract-form.ts';
import { loginWithPasskey } from '../api/passkey-client.ts';
import { authApi } from '../api/auth-api.ts';
import { clearSession, getAccessToken, setAccessToken } from '../session/session-store.ts';
import { useLogin } from '../api/use-login.ts';
import { ME_QUERY_KEY } from '../api/use-me.ts';
import { AUTH_ERROR_MESSAGES } from '../errors/auth-error-messages.ts';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const queryClient = useQueryClient();
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const { form, formError, submit, fieldError } = useContractForm(LoginRequest, {
    defaultValues: { email: '', password: '', rememberMe: false },
    messages: AUTH_ERROR_MESSAGES,
  });

  async function rejectStaffRoles(hadSession: boolean): Promise<string | null> {
    const me = await authApi.me();
    if (!me.roles.includes(ADVISOR_ROLE) && !me.roles.includes(ADMIN_ROLE)) return null;
    if (!hadSession) {
      await authApi.logout().catch(() => undefined);
      clearSession();
      await queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    }
    return me.roles.includes(ADMIN_ROLE)
      ? 'Access denied: Administrator accounts must use the Operator Console at /admin/login.'
      : 'Access denied: Analyst accounts must use the Wealth Analyst Workstation at /advisor/login.';
  }

  async function signInWithPasskey(): Promise<void> {
    const email = form.getValues('email');
    if (!email) {
      setPasskeyError('Enter your email address first.');
      return;
    }
    setPasskeyLoading(true);
    setPasskeyError(null);
    setRoleError(null);
    try {
      const hadSession = getAccessToken() !== null;
      const tokens = await loginWithPasskey(email);
      setAccessToken(tokens.accessToken);
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      const staffError = await rejectStaffRoles(hadSession);
      if (staffError) {
        setRoleError(staffError);
        return;
      }
      onSuccess();
    } catch {
      setPasskeyError('Passkey sign-in failed. Use your password or enroll a passkey first.');
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit(async (values) => {
        setRoleError(null);
        const hadSession = getAccessToken() !== null;
        await login.mutateAsync(values);
        const staffError = await rejectStaffRoles(hadSession);
        if (staffError) {
          setRoleError(staffError);
          return;
        }
        onSuccess();
      })}
      noValidate
      className="space-y-5"
    >
      {formError && <Alert>{formError}</Alert>}
      {roleError && <Alert>{roleError}</Alert>}
      {passkeyError && <Alert>{passkeyError}</Alert>}
      <FormField label="Email address" error={fieldError('email')}>
        {(control) => <Input {...control} type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')} />}
      </FormField>
      <FormField label="Password" error={fieldError('password')}>
        {(control) => <PasswordInput {...control} autoComplete="current-password" placeholder="Enter your password" {...form.register('password')} />}
      </FormField>
      <Checkbox label="Keep me signed in" {...form.register('rememberMe')} />
      <Button type="submit" fullWidth loading={form.formState.isSubmitting}>
        Sign in
      </Button>
      <Button type="button" variant="outline" fullWidth loading={passkeyLoading} onClick={() => void signInWithPasskey()}>
        Sign in with passkey
      </Button>
    </form>
  );
}
