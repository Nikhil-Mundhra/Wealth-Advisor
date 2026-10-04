import { AUTH_ERROR_CODES as C, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@wealth-advisor/rules';
import type { ErrorMessageMap } from '../../../lib/errors/resolve-error.ts';
import { VALIDATION_MESSAGES } from '../../../lib/validation/validation-messages.ts';

export type AuthField = 'email' | 'password';

// User text for auth codes a form can receive, and the field each belongs under. Codes not listed here fall back
// to the shared map (lib/errors).
export const AUTH_ERROR_MESSAGES: ErrorMessageMap<AuthField> = {
  [C.emailTaken]: { field: 'email', message: 'An account with this email already exists.' },
  [C.invalidCredentials]: { message: 'Email or password is incorrect.' },
  [C.invalidEmail]: { field: 'email', message: VALIDATION_MESSAGES['email.invalid'] },
  [C.weakPassword]: { field: 'password', message: `Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.` },
  [C.invalidRefreshToken]: { message: VALIDATION_MESSAGES['refresh_token.invalid'] },
};
