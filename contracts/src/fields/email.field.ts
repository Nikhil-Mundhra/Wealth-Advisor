import { z } from 'zod';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

// New or changed email: normalized, then format-checked with the shared pattern.
export const EmailField = z
  .string({ error: K.emailRequired })
  .trim()
  .toLowerCase()
  .min(1, { error: K.emailRequired })
  .max(EMAIL_MAX_LENGTH, { error: K.emailTooLong })
  .regex(EMAIL_PATTERN, { error: K.emailInvalid });

// Login email: not format-checked on purpose, so a malformed email is just another failed login.
export const LoginEmailField = z
  .string({ error: K.emailRequired })
  .trim()
  .min(1, { error: K.emailRequired })
  .max(EMAIL_MAX_LENGTH, { error: K.emailTooLong });
