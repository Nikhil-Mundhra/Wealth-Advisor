import { Link } from 'react-router';
import { Building2, Cpu, Key, KeyRound, Users } from 'lucide-react';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Platform overview linking user accounts, tenants, API keys, and models.
export function AdminPage() {
  const strings = useStrings();
  const sections = [
    {
      to: '/admin/users',
      label: strings['admin.users'],
      description: 'Manage accounts, access roles, and permissions',
      Icon: Users,
    },
    {
      to: '/admin/credentials',
      label: 'Demo Credentials',
      description: 'Dummy accounts for 4 clients, 2 advisors, and platform operators',
      Icon: KeyRound,
    },
    {
      to: '/admin/models',
      label: strings['admin.models'],
      description: 'Configure active LLM provider, platform keys, and uptime health',
      Icon: Cpu,
    },
    {
      to: '/admin/tenants',
      label: strings['admin.tenants'],
      description: 'Configure organizations, currency baselines, and caps',
      Icon: Building2,
    },
    {
      to: '/admin/api-keys',
      label: strings['admin.apikeys'],
      description: 'Issue, audit, and revoke programmatic access keys',
      Icon: Key,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{strings['admin.overview']}</PageTitle>
        <p className="mt-1 text-xs text-subtle">System administration and platform configuration console</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map(({ to, label, description, Icon }) => (
          <li key={to} className={cn(cardClassName, 'flex flex-col justify-between transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-gold/50')}>
            <div className="flex flex-col gap-2">
              <div className="flex size-10 items-center justify-center rounded-field bg-surface-subtle text-brand-600 dark:text-brand-700">
                <Icon aria-hidden className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">
                  <Link to={to} className="hover:text-brand-600 hover:underline">
                    {label}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-subtle">{description}</p>
              </div>
            </div>
            <Link to={to} aria-label={`Open ${label}`} className="mt-4 font-medium text-xs text-brand-600 hover:underline dark:text-brand-700">
              Open console →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
