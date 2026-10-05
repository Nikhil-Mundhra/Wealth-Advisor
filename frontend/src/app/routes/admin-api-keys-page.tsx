import { PageTitle } from '../../components/ui/page-title.tsx';
import { useStrings } from '../../lib/dictionaries.ts';

// Scoped API key issuance lands with the Phase 2 tenant module.
export function AdminApiKeysPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{strings['admin.apikeys']}</PageTitle>
      <p className="text-sm text-subtle">{strings['admin.none']}</p>
    </div>
  );
}
