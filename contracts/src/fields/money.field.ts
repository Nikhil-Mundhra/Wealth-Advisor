import { z } from 'zod';
import { CurrencyField } from './currency.field.ts';

// Integer minor units (cents, pence; yen has none), so sums and conversions never meet binary-float rounding.
export const MoneyField = z.object({
  amount: z.number().int(),
  currency: CurrencyField,
});
export type MoneyField = z.infer<typeof MoneyField>;
