import type { ObjectId } from 'mongodb';
import type {
  Currency,
  RemittanceMetadata,
  TransactionCategory,
  TuitionMetadata,
} from '@wealth-advisor/rules';

export const TRANSACTIONS_COLLECTION = 'transactions';

export interface TransactionDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  accountId: ObjectId;
  externalId?: string;
  category: TransactionCategory;
  amount: number; // minor units
  currency: Currency;
  convertedBaseAmount: number; // minor units
  baseCurrency: Currency;
  description?: string;
  remittanceMetadata?: RemittanceMetadata;
  tuitionMetadata?: TuitionMetadata;
  timestamp: Date;
  createdAt: Date;
}
