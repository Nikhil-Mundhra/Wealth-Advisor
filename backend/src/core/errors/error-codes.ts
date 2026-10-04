// Each module owns one prefix so error codes never collide as modules are added.
export const ERROR_CODE_PREFIXES = {
  auth: 'AU',
} as const;

export const CoreErrorCodes = {
  validationFailed: 'CORE_VALIDATION_FAILED',
  invalidJson: 'CORE_INVALID_JSON',
  notFound: 'CORE_NOT_FOUND',
  internal: 'CORE_INTERNAL',
  databaseUnconfigured: 'CORE_DB_UNCONFIGURED',
} as const;
