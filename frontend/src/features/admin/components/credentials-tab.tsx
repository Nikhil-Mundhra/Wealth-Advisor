import { useState } from 'react';
import { Link } from 'react-router';
import {
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { cardClassName } from '../../../components/ui/card.tsx';
import { cn } from '../../../lib/cn.ts';

export interface DemoPersona {
  id: string;
  category: 'ADMIN' | 'ADVISOR' | 'CLIENT';
  name: string;
  email: string;
  password: string;
  roleBadge: string;
  badgeTone: 'gold' | 'blue' | 'purple' | 'slate';
  loginPath: string;
  description: string;
  connectedAdvisor?: string;
  portfolioSummary?: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  // Platform Administrator
  {
    id: 'admin-1',
    category: 'ADMIN',
    name: 'Platform Operator',
    email: 'Shenzhen@Fintechathon.com',
    password: '12345678987654321',
    roleBadge: 'Platform Admin',
    badgeTone: 'purple',
    loginPath: '/admin/login',
    description: 'Full supervisory authority over tenants, platform LLM keys, and user privileges',
  },
  // Wealth Analysts / Advisors (2)
  {
    id: 'advisor-1',
    category: 'ADVISOR',
    name: 'Alex Morgan',
    email: 'advisor.morgan@syntropy.ch',
    password: 'AdvisorPass123!',
    roleBadge: 'Senior Wealth Partner',
    badgeTone: 'gold',
    loginPath: '/advisor/login',
    description: 'Global Nomads Wealth - Manages cross-border clients (Elena Vance & Marcus Vance)',
  },
  {
    id: 'advisor-2',
    category: 'ADVISOR',
    name: 'Sarah Jenkins',
    email: 'advisor.jenkins@syntropy.ch',
    password: 'AdvisorPass123!',
    roleBadge: 'Institutional Analyst',
    badgeTone: 'gold',
    loginPath: '/advisor/login',
    description: 'Zurich Private Advisory - Manages APAC & High-Growth tech portfolios (Mei-Ling Chen)',
  },
  // End Clients (4)
  {
    id: 'client-1',
    category: 'CLIENT',
    name: 'Elena Vance',
    email: 'testing@example.com',
    password: 'testing',
    roleBadge: 'Private Client',
    badgeTone: 'blue',
    loginPath: '/login',
    description: 'Expat in Zurich & Singapore with complex cross-border liabilities',
    connectedAdvisor: 'Alex Morgan (Global Nomads Wealth)',
    portfolioSummary: 'EUR 9.5M Diversified Portfolio (S&P 500, Corporate Bonds, Cash MMF)',
  },
  {
    id: 'client-2',
    category: 'CLIENT',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    password: 'ClientPass123!',
    roleBadge: 'Private Client',
    badgeTone: 'blue',
    loginPath: '/login',
    description: 'Cross-border family office client focused on global capital preservation',
    connectedAdvisor: 'Alex Morgan (Global Nomads Wealth)',
    portfolioSummary: 'EUR 3.25M Balanced Growth Portfolio (FTSE All-World & Bond Allocation)',
  },
  {
    id: 'client-3',
    category: 'CLIENT',
    name: 'Mei-Ling Chen',
    email: 'meiling.chen@example.com',
    password: 'ClientPass123!',
    roleBadge: 'Private Client',
    badgeTone: 'blue',
    loginPath: '/login',
    description: 'APAC venture founder with multi-currency USD/CNY/HKD cashflow needs',
    connectedAdvisor: 'Sarah Jenkins (Zurich Private Advisory)',
    portfolioSummary: 'USD 4.80M High-Growth Equities & Liquid Cash Buffer',
  },
  {
    id: 'client-4',
    category: 'CLIENT',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    password: 'ClientPass123!',
    roleBadge: 'Direct Client',
    badgeTone: 'slate',
    loginPath: '/login',
    description: 'Direct self-directed investor evaluating advisor collaboration and private models',
    connectedAdvisor: 'None (Direct / Self-directed Account)',
    portfolioSummary: 'EUR 1.15M Conservative Fixed Income & Overnight MMF',
  },
];

export function CredentialsTab() {
  const [filter, setFilter] = useState<'ALL' | 'ADMIN' | 'ADVISOR' | 'CLIENT'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const filteredPersonas = DEMO_PERSONAS.filter((p) => {
    if (filter === 'ALL') return true;
    return p.category === filter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Informational Hero Card */}
      <div className={cn(cardClassName, 'flex flex-col gap-4 border-l-4 border-l-gold bg-surface-subtle/50')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden className="size-4 text-gold" />
              <h3 className="font-semibold text-ink text-sm">Demo Persona Credentials Directory</h3>
            </div>
            <p className="text-xs text-subtle max-w-2xl leading-relaxed">
              Use these pre-seeded accounts to experience each persona across the platform. You can copy the credentials directly or click the portal launch button to test the specific login flow.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-1.5 text-xs text-subtle">
            <KeyRound aria-hidden className="size-3.5 text-gold" />
            <span className="font-medium text-ink">{DEMO_PERSONAS.length} Total Personas</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/50">
          {(
            [
              { id: 'ALL', label: 'All Accounts', count: DEMO_PERSONAS.length },
              { id: 'ADMIN', label: 'Administrators (1)', count: 1 },
              { id: 'ADVISOR', label: 'Wealth Analysts (2)', count: 2 },
              { id: 'CLIENT', label: 'End Clients (4)', count: 4 },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === tab.id
                  ? 'bg-ink text-surface dark:bg-surface-elevated dark:text-ink'
                  : 'bg-surface text-subtle hover:text-ink border border-line'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Personas Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPersonas.map((persona) => {
          const emailCopied = copiedKey === `email-${persona.id}`;
          const passCopied = copiedKey === `pass-${persona.id}`;

          return (
            <div
              key={persona.id}
              className={cn(
                cardClassName,
                'flex flex-col justify-between gap-4 transition-all hover:border-gold/60 motion-safe:hover:-translate-y-0.5'
              )}
            >
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full',
                        persona.category === 'ADMIN' && 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
                        persona.category === 'ADVISOR' && 'bg-gold-subtle text-gold',
                        persona.category === 'CLIENT' && 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-700'
                      )}
                    >
                      {persona.category === 'ADMIN' && <Shield aria-hidden className="size-4" />}
                      {persona.category === 'ADVISOR' && <Briefcase aria-hidden className="size-4" />}
                      {persona.category === 'CLIENT' && <User aria-hidden className="size-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink text-sm leading-tight">{persona.name}</h4>
                      <span className="text-[11px] font-medium text-subtle">{persona.roleBadge}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                      persona.badgeTone === 'purple' && 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
                      persona.badgeTone === 'gold' && 'bg-gold-subtle text-gold',
                      persona.badgeTone === 'blue' && 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-700',
                      persona.badgeTone === 'slate' && 'bg-surface-subtle text-subtle border border-line'
                    )}
                  >
                    {persona.category}
                  </span>
                </div>

                <p className="text-xs text-subtle leading-relaxed mt-1">{persona.description}</p>

                {persona.connectedAdvisor && (
                  <div className="rounded bg-surface-subtle/70 px-2.5 py-1.5 text-[11px] text-subtle">
                    <span className="font-medium text-ink">Advisor:</span> {persona.connectedAdvisor}
                  </div>
                )}

                {persona.portfolioSummary && (
                  <div className="rounded bg-surface-subtle/70 px-2.5 py-1.5 text-[11px] text-subtle">
                    <span className="font-medium text-ink">Book:</span> {persona.portfolioSummary}
                  </div>
                )}
              </div>

              {/* Credential Fields */}
              <div className="flex flex-col gap-2 pt-3 border-t border-line/60">
                {/* Email Field */}
                <div className="flex items-center justify-between gap-2 rounded bg-surface px-2.5 py-1.5 border border-line text-xs font-mono">
                  <span className="truncate text-ink text-[12px]">{persona.email}</span>
                  <button
                    type="button"
                    aria-label={`Copy email for ${persona.name}`}
                    onClick={() => handleCopy(persona.email, `email-${persona.id}`)}
                    className="flex items-center gap-1 text-[11px] font-sans text-subtle hover:text-ink shrink-0 transition-colors"
                  >
                    {emailCopied ? (
                      <>
                        <Check aria-hidden className="size-3 text-positive" />
                        <span className="text-positive text-[10px] font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden className="size-3" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Password Field */}
                <div className="flex items-center justify-between gap-2 rounded bg-surface px-2.5 py-1.5 border border-line text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <Lock aria-hidden="true" className="size-3 text-subtle shrink-0" />
                    <span className="text-ink text-[12px] truncate">{persona.password}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Copy password for ${persona.name}`}
                    onClick={() => handleCopy(persona.password, `pass-${persona.id}`)}
                    className="flex items-center gap-1 text-[11px] font-sans text-subtle hover:text-ink shrink-0 transition-colors"
                  >
                    {passCopied ? (
                      <>
                        <Check aria-hidden className="size-3 text-positive" />
                        <span className="text-positive text-[10px] font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden className="size-3" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Portal Link */}
                <Link
                  to={persona.loginPath}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded bg-surface-subtle hover:bg-surface py-2 text-xs font-medium text-ink transition-colors border border-line"
                >
                  <span>Open {persona.loginPath}</span>
                  <ExternalLink aria-hidden className="size-3.5 text-subtle" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
