import { useStrings } from '../../lib/dictionaries.ts';

// Tenant provisioning lands with the Phase 2 tenant module.
export function AdminTenantsPage() {
  const strings = useStrings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{strings['admin.tenants']}</h1>
      <p className="text-sm text-subtle">{strings['admin.none']}</p>
    </div>
  );
}
