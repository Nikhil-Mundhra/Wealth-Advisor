import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const NewPasswordField = z
  .string({ error: K.passwordRequired })
  .min(1, { error: K.passwordRequired })
  .min(PASSWORD_MIN_LENGTH, { error: K.passwordTooShort })
  .max(PASSWORD_MAX_LENGTH, { error: K.passwordTooLong });

// Login password: only presence and the upper bound, never the policy (no hints to an attacker).
export const LoginPasswordField = z
  .string({ error: K.passwordRequired })
  .min(1, { error: K.passwordRequired })
  .max(PASSWORD_MAX_LENGTH, { error: K.passwordTooLong });
