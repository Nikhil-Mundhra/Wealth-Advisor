import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAdminUserRequest, type TenantDto } from '@wealth-advisor/contracts';
import { Button } from '../../../../components/ui/button.tsx';
import { Dialog } from '../../../../components/ui/dialog.tsx';
import { FormField } from '../../../../components/ui/form-field.tsx';
import { Input } from '../../../../components/ui/input.tsx';
import { Label } from '../../../../components/ui/label.tsx';
import { PasswordInput } from '../../../../components/ui/password-input.tsx';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminCreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdminUserRequest) => Promise<void>;
  tenants: TenantDto[];
}

export function AdminCreateUserModal({ open, onClose, onSubmit, tenants }: AdminCreateUserModalProps) {
  const strings = useStrings();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminUserRequest>({
    resolver: zodResolver(CreateAdminUserRequest) as any,
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      roles: ['USER'],
      tenantId: null,
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onFormSubmit = async (data: CreateAdminUserRequest) => {
    try {
      setSubmitting(true);
      setServerError(null);
      await onSubmit({
        ...data,
        displayName: data.displayName?.trim() || null,
        tenantId: data.tenantId || null,
      });
      handleClose();
    } catch (err: any) {
      setServerError(err.message || 'Could not create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title={strings['admin.users.create']} className="max-w-lg">
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 flex flex-col gap-4">
        {serverError && (
          <div className="rounded-field border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
            {serverError}
          </div>
        )}

        <FormField label={strings['security.email']} error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              placeholder="colleague@wealth.example"
              autoComplete="off"
              {...register('email')}
            />
          )}
        </FormField>

        <FormField label="Display Name" error={errors.displayName?.message}>
          {(control) => (
            <Input
              {...control}
              placeholder="Jane Doe"
              autoComplete="off"
              {...register('displayName')}
            />
          )}
        </FormField>

        <FormField label="Initial Password" error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              placeholder="At least 10 characters"
              autoComplete="new-password"
              {...register('password')}
            />
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-user-role">Role</Label>
            <select
              id="create-user-role"
              className="h-11 rounded-field border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand-600"
              {...register('roles.0')}
            >
              <option value="USER">USER (Client)</option>
              <option value="ADVISOR">ADVISOR (Wealth Analyst)</option>
              <option value="ADMIN">ADMIN (Operator)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-user-tenant">Organization / Tenant</Label>
            <select
              id="create-user-tenant"
              className="h-11 rounded-field border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand-600"
              {...register('tenantId')}
            >
              <option value="">Personal / Individual</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create account
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
