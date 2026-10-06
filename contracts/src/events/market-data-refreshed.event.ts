import { z } from 'zod';
import { CurrencyField } from '../fields/currency.field.ts';
import { IsoDateField } from '../fields/iso-date.field.ts';

export const MARKET_DATA_REFRESHED = { type: 'market.data_refreshed', version: 1 } as const;

// Version 1 payload. A breaking change ships as a new version beside this one; this shape never changes.
export const MarketDataRefreshedPayload = z.object({
  asOf: IsoDateField,
  symbols: z.array(z.string().min(1)),
  fxBase: CurrencyField,
});
export type MarketDataRefreshedPayload = z.infer<typeof MarketDataRefreshedPayload>;
