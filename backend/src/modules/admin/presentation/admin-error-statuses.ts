import { ADMIN_ERROR_CODES, type AdminErrorCode } from '@wealth-advisor/rules';

export const ADMIN_ERROR_STATUSES: Readonly<Record<AdminErrorCode, number>> = {
  [ADMIN_ERROR_CODES.tenantNotFound]: 404,
  [ADMIN_ERROR_CODES.apiKeyNotFound]: 404,
  [ADMIN_ERROR_CODES.slugTaken]: 409,
  [ADMIN_ERROR_CODES.unauthorized]: 403,
  [ADMIN_ERROR_CODES.invalidProvider]: 400,
  [ADMIN_ERROR_CODES.invariantViolated]: 500,
};
