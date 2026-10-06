import type { ObjectId } from 'mongodb';
import type { Currency, HouseholdMode } from '@wealth-advisor/rules';
import type { AccountType } from '@wealth-advisor/contracts';

export const ACCOUNTS_COLLECTION = 'accounts';

export interface AccountDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  householdMode: HouseholdMode;
  institutionName: string;
  accountType: AccountType;
  currency: Currency;
  balance: number; // minor units
  lastSyncedAt: Date;
  isPrimaryLiquidity: boolean;
  createdAt: Date;
}
