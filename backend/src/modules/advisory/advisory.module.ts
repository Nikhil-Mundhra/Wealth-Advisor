import { ERROR_CODE_PREFIXES, type LlmProvider } from '@wealth-advisor/rules';
import { defineModule, type ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import type { FinanceApi } from '../finance/public.ts';
import type { WealthApi } from '../wealth/public.ts';
import { createAdvisoryApi, type AdvisoryApi } from './advisory.api.ts';
import { LlmGateway } from './domain/llm-gateway.ts';
import { ADVISORY_ERROR_STATUSES } from './presentation/advisory-error-statuses.ts';
import { advisoryRoutes } from './presentation/routes/advisory.routes.ts';

import { env } from '#core/config/env.ts';
import type { MiddlewareHandler } from 'hono';

export interface AdvisoryModuleDeps {
  finance: FinanceApi;
  wealth: WealthApi;
  getActiveProvider?: () => Promise<LlmProvider>;
  auth?: MiddlewareHandler;
}

export function createAdvisoryModule(
  _context: ModuleContext,
  deps: AdvisoryModuleDeps,
): { manifest: ModuleManifest; api: AdvisoryApi } {
  const geminiApiKey = env().GEMINI_API_KEY;
  const gateway = new LlmGateway(geminiApiKey);
  const api = createAdvisoryApi({
    finance: deps.finance,
    wealth: deps.wealth,
    gateway,
    getActiveProvider: deps.getActiveProvider,
  });

  const manifest = defineModule({
    name: 'advisory',
    basePath: '/advisory',
    errors: { prefix: ERROR_CODE_PREFIXES.advisory, statuses: ADVISORY_ERROR_STATUSES },
    routes: advisoryRoutes(api, deps.auth),
  });

  return { manifest, api };
}
