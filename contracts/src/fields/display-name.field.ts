import { z } from 'zod';
import { DISPLAY_NAME_MAX_LENGTH, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const DisplayNameField = z
  .string({ error: K.displayNameRequired })
  .trim()
  .min(1, { error: K.displayNameRequired })
  .max(DISPLAY_NAME_MAX_LENGTH, { error: K.displayNameTooLong });
