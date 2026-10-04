import { z } from 'zod';
import { CLIENT_TYPES, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const ClientTypeField = z.enum(CLIENT_TYPES, { error: K.clientTypeInvalid });
