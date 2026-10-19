import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type AdminUserDto,
  type TenantDto,
  UpdateAdminUserRequest,
} from '@wealth-advisor/contracts';
import { Button } from '../../../../components/ui/button.tsx';
import { Checkbox } from '../../../../components/ui/checkbox.tsx';
import { Dialog } from '../../../../components/ui/dialog.tsx';
import { FormField } from '../../../../components/ui/form-field.tsx';
import { Input } from '../../../../components/ui/input.tsx';
import { Label } from '../../../../components/ui/label.tsx';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminEditUserModalProps {
  user: AdminUserDto | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateAdminUserRequest) => Promise<void>;
  tenants: TenantDto[];
  currentUserId?: string;
}

export function AdminEditUserModal({
  user,
  open,
  onClose,
  onSubmit,
  tenants,
  currentUserId,
}: AdminEditUserModalProps) {
  const strings = useStrings();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isSelf = user ? user.id === currentUserId : false;

  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADVISOR' | 'ADMIN'>('USER');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateAdminUserRequest>({
    resolver: zodResolver(UpdateAdminUserRequest) as any,
    defaultValues: {
      displayName: '',
      roles: ['USER'],
      status: 'ACTIVE',
      tenantId: null,
      emailVerified: false,
    },
  });

  useEffect(() => {
    if (user) {
      const primaryRole: 'USER' | 'ADVISOR' | 'ADMIN' = user.roles.includes('ADMIN')
        ? 'ADMIN'
        : user.roles.includes('ADVISOR')
        ? 'ADVISOR'
        : 'USER';
      setSelectedRole(primaryRole);
      reset({
        displayName: user.displayName || '',
        roles: primaryRole === 'ADMIN' ? ['USER', 'ADMIN'] : primaryRole === 'ADVISOR' ? ['USER', 'ADVISOR'] : ['USER'],
        status: user.status,
        tenantId: user.tenantId || null,
        emailVerified: user.emailVerified,
      });
      setServerError(null);
    }
  }, [user, reset]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onFormSubmit = async (data: UpdateAdminUserRequest) => {
    if (!user) return;
    try {
      setSubmitting(true);
      setServerError(null);
      const computedRoles = selectedRole === 'ADMIN'
        ? ['USER', 'ADMIN']
        : selectedRole === 'ADVISOR'
        ? ['USER', 'ADVISOR']
        : ['USER'];

      await onSubmit(user.id, {
        displayName: data.displayName?.trim() || null,
        roles: computedRoles as any,
        status: data.status,
        tenantId: data.tenantId || null,
        emailVerified: data.emailVerified,
      });
      handleClose();
    } catch (err: any) {
      setServerError(err.message || 'Could not update user account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const emailVerified = watch('emailVerified');

  return (
    <Dialog open={open} onClose={handleClose} title={strings['admin.users.edit']} className="max-w-lg">
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 flex flex-col gap-4">
        {serverError && (
          <div className="rounded-field border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
            {serverError}
          </div>
        )}

        <div className="rounded-field border border-line bg-surface-subtle p-3 text-xs">
          <span className="font-semibold text-subtle uppercase">Account ID:</span>{' '}
          <span className="font-mono text-ink">{user.id}</span>
          <br />
          <span className="font-semibold text-subtle uppercase">Email:</span>{' '}
          <span className="font-mono text-ink">{user.email}</span>
        </div>

        <FormField label="Display Name" error={errors.displayName?.message}>
          {(control) => <Input {...control} placeholder="Full Name" {...register('displayName')} />}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-role">Role</Label>
            <select
              id="edit-user-role"
              disabled={isSelf}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="h-11 rounded-field border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <option value="USER">USER (Client)</option>
              <option value="ADVISOR">ADVISOR (Wealth Analyst)</option>
              <option value="ADMIN">ADMIN (Operator)</option>
            </select>
            {isSelf && <span className="text-[11px] text-subtle">Cannot change your own role</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-status">Status</Label>
            <select
              id="edit-user-status"
              disabled={isSelf}
              className="h-11 rounded-field border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-600"
              {...register('status')}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
            {isSelf && <span className="text-[11px] text-subtle">Cannot withdraw your own account</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-user-tenant">Organization / Tenant</Label>
          <select
            id="edit-user-tenant"
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

        <div className="pt-1">
          <Checkbox
            id="edit-user-email-verified"
            label="Mark email as verified"
            checked={Boolean(emailVerified)}
            onChange={(e) => setValue('emailVerified', e.target.checked)}
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {strings['admin.users.save']}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
