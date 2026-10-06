import { z } from 'zod';
import { CURRENCIES, HOUSEHOLD_MODES } from '@wealth-advisor/rules';

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'MULTI_CURRENCY_WALLET', 'BROKERAGE_CASH'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const AccountDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  householdMode: z.enum(HOUSEHOLD_MODES),
  institutionName: z.string(),
  accountType: z.enum(ACCOUNT_TYPES),
  currency: z.enum(CURRENCIES),
  balance: z.number().int(), // minor units
  lastSyncedAt: z.string(),
  isPrimaryLiquidity: z.boolean(),
  createdAt: z.string(),
});
export type AccountDto = z.infer<typeof AccountDto>;

export const CreateAccountRequest = z.object({
  institutionName: z.string().min(1).max(100),
  accountType: z.enum(ACCOUNT_TYPES),
  currency: z.enum(CURRENCIES),
  balance: z.number().int(),
  isPrimaryLiquidity: z.boolean().default(false),
  householdMode: z.enum(HOUSEHOLD_MODES).default('INDIVIDUAL'),
});
export type CreateAccountRequest = z.infer<typeof CreateAccountRequest>;

export const AccountListResponse = z.object({
  accounts: z.array(AccountDto),
});
export type AccountListResponse = z.infer<typeof AccountListResponse>;
