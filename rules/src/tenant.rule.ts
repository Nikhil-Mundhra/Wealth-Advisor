// Tenant and API key domain constants.
export const TENANT_PLANS = ['STARTER', 'INSTITUTIONAL'] as const;
export type TenantPlan = (typeof TENANT_PLANS)[number];

export const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const API_KEY_PERMISSIONS = [
  'read:analytics',
  'advisory:recommend',
  'simulate:stress-test',
  'execute:sandbox',
] as const;
export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const API_KEY_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export const API_KEY_NAME_MIN_LENGTH = 2;
export const API_KEY_NAME_MAX_LENGTH = 100;
export const API_KEY_DEFAULT_RATE_LIMIT_PER_MINUTE = 60;
export const API_KEY_DEFAULT_MONTHLY_TOKEN_QUOTA = 100_000;

export const TENANT_SLUG_MIN_LENGTH = 2;
export const TENANT_SLUG_MAX_LENGTH = 50;
export const TENANT_NAME_MIN_LENGTH = 2;
export const TENANT_NAME_MAX_LENGTH = 100;
export const TENANT_DEFAULT_MAX_MEMBERS = 50;
export const DEFAULT_ALLOWED_CORRIDORS = ['EUR_CNY', 'GBP_SGD'] as const;

export const SHARE_LINK_TTL_DEFAULT_HOURS = 72;
export const SHARE_LINK_TTL_MAX_HOURS = 720;
