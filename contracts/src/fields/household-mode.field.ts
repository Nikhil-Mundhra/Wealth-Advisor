import { z } from 'zod';
import { HOUSEHOLD_MODES, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const HouseholdModeField = z.enum(HOUSEHOLD_MODES, { error: K.householdModeInvalid });
