import { CORE_ERROR_CODES, type CoreErrorCode } from '@wealth-advisor/rules';
import { CLIENT_ERROR_CODES, type ClientErrorCode } from '../api-error.ts';

// Text for errors any feature can hit. Feature-specific codes live in each feature's error map.
export const SHARED_ERROR_MESSAGES: Readonly<Partial<Record<CoreErrorCode | ClientErrorCode, string>>> = {
  [CORE_ERROR_CODES.validationFailed]: 'Some details are invalid. Check the form and try again.',
  [CORE_ERROR_CODES.invalidJson]: 'The request could not be read. Please try again.',
  [CORE_ERROR_CODES.databaseUnconfigured]: 'The service is temporarily unavailable. Please try again later.',
  [CLIENT_ERROR_CODES.network]: "Can't reach the server. Check your connection and try again.",
  [CLIENT_ERROR_CODES.contractMismatch]: 'This page is out of date. Refresh it and try again.',
};

export const FALLBACK_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';
