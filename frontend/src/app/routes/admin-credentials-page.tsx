import { PageTitle } from '../../components/ui/page-title.tsx';
import { CredentialsTab } from '../../features/admin/components/credentials-tab.tsx';

export function AdminCredentialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>Demo Personas & Credentials</PageTitle>
        <p className="mt-1 text-xs text-subtle">
          Quick-access credentials for testing the multi-persona B2B2C workflow (Admins, Wealth Advisors, and Clients).
        </p>
      </div>

      <CredentialsTab />
    </div>
  );
}
