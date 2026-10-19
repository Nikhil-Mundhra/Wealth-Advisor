import { SignupRequest } from '@wealth-advisor/contracts';
import { PASSWORD_MIN_LENGTH } from '@wealth-advisor/rules';
import { Alert } from '../../../components/ui/alert.tsx';
import { Button } from '../../../components/ui/button.tsx';
import { FormField } from '../../../components/ui/form-field.tsx';
import { Input } from '../../../components/ui/input.tsx';
import { PasswordInput } from '../../../components/ui/password-input.tsx';
import { useContractForm } from '../../../lib/forms/use-contract-form.ts';
import { type SignupOutcome, useSignup } from '../api/use-signup.ts';
import { AUTH_ERROR_MESSAGES } from '../errors/auth-error-messages.ts';

export function SignupForm({
  onSuccess,
  initialAdvisorCode,
}: {
  onSuccess: (outcome: SignupOutcome) => void;
  initialAdvisorCode?: string;
}) {
  const signup = useSignup();
  const { form, formError, submit, fieldError } = useContractForm(SignupRequest, {
    defaultValues: { email: '', password: '', advisorCode: initialAdvisorCode ?? '' },
    messages: AUTH_ERROR_MESSAGES,
  });

  return (
    <form onSubmit={submit(async (values) => onSuccess(await signup.mutateAsync(values)))} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <FormField label="Email address" error={fieldError('email')}>
        {(control) => <Input {...control} type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')} />}
      </FormField>
      <FormField label="Password" hint={`At least ${PASSWORD_MIN_LENGTH} characters.`} error={fieldError('password')}>
        {(control) => <PasswordInput {...control} autoComplete="new-password" placeholder="Create a password" {...form.register('password')} />}
      </FormField>
      <FormField label="Wealth Analyst Code (Optional)" hint="If you were invited by an institutional advisor, enter their code." error={fieldError('advisorCode')}>
        {(control) => <Input {...control} placeholder="ADV-..." {...form.register('advisorCode')} />}
      </FormField>
      <Button type="submit" fullWidth loading={form.formState.isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
