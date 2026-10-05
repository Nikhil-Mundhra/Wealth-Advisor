// Every error code the API can return. Codes are part of the API: never reused or renumbered.
// Module codes: <PREFIX>_1xxx for client errors, <PREFIX>_19xx for server errors.

export const ERROR_CODE_PREFIXES = {
  auth: 'AU',
  market: 'MK',
  analytics: 'AN',
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
} as const;

export type CoreErrorCode = (typeof CORE_ERROR_CODES)[keyof typeof CORE_ERROR_CODES];
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
export type MarketErrorCode = (typeof MARKET_ERROR_CODES)[keyof typeof MARKET_ERROR_CODES];
export type AnalyticsErrorCode = (typeof ANALYTICS_ERROR_CODES)[keyof typeof ANALYTICS_ERROR_CODES];
export type ErrorCode = CoreErrorCode | AuthErrorCode | MarketErrorCode | AnalyticsErrorCode;
