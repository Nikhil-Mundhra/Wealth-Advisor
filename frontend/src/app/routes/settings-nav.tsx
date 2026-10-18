import { NavLink } from 'react-router';
import { cn } from '../../lib/cn.ts';
import { useStrings } from '../../lib/dictionaries.ts';

export function SettingsNav() {
  const strings = useStrings();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'border-brand-600 text-ink dark:border-brand-700'
        : 'border-transparent text-subtle hover:border-line hover:text-ink',
    );

  return (
    <nav aria-label={strings['header.settings']} className="flex gap-2 border-b border-line">
      <NavLink to="/settings/security" className={linkClass}>
        {strings['settings.security']}
      </NavLink>
      <NavLink to="/settings/ledger" className={linkClass}>
        {strings['settings.ledger']}
      </NavLink>
    </nav>
  );
}
