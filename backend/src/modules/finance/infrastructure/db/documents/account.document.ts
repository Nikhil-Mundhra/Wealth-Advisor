import type { ObjectId } from 'mongodb';
import type { AccountType, Currency, HouseholdMode } from '@wealth-advisor/rules';

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
