import {
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidationKey,
  type ValidationKey,
} from '@wealth-advisor/rules';

// The only place field validation text lives. Typed as a full Record, so a new key without text fails typecheck.
export const VALIDATION_MESSAGES: Readonly<Record<ValidationKey, string>> = {
  'email.required': 'Enter your email address.',
  'email.invalid': 'Enter a valid email address.',
  'email.too_long': `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`,
  'password.required': 'Enter your password.',
  'password.too_short': `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  'password.too_long': `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`,
  'display_name.required': 'Enter a display name.',
  'display_name.too_long': `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
  'client_type.invalid': 'This app version is not supported.',
  'refresh_token.invalid': 'Your session has expired. Please sign in again.',
};

// Field errors hold either a validation key (client or server) or text already resolved from an error code.
export function toFieldMessage(keyOrText: string | undefined): string | undefined {
  if (!keyOrText) return undefined;
  return isValidationKey(keyOrText) ? VALIDATION_MESSAGES[keyOrText] : keyOrText;
}
