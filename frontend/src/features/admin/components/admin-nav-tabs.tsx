import { Link, useLocation } from 'react-router';
import { Building2, Cpu, Key, KeyRound, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '../../../lib/cn.ts';

const ADMIN_TABS = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/credentials', label: 'Demo Credentials', Icon: KeyRound },
  { to: '/admin/models', label: 'Models & Keys', Icon: Cpu },
  { to: '/admin/tenants', label: 'Tenants', Icon: Building2 },
  { to: '/admin/api-keys', label: 'API Keys', Icon: Key },
];

export function AdminNavTabs() {
  const location = useLocation();

  return (
    <nav aria-label="Admin console navigation" className="flex items-center gap-1 overflow-x-auto border-b border-line pb-2">
      {ADMIN_TABS.map(({ to, label, Icon, exact }) => {
        const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-2 rounded-field px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-ink text-surface font-semibold dark:bg-surface-elevated dark:text-ink'
                : 'text-subtle hover:bg-surface-subtle hover:text-ink'
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
