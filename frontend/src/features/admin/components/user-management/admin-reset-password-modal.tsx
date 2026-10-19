import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AdminResetPasswordRequest,
  type AdminUserDto,
} from '@wealth-advisor/contracts';
import { Button } from '../../../../components/ui/button.tsx';
import { Dialog } from '../../../../components/ui/dialog.tsx';
import { FormField } from '../../../../components/ui/form-field.tsx';
import { PasswordInput } from '../../../../components/ui/password-input.tsx';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminResetPasswordModalProps {
  user: AdminUserDto | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: AdminResetPasswordRequest) => Promise<void>;
}

export function AdminResetPasswordModal({
  user,
  open,
  onClose,
  onSubmit,
}: AdminResetPasswordModalProps) {
  const strings = useStrings();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminResetPasswordRequest>({
    resolver: zodResolver(AdminResetPasswordRequest) as any,
    defaultValues: {
      password: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onFormSubmit = async (data: AdminResetPasswordRequest) => {
    if (!user) return;
    try {
      setSubmitting(true);
      setServerError(null);
      await onSubmit(user.id, data);
      handleClose();
    } catch (err: any) {
      setServerError(err.message || 'Could not reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} title={strings['admin.users.resetPassword']} className="max-w-md">
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 flex flex-col gap-4">
        {serverError && (
          <div className="rounded-field border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
            {serverError}
          </div>
        )}

        <p className="text-xs text-subtle">
          Set a new password for <span className="font-semibold text-ink">{user.email}</span>. The user will be required to log in with this new credential.
        </p>

        <FormField label="New Password" error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              placeholder="At least 10 characters"
              autoComplete="new-password"
              {...register('password')}
            />
          )}
        </FormField>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {strings['admin.users.resetPassword']}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
