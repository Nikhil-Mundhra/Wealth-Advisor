import { Filter, RotateCcw, Search } from 'lucide-react';
import type { TenantDto } from '@wealth-advisor/contracts';
import { ROLES, USER_STATUSES } from '@wealth-advisor/rules';
import { Button } from '../../../../components/ui/button.tsx';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminUsersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  tenantId: string;
  onTenantIdChange: (value: string) => void;
  tenants: TenantDto[];
  onReset: () => void;
}

export function AdminUsersFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  tenantId,
  onTenantIdChange,
  tenants,
  onReset,
}: AdminUsersFiltersProps) {
  const strings = useStrings();
  const hasActiveFilters = search !== '' || role !== 'ALL' || status !== 'ALL' || tenantId !== 'ALL';

  return (
    <div className="flex flex-col gap-3 rounded-field border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={strings['admin.users.search']}
          aria-label={strings['admin.users.search']}
          className="h-10 w-full rounded-field border border-line bg-surface-subtle pl-9 pr-3 text-sm text-ink placeholder:text-subtle transition-colors focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-subtle">
          <Filter aria-hidden className="size-3.5" />
          <span>Filters:</span>
        </div>

        {/* Role filter */}
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          aria-label="Filter by role"
          className="h-10 rounded-field border border-line bg-surface px-2.5 text-xs text-ink transition-colors focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="ALL">{strings['admin.users.filter.role']}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
          className="h-10 rounded-field border border-line bg-surface px-2.5 text-xs text-ink transition-colors focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="ALL">{strings['admin.users.filter.status']}</option>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Tenant filter */}
        {tenants.length > 0 && (
          <select
            value={tenantId}
            onChange={(e) => onTenantIdChange(e.target.value)}
            aria-label="Filter by tenant"
            className="h-10 rounded-field border border-line bg-surface px-2.5 text-xs text-ink transition-colors focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          >
            <option value="ALL">{strings['admin.users.filter.tenant']}</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-10 gap-1.5 px-2.5 text-xs text-subtle hover:text-ink"
            aria-label="Reset filters"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
