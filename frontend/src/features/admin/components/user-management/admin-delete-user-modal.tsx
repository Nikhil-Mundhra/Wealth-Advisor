import { useState } from 'react';
import type { AdminUserDto } from '@wealth-advisor/contracts';
import { Button } from '../../../../components/ui/button.tsx';
import { Dialog } from '../../../../components/ui/dialog.tsx';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminDeleteUserModalProps {
  user: AdminUserDto | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function AdminDeleteUserModal({
  user,
  open,
  onClose,
  onConfirm,
}: AdminDeleteUserModalProps) {
  const strings = useStrings();
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!user) return null;

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setServerError(null);
      await onConfirm(user.id);
      handleClose();
    } catch (err: any) {
      setServerError(err.message || 'Could not delete user account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={strings['admin.users.delete.confirmTitle']}
      className="max-w-md"
    >
      <div className="mt-4 flex flex-col gap-4">
        {serverError && (
          <div className="rounded-field border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
            {serverError}
          </div>
        )}

        <p className="text-sm text-subtle">
          {strings['admin.users.delete.confirmDesc']}
        </p>

        <div className="rounded-field border border-line bg-surface-subtle p-3 text-xs">
          <p className="font-semibold text-ink">
            {user.displayName ? `${user.displayName} (${user.email})` : user.email}
          </p>
          <p className="mt-1 font-mono text-subtle">ID: {user.id}</p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            {strings['admin.users.delete.cancelBtn']}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={deleting}
            className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600"
          >
            {strings['admin.users.delete.confirmBtn']}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
