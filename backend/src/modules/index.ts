import type { ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { createAuthModule } from './auth/auth.module.ts';
import { createMarketModule } from './market/market.module.ts';

// Explicit module list. Static imports keep every module visible to Vercel's bundler; add new modules here.
// A module is built before the modules that receive its api (market before analytics).
export function buildModules(context: ModuleContext): ModuleManifest[] {
  const market = createMarketModule(context);
  return [createAuthModule(context), market.manifest];
}
