import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { createPasskeyService, MemoryPasskeyStore, MongoPasskeyStore } from '#core/crypto/passkey-verifier.ts';
import type { ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { createAdminModule } from './admin/admin.module.ts';
import { createAnalyticsModule } from './analytics/analytics.module.ts';
import { createAuthModule } from './auth/auth.module.ts';
import { createAdvisoryModule } from './advisory/advisory.module.ts';
import { createFinanceModule } from './finance/finance.module.ts';
import { createMarketModule } from './market/market.module.ts';
import { createSharingModule } from './sharing/sharing.module.ts';
import { createWealthModule } from './wealth/wealth.module.ts';

// Explicit module list. Static imports keep every module visible to Vercel's bundler; add new modules here.
// A module is built before the modules that receive its api (market before analytics).
export function buildModules(context: ModuleContext): ModuleManifest[] {
  const store = resolveDataStore(env());
  const passkeyStore = store === 'memory' ? new MemoryPasskeyStore() : new MongoPasskeyStore(context.db);
  const passkeyService = createPasskeyService(passkeyStore);

  const sharedUserDocs = new Map<string, any>();
  let wealthApiRef: any = null;
  let financeApiRef: any = null;

  const auth = createAuthModule(context, {
    sharedUserDocs,
    passkeys: passkeyService,
    getClientMetrics: async (tenantId, clientUserIds) => {
      const map = new Map<string, { totalValuationBase: number; currency: string; runwayMonths: number; riskBand: string }>();
      for (const clientId of clientUserIds) {
        try {
          if (wealthApiRef) {
            const portfolio = await wealthApiRef.getPortfolio(tenantId, clientId);
            const cashflow = financeApiRef ? await financeApiRef.getCashflow(tenantId, clientId, 'FAMILY_HOUSEHOLD').catch(() => null) : null;
            const score = portfolio.effectiveRiskScore ?? 6.0;
            const riskBand = score >= 8 ? 'AGGRESSIVE' : score >= 5 ? 'BALANCED' : 'CONSERVATIVE';
            map.set(clientId, {
              totalValuationBase: portfolio.totalValuationBase,
              currency: portfolio.baseCurrency,
              runwayMonths: cashflow?.runwayMonths ?? 12.0,
              riskBand,
            });
          }
        } catch {
          // Client has not created portfolio yet
        }
      }
      return map;
    },
  });
  const admin = createAdminModule(context, {
    auth: auth.authGuard,
    hasher: auth.hasher,
    sharedUserDocs,
  });
  const market = createMarketModule(context, {
    getAccessKey: () => admin.api.getPlatformKey('marketstack'),
  });
  const analytics = createAnalyticsModule(context, market.api);
  const finance = createFinanceModule(context, {
    market: market.api,
    auth: auth.optionalAuthGuard,
    writeAuth: auth.authGuard,
  });
  financeApiRef = finance.api;

  const wealth = createWealthModule(context, {
    analytics: analytics.api,
    auth: auth.optionalAuthGuard,
    writeAuth: auth.authGuard,
    passkeys: passkeyService,
  });
  wealthApiRef = wealth.api;
  const advisory = createAdvisoryModule(context, {
    finance: finance.api,
    wealth: wealth.api,
    getActiveProvider: () => admin.api.getActiveProvider(),
    getPlatformKeys: () => admin.api.getPlatformKeys(),
    auth: auth.optionalAuthGuard,
  });
  const sharing = createSharingModule(context, { wealth: wealth.api, writeAuth: auth.authGuard });

  return [
    auth.manifest,
    market.manifest,
    analytics.manifest,
    admin.manifest,
    finance.manifest,
    wealth.manifest,
    advisory.manifest,
    sharing.manifest,
  ];
}

