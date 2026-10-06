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
