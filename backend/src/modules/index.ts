import type { ModuleManifest } from '#core/module/define-module.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { createAuthModule } from './auth/auth.module.ts';

// Explicit module list. Static imports keep every module visible to Vercel's bundler; add new modules here.
export function buildModules(context: ModuleContext): ModuleManifest[] {
  return [createAuthModule(context)];
}
