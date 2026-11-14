import { z } from 'zod';
import { CurrencyField } from '../fields/currency.field.ts';

export const TRANSACTION_INGESTED = { type: 'finance.transaction_ingested', version: 1 } as const;

export const TransactionIngestedPayload = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  category: z.string().min(1),
  convertedBaseAmount: z.number().int(),
  baseCurrency: CurrencyField,
  timestamp: z.string().min(1),
});
export type TransactionIngestedPayload = z.infer<typeof TransactionIngestedPayload>;
