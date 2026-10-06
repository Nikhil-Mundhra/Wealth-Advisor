// Every error code the API can return. Codes are part of the API: never reused or renumbered.
// Module codes: <PREFIX>_1xxx for client errors, <PREFIX>_19xx for server errors.

export const ERROR_CODE_PREFIXES = {
  auth: 'AU',
  market: 'MK',
  analytics: 'AN',
  admin: 'AD',
  finance: 'FN',
  wealth: 'WL',
  advisory: 'AV',
  sharing: 'SH',
} as const;

export const CORE_ERROR_CODES = {
  validationFailed: 'CORE_VALIDATION_FAILED',
  invalidJson: 'CORE_INVALID_JSON',
  notFound: 'CORE_NOT_FOUND',
  internal: 'CORE_INTERNAL',
  databaseUnconfigured: 'CORE_DB_UNCONFIGURED',
} as const;

export const AUTH_ERROR_CODES = {
  emailTaken: 'AU_1001',
  invalidCredentials: 'AU_1002',
  invalidRefreshToken: 'AU_1003',
  alreadyRotated: 'AU_1004',
  unauthenticated: 'AU_1005',
  invalidEmail: 'AU_1006',
  weakPassword: 'AU_1007',
  passkeyFailed: 'AU_1008',
  invariantViolated: 'AU_1900',
  signingKeysMissing: 'AU_1901',
} as const;

export const MARKET_ERROR_CODES = {
  cronUnauthorized: 'MK_1001',
  invariantViolated: 'MK_1900',
  providerUnavailable: 'MK_1901',
  providerQuotaSpent: 'MK_1902',
  providerNotConfigured: 'MK_1903',
} as const;

export const ANALYTICS_ERROR_CODES = {
  noSnapshot: 'AN_1001',
  invariantViolated: 'AN_1900',
} as const;

export const ADMIN_ERROR_CODES = {
  tenantNotFound: 'AD_1001',
  apiKeyNotFound: 'AD_1002',
  slugTaken: 'AD_1003',
  unauthorized: 'AD_1004',
  invalidProvider: 'AD_1005',
  invariantViolated: 'AD_1900',
} as const;

export const FINANCE_ERROR_CODES = {
  accountNotFound: 'FN_1001',
  unsupportedCurrency: 'FN_1002',
  invariantViolated: 'FN_1900',
} as const;

export const WEALTH_ERROR_CODES = {
  portfolioNotFound: 'WL_1001',
  productNotFound: 'WL_1002',
  passkeyRequired: 'WL_1003',
  passkeyInvalid: 'WL_1004',
  invariantViolated: 'WL_1900',
} as const;

export const ADVISORY_ERROR_CODES = {
  gatewayUnavailable: 'AV_1001',
  unsupportedModel: 'AV_1002',
  invariantViolated: 'AV_1900',
} as const;

export const SHARING_ERROR_CODES = {
  planNotFound: 'SH_1001',
  planExpired: 'SH_1002',
  invariantViolated: 'SH_1900',
} as const;

export type CoreErrorCode = (typeof CORE_ERROR_CODES)[keyof typeof CORE_ERROR_CODES];
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
export type MarketErrorCode = (typeof MARKET_ERROR_CODES)[keyof typeof MARKET_ERROR_CODES];
export type AnalyticsErrorCode = (typeof ANALYTICS_ERROR_CODES)[keyof typeof ANALYTICS_ERROR_CODES];
export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[keyof typeof ADMIN_ERROR_CODES];
export type FinanceErrorCode = (typeof FINANCE_ERROR_CODES)[keyof typeof FINANCE_ERROR_CODES];
export type WealthErrorCode = (typeof WEALTH_ERROR_CODES)[keyof typeof WEALTH_ERROR_CODES];
export type AdvisoryErrorCode = (typeof ADVISORY_ERROR_CODES)[keyof typeof ADVISORY_ERROR_CODES];
export type SharingErrorCode = (typeof SHARING_ERROR_CODES)[keyof typeof SHARING_ERROR_CODES];
export type ErrorCode =
  | CoreErrorCode
  | AuthErrorCode
  | MarketErrorCode
  | AnalyticsErrorCode
  | AdminErrorCode
  | FinanceErrorCode
  | WealthErrorCode
  | AdvisoryErrorCode
  | SharingErrorCode;
