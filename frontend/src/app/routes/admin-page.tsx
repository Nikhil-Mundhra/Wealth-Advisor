import { Link } from 'react-router';
import { cardClassName } from '../../components/ui/card.tsx';
import { PageTitle } from '../../components/ui/page-title.tsx';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

// Platform overview linking the tenant, API key, and model sections.
export function AdminPage() {
  const strings = useStrings();
  const sections = [
    { to: '/admin/tenants', label: strings['admin.tenants'] },
    { to: '/admin/api-keys', label: strings['admin.apikeys'] },
    { to: '/admin/models', label: strings['admin.models'] },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.overview']}</PageTitle>
      <ul className="grid gap-3 sm:grid-cols-3">
        {sections.map((section) => (
          <li key={section.to} className={cn(cardClassName, 'transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-gold/50')}>
            <Link to={section.to} className="font-medium text-brand-600 hover:underline dark:text-brand-700">
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
