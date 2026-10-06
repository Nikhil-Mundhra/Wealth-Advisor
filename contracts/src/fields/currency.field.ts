import { z } from 'zod';
import { CURRENCIES, VALIDATION_KEYS as K } from '@wealth-advisor/rules';

export const CurrencyField = z.enum(CURRENCIES, { error: K.currencyInvalid });
