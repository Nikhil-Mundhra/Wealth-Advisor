import { Building2, Shield, UserCheck, Users } from 'lucide-react';
import type { AdminUserDto } from '@wealth-advisor/contracts';
import { cardClassName } from '../../../../components/ui/card.tsx';
import { cn } from '../../../../lib/cn.ts';
import { useStrings } from '../../../../lib/dictionaries.ts';

interface AdminUserStatCardsProps {
  users: AdminUserDto[];
}

export function AdminUserStatCards({ users }: AdminUserStatCardsProps) {
  const strings = useStrings();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const adminUsers = users.filter((u) => u.roles.includes('ADMIN')).length;
  const tenantUsers = users.filter((u) => Boolean(u.tenantId)).length;

  const stats = [
    {
      label: strings['admin.users.stats.total'],
      value: totalUsers,
      Icon: Users,
      iconColor: 'text-brand-600 dark:text-brand-700',
    },
    {
      label: strings['admin.users.stats.active'],
      value: activeUsers,
      Icon: UserCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-500',
    },
    {
      label: strings['admin.users.stats.admins'],
      value: adminUsers,
      Icon: Shield,
      iconColor: 'text-gold',
    },
    {
      label: strings['admin.users.stats.tenants'],
      value: tenantUsers,
      Icon: Building2,
      iconColor: 'text-subtle',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, Icon, iconColor }) => (
        <div key={label} className={cn(cardClassName, 'flex items-center justify-between p-4')}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-subtle">{label}</span>
            <span className="font-serif text-2xl font-bold tracking-tight text-ink font-mono tabular-nums">
              {value}
            </span>
          </div>
          <div className="flex size-10 items-center justify-center rounded-field bg-surface-subtle">
            <Icon aria-hidden className={cn('size-5', iconColor)} />
          </div>
        </div>
      ))}
    </div>
  );
}
