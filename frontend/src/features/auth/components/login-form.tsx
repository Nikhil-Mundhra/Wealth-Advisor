import { LoginRequest } from '@wealth-advisor/contracts';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { Checkbox } from '../../../components/ui/checkbox.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { PasswordInput } from '../../../components/ui/password-input.tsx';
import { useContractForm } from '../../../lib/forms/use-contract-form.ts';
import { useLogin } from '../api/use-login.ts';
import { AUTH_ERROR_MESSAGES } from '../errors/auth-error-messages.ts';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const { form, formError, submit, fieldError } = useContractForm(LoginRequest, {
    defaultValues: { email: '', password: '', rememberMe: false },
    messages: AUTH_ERROR_MESSAGES,
  });

  return (
    <form
      onSubmit={submit(async (values) => {
        await login.mutateAsync(values);
        onSuccess();
      })}
      noValidate
      className="space-y-5"
    >
      {formError && <Alert>{formError}</Alert>}
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
    </form>
  );
}
