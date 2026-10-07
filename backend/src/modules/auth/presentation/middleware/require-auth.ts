import type { Context, MiddlewareHandler } from 'hono';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '#core/db/document-id.ts';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';

export interface AuthPrincipal {
  readonly userId: string;
  // The tenant every scoped query runs under, taken from the token alone: a header cannot move a caller between
  // tenants. A token with no tenant claim resolves to the tenant the deployment runs.
  readonly tenantId: string;
  readonly roles: readonly string[];
}

declare module 'hono' {
  interface ContextVariableMap {
    principal: AuthPrincipal;
  }
}

const BEARER = 'Bearer ';

// The scope an unauthenticated caller reads: the seeded demo account, so the app is explorable without signing in.
const DEMO_SCOPE: AuthPrincipal = { userId: DEFAULT_USER_ID, tenantId: DEFAULT_TENANT_ID, roles: [] };

// Verifies the Bearer access token and exposes the caller as c.get('principal').
export function requireAuth(signer: AccessTokenSignerPort): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('authorization');
    if (!header?.startsWith(BEARER)) throw AuthErrors.unauthenticated();
    c.set('principal', toPrincipal(await signer.verify(header.slice(BEARER.length))));
    await next();
  };
}

// The demo scope for a request carrying no token. A token that is present but invalid, expired or foreign is refused
// rather than downgraded: silently serving the demo account would hide a broken session behind someone else's data.
export function optionalAuth(signer: AccessTokenSignerPort): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('authorization');
    if (!header?.startsWith(BEARER)) c.set('principal', DEMO_SCOPE);
    else c.set('principal', toPrincipal(await signer.verify(header.slice(BEARER.length))));
    await next();
  };
}

function toPrincipal(claims: {
  readonly subject: string;
  readonly roles: readonly string[];
  readonly tenantId: string | null;
}): AuthPrincipal {
  return { userId: claims.subject, tenantId: claims.tenantId ?? DEFAULT_TENANT_ID, roles: claims.roles };
}

export function getPrincipal(c: Context): AuthPrincipal {
  const principal = c.get('principal');
  if (!principal) throw AuthErrors.unauthenticated();
  return principal;
}
