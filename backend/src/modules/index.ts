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
  const auth = createAuthModule(context);
  const market = createMarketModule(context);
  const analytics = createAnalyticsModule(context, market.api);
  const admin = createAdminModule(context, { auth: auth.authGuard });
  const finance = createFinanceModule(context, { market: market.api, auth: auth.optionalAuthGuard });
  const wealth = createWealthModule(context, { analytics: analytics.api, auth: auth.optionalAuthGuard });
  const advisory = createAdvisoryModule(context, {
    finance: finance.api,
    wealth: wealth.api,
    getActiveProvider: () => admin.api.getActiveProvider(),
    auth: auth.optionalAuthGuard,
  });
  const sharing = createSharingModule(context);

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

