import type { MiddlewareHandler } from 'hono';
import { ADMIN_ROLE } from '@wealth-advisor/rules';
import { AdminErrors } from '../../domain/errors/admin-errors.ts';

// Runs after the auth guard has set the principal; the role comes from the verified token.
export const requireAdminRole: MiddlewareHandler = async (c, next) => {
  if (!c.get('principal').roles.includes(ADMIN_ROLE)) throw AdminErrors.unauthorized();
  await next();
};
