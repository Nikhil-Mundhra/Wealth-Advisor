import { z } from 'zod';
import { CURRENCIES } from '@wealth-advisor/rules';

export const CurrencyField = z.enum(CURRENCIES);
