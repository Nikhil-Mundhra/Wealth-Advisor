import { z } from 'zod';
import { ASSET_CLASSES } from '@wealth-advisor/rules';
import { IsoDateField } from '../fields/iso-date.field.ts';
import { MoneyField } from '../fields/money.field.ts';

export const MarketQuote = z.object({
  symbol: z.string(),
  assetClass: z.enum(ASSET_CLASSES),
  date: IsoDateField,
  close: MoneyField,
  source: z.string(),
});
export type MarketQuote = z.infer<typeof MarketQuote>;

// asOf is the latest stored price date; null until the first refresh has stored any.
export const QuotesResponse = z.object({
  asOf: IsoDateField.nullable(),
  quotes: z.array(MarketQuote),
});
export type QuotesResponse = z.infer<typeof QuotesResponse>;
