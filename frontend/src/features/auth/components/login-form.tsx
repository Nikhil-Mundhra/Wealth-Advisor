import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequest } from '@wealth-advisor/contracts';
import type { z } from 'zod';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { Checkbox } from '../../../components/ui/checkbox.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { PasswordInput } from '../../../components/ui/password-input.tsx';
import { useLogin } from '../api/use-login.ts';
import { mapAuthError } from '../map-auth-error.ts';

// Validates with the same LoginRequest contract the API enforces; clientType defaults to WEB there.
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<z.input<typeof LoginRequest>, unknown, z.output<typeof LoginRequest>>({
    resolver: zodResolver(LoginRequest),
    defaultValues: { email: '', password: '', rememberMe: false },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      onSuccess();
    } catch (error) {
      const view = mapAuthError(error);
      if (view.field) form.setError(view.field, { message: view.message }, { shouldFocus: true });
      else setFormError(view.message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <FormField label="Email address" error={errors.email?.message}>
        {(control) => <Input {...control} type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')} />}
      </FormField>
      <FormField label="Password" error={errors.password?.message}>
        {(control) => <PasswordInput {...control} autoComplete="current-password" placeholder="Enter your password" {...form.register('password')} />}
      </FormField>
      <Checkbox label="Keep me signed in" {...form.register('rememberMe')} />
      <Button type="submit" fullWidth loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
