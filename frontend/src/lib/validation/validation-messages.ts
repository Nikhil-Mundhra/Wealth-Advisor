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
  'household_mode.invalid': 'Choose individual or family household.',
  'refresh_token.invalid': 'Your session has expired. Please sign in again.',
  'currency.invalid': 'Choose a supported currency.',
  'date.invalid': 'Enter a date as YYYY-MM-DD.',
  'profiling.age_invalid': 'Enter an age between 18 and 100.',
  'profiling.residence_required': 'Select your primary country of residence.',
  'profiling.psychology_required': 'Select at least one risk preference.',
  'profiling.instruments_required': 'Select at least one investment type.',
  'profiling.stress_required': 'Select how you would react to a market drop.',
  'profiling.amount_negative': 'Amount cannot be negative.',
};

// Field errors hold either a validation key (client or server) or text already resolved from an error code.
export function toFieldMessage(keyOrText: string | undefined): string | undefined {
  if (!keyOrText) return undefined;
  return isValidationKey(keyOrText) ? VALIDATION_MESSAGES[keyOrText] : keyOrText;
}
