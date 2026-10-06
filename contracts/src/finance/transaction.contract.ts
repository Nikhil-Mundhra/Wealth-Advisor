import { z } from 'zod';
import { CURRENCIES } from '@wealth-advisor/rules';

export const TRANSACTION_CATEGORIES = [
  'INCOME_SALARY',
  'INCOME_FREELANCE',
  'BILL_HOUSING',
  'BILL_UTILITIES',
  'EXPENSE_DISCRETIONARY',
  'FAMILY_REMITTANCE',
  'TUITION_FEE',
  'FX_CONVERSION',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const RemittanceMetadataDto = z.object({
  recipientCountry: z.string(),
  destinationCurrency: z.string(),
  exchangeRateApplied: z.number(),
  feePaid: z.number().int(),
});
export type RemittanceMetadataDto = z.infer<typeof RemittanceMetadataDto>;

export const TuitionMetadataDto = z.object({
  institution: z.string(),
  semesterDeadline: z.string(),
  isLiquidityCarveOut: z.boolean(),
});
export type TuitionMetadataDto = z.infer<typeof TuitionMetadataDto>;

export const TransactionDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  accountId: z.string(),
  category: z.enum(TRANSACTION_CATEGORIES),
  amount: z.number().int(), // minor units
  currency: z.enum(CURRENCIES),
  convertedBaseAmount: z.number().int(),
  baseCurrency: z.enum(CURRENCIES),
  remittanceMetadata: RemittanceMetadataDto.optional(),
  tuitionMetadata: TuitionMetadataDto.optional(),
  timestamp: z.string(),
  createdAt: z.string(),
});
export type TransactionDto = z.infer<typeof TransactionDto>;

export const TransactionListResponse = z.object({
  transactions: z.array(TransactionDto),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponse>;
