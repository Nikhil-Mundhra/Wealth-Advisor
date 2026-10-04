// Every error code the API can return. Codes are part of the API: never reused or renumbered.
// Module codes: <PREFIX>_1xxx for client errors, <PREFIX>_19xx for server errors.

export const ERROR_CODE_PREFIXES = {
  auth: 'AU',
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

export type CoreErrorCode = (typeof CORE_ERROR_CODES)[keyof typeof CORE_ERROR_CODES];
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
export type ErrorCode = CoreErrorCode | AuthErrorCode;
