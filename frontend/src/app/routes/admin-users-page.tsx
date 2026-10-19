import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, KeyRound, UserPlus, Users } from 'lucide-react';
import type {
  AdminResetPasswordRequest,
  AdminUserDto,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from '@wealth-advisor/contracts';
import { Button } from '../../components/ui/button.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { Spinner } from '../../components/ui/spinner.tsx';
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  fetchTenants,
  resetAdminUserPassword,
  updateAdminUser,
} from '../../features/admin/api/admin-api.ts';
import { AdminNavTabs } from '../../features/admin/components/admin-nav-tabs.tsx';
import { CredentialsTab } from '../../features/admin/components/credentials-tab.tsx';
import { AdminCreateUserModal } from '../../features/admin/components/user-management/admin-create-user-modal.tsx';
import { AdminDeleteUserModal } from '../../features/admin/components/user-management/admin-delete-user-modal.tsx';
import { AdminEditUserModal } from '../../features/admin/components/user-management/admin-edit-user-modal.tsx';
import { AdminResetPasswordModal } from '../../features/admin/components/user-management/admin-reset-password-modal.tsx';
import { AdminUserStatCards } from '../../features/admin/components/user-management/admin-user-stat-cards.tsx';
import { AdminUsersFilters } from '../../features/admin/components/user-management/admin-users-filters.tsx';
import { AdminUsersTable } from '../../features/admin/components/user-management/admin-users-table.tsx';
import { useMe } from '../../features/auth/api/use-me.ts';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

export function AdminUsersPage() {
  const strings = useStrings();
  const queryClient = useQueryClient();
  const me = useMe();

  const [activeTab, setActiveTab] = useState<'directory' | 'credentials'>('directory');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [tenantId, setTenantId] = useState('ALL');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUserDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserDto | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: fetchTenants,
  });

  const tenants = tenantsData?.tenants ?? [];

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'users', { search, role, status, tenantId }],
    queryFn: () =>
      fetchAdminUsers({
        q: search || undefined,
        role: role !== 'ALL' ? role : undefined,
        status: status !== 'ALL' ? status : undefined,
        tenantId: tenantId !== 'ALL' ? tenantId : undefined,
      }),
  });

  const users = usersData?.users ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateAdminUserRequest) => createAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(strings['admin.users.createdSuccess']);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserRequest }) => updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(strings['admin.users.updatedSuccess']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(strings['admin.users.deletedSuccess']);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminResetPasswordRequest }) =>
      resetAdminUserPassword(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(strings['admin.users.resetSuccess']);
    },
  });

  const handleResetFilters = () => {
    setSearch('');
    setRole('ALL');
    setStatus('ALL');
    setTenantId('ALL');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-field border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200">
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle>{strings['admin.users']}</PageTitle>
          <p className="mt-1 text-xs text-subtle">{strings['admin.users.subtitle']}</p>
        </div>
        {activeTab === 'directory' && (
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <UserPlus aria-hidden className="size-4" />
            <span>{strings['admin.users.create']}</span>
          </Button>
        )}
      </div>

      <AdminNavTabs />

      {/* View Switcher: Directory vs Demo Credentials */}
      <div className="flex items-center gap-2 border-b border-line pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'directory'
              ? 'border-gold text-ink font-semibold'
              : 'border-transparent text-subtle hover:text-ink'
          )}
        >
          <Users aria-hidden className="size-3.5" />
          <span>Accounts Directory</span>
          <span className="rounded-full bg-surface-subtle px-1.5 py-0.2 text-[10px] text-subtle">
            {users.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'credentials'
              ? 'border-gold text-ink font-semibold'
              : 'border-transparent text-subtle hover:text-ink'
          )}
        >
          <KeyRound aria-hidden className="size-3.5" />
          <span>Demo Credentials</span>
          <span className="rounded-full bg-gold-subtle px-1.5 py-0.2 text-[10px] font-medium text-gold">
            7 personas
          </span>
        </button>
      </div>

      {activeTab === 'credentials' ? (
        <CredentialsTab />
      ) : (
        <>
          {/* Overview Stat Cards */}
          <AdminUserStatCards users={users} />

          {/* Search and Filters */}
          <AdminUsersFilters
            search={search}
            onSearchChange={setSearch}
            role={role}
            onRoleChange={setRole}
            status={status}
            onStatusChange={setStatus}
            tenantId={tenantId}
            onTenantIdChange={setTenantId}
            tenants={tenants}
            onReset={handleResetFilters}
          />

          {/* Content Table / Loading / Error */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading user accounts" />
            </div>
          ) : error ? (
            <div className="rounded-field border border-rose-300 bg-rose-50 p-6 text-center text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200">
              <p className="font-semibold">Failed to load user accounts.</p>
              <p className="mt-1 text-xs text-subtle">{(error as any)?.message || 'An error occurred while loading.'}</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <AdminUsersTable
              users={users}
              tenants={tenants}
              currentUserId={me.data?.id}
              onEdit={(u) => setEditingUser(u)}
              onResetPassword={(u) => setResettingUser(u)}
              onDelete={(u) => setDeletingUser(u)}
            />
          )}
        </>
      )}

      {/* Modals */}
      <AdminCreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        tenants={tenants}
      />

      <AdminEditUserModal
        user={editingUser}
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
        onSubmit={async (id, data) => {
          await updateMutation.mutateAsync({ id, data });
        }}
        tenants={tenants}
        currentUserId={me.data?.id}
      />

      <AdminResetPasswordModal
        user={resettingUser}
        open={resettingUser !== null}
        onClose={() => setResettingUser(null)}
        onSubmit={async (id, data) => {
          await resetPasswordMutation.mutateAsync({ id, data });
        }}
      />

      <AdminDeleteUserModal
        user={deletingUser}
        open={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}
