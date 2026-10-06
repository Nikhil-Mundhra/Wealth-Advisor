import { z } from 'zod';
import { IsoDateField } from '../fields/iso-date.field.ts';

// from..to is the requested provider range (inclusive); the stored counts exclude facts that were already stored.
// asOf is the latest stored price date after the refresh, the date the published event carries.
export const RefreshResponse = z.object({
  asOf: IsoDateField,
  pricesStored: z.number().int().nonnegative(),
  ratesStored: z.number().int().nonnegative(),
  from: IsoDateField,
  to: IsoDateField,
});
export type RefreshResponse = z.infer<typeof RefreshResponse>;
