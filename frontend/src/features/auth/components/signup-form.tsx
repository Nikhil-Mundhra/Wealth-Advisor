import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupRequest } from '@wealth-advisor/contracts';
import type { z } from 'zod';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { PasswordInput } from '../../../components/ui/password-input.tsx';
import { useSignup } from '../api/use-signup.ts';
import { mapAuthError } from '../map-auth-error.ts';

// Validates with the same SignupRequest contract the API enforces.
export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<z.input<typeof SignupRequest>, unknown, z.output<typeof SignupRequest>>({
    resolver: zodResolver(SignupRequest),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signup.mutateAsync(values);
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
      <FormField label="Password" hint="At least 8 characters." error={errors.password?.message}>
        {(control) => <PasswordInput {...control} autoComplete="new-password" placeholder="Create a password" {...form.register('password')} />}
      </FormField>
      <Button type="submit" fullWidth loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
