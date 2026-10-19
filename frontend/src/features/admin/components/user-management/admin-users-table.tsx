import { Check, Clock, KeyRound, Pencil, Shield, Trash2 } from 'lucide-react';
import type { AdminUserDto, TenantDto } from '@wealth-advisor/contracts';
import { Button } from '../../../../components/ui/button.tsx';
import { cardClassName } from '../../../../components/ui/card.tsx';
import { cn } from '../../../../lib/cn.ts';
import { useStrings } from '../../../../lib/dictionaries.ts';
import { getLocale } from '../../../../lib/locale-store.ts';

interface AdminUsersTableProps {
  users: AdminUserDto[];
  tenants: TenantDto[];
  currentUserId?: string;
  onEdit: (user: AdminUserDto) => void;
  onResetPassword: (user: AdminUserDto) => void;
  onDelete: (user: AdminUserDto) => void;
}

export function AdminUsersTable({
  users,
  tenants,
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete,
}: AdminUsersTableProps) {
  const strings = useStrings();
  const locale = getLocale();

  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString.slice(0, 10);
    }
  };

  const getInitials = (displayName: string | null, email: string) => {
    if (displayName && displayName.trim().length > 0) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return displayName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (users.length === 0) {
    return (
      <div className={cn(cardClassName, 'flex flex-col items-center justify-center p-12 text-center')}>
        <p className="text-sm text-subtle">{strings['admin.users.empty']}</p>
      </div>
    );
  }

  return (
    <div className={cn(cardClassName, 'overflow-hidden p-0')}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" role="table">
          <thead className="border-b border-line bg-surface-subtle text-xs font-medium uppercase tracking-wider text-subtle">
            <tr>
              <th scope="col" className="px-4 py-3">
                {strings['admin.users.col.user']}
              </th>
              <th scope="col" className="px-4 py-3">
                {strings['admin.users.col.role']}
              </th>
              <th scope="col" className="px-4 py-3">
                {strings['admin.users.col.status']}
              </th>
              <th scope="col" className="px-4 py-3">
                {strings['admin.users.col.tenant']}
              </th>
              <th scope="col" className="px-4 py-3">
                Verified
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {strings['admin.users.col.created']}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {strings['admin.users.col.actions']}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => {
              const isAdmin = user.roles.includes('ADMIN');
              const isActive = user.status === 'ACTIVE';
              const isSelf = currentUserId === user.id;
              const tenantName = user.tenantId ? tenantMap.get(user.tenantId) ?? user.tenantId : null;

              return (
                <tr key={user.id} className="transition-colors hover:bg-surface-subtle/50">
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-mono text-xs font-semibold text-ink border border-line">
                        {getInitials(user.displayName, user.email)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-ink">
                          {user.displayName || user.email.split('@')[0]}
                          {isSelf && (
                            <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.2 text-[10px] font-semibold text-gold">
                              You
                            </span>
                          )}
                        </span>
                        <span className="truncate font-mono text-xs text-subtle">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                        <Shield aria-hidden className="size-3" />
                        <span>ADMIN</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-line bg-surface-subtle px-2 py-0.5 text-xs font-medium text-subtle">
                        USER
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        <span>WITHDRAWN</span>
                      </span>
                    )}
                  </td>

                  {/* Tenant */}
                  <td className="px-4 py-3">
                    {tenantName ? (
                      <span className="inline-flex items-center rounded-field bg-surface-subtle px-2 py-0.5 text-xs text-ink font-mono border border-line">
                        {tenantName}
                      </span>
                    ) : (
                      <span className="text-xs italic text-subtle">Personal</span>
                    )}
                  </td>

                  {/* Email Verified */}
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500" title="Verified">
                        <Check aria-hidden className="size-3.5" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-subtle" title="Pending verification">
                        <Clock aria-hidden className="size-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 text-right font-mono text-xs text-subtle tabular-nums">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(user)}
                        className="size-8"
                        aria-label={`Edit ${user.email}`}
                        title={strings['admin.users.edit']}
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onResetPassword(user)}
                        className="size-8 text-subtle hover:text-ink"
                        aria-label={`Reset password for ${user.email}`}
                        title={strings['admin.users.resetPassword']}
                      >
                        <KeyRound aria-hidden className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(user)}
                        disabled={isSelf}
                        className={cn('size-8 text-subtle hover:text-rose-600', isSelf && 'opacity-30 cursor-not-allowed')}
                        aria-label={`Delete ${user.email}`}
                        title={isSelf ? 'Cannot delete your own account' : strings['admin.users.delete']}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
