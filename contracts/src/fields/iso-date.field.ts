import { z } from 'zod';
import { VALIDATION_KEYS as K } from '@wealth-advisor/rules';

// Calendar date as YYYY-MM-DD; market facts are end-of-day, so they carry no time or zone.
export const IsoDateField = z.iso.date({ error: K.dateInvalid });
