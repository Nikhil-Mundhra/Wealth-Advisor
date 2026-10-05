import { z } from 'zod';
import { CurrencyField } from '../fields/currency.field.ts';
import { IsoDateField } from '../fields/iso-date.field.ts';

// base: currency the rates are quoted against; date: latest rate on or before this day (default today, UTC).
export const FxRatesQuery = z.object({
  base: CurrencyField,
  date: IsoDateField.optional(),
});
export type FxRatesQuery = z.infer<typeof FxRatesQuery>;

// rate: units of `quote` per one unit of the response's `base`.
export const FxRate = z.object({
  quote: CurrencyField,
  rate: z.number().positive(),
  date: IsoDateField,
  source: z.string(),
});
export type FxRate = z.infer<typeof FxRate>;

// asOf is the latest stored rate date; null until the first refresh has stored any.
export const FxRatesResponse = z.object({
  asOf: IsoDateField.nullable(),
  base: CurrencyField,
  rates: z.array(FxRate),
});
export type FxRatesResponse = z.infer<typeof FxRatesResponse>;
