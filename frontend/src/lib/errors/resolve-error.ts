import type { ErrorCode } from '@wealth-advisor/rules';
import { ApiError } from '../api-error.ts';
import { FALLBACK_ERROR_MESSAGE, SHARED_ERROR_MESSAGES } from './shared-error-messages.ts';

export interface ErrorView<Field extends string = string> {
  readonly message: string;
  readonly field?: Field;
}

// A feature's text for its own codes, and the form field each one belongs under.
export type ErrorMessageMap<Field extends string> = Readonly<Partial<Record<ErrorCode, ErrorView<Field>>>>;

// Lookup order: the feature's map, then the shared map, then a generic fallback.
export function resolveError<Field extends string>(error: unknown, featureMessages: ErrorMessageMap<Field>): ErrorView<Field> {
  if (error instanceof ApiError) {
    const own = featureMessages[error.code as ErrorCode];
    if (own) return own;
    const shared = SHARED_ERROR_MESSAGES[error.code as keyof typeof SHARED_ERROR_MESSAGES];
    if (shared) return { message: shared };
  }
  return { message: FALLBACK_ERROR_MESSAGE };
}
