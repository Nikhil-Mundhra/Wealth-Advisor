import type { ObjectId } from 'mongodb';
import type { Currency } from '@wealth-advisor/rules';
import type { RemittanceMetadataDto, TransactionCategory, TuitionMetadataDto } from '@wealth-advisor/contracts';

export const TRANSACTIONS_COLLECTION = 'transactions';

export interface TransactionDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  accountId: ObjectId;
  category: TransactionCategory;
  amount: number; // minor units
  currency: Currency;
  convertedBaseAmount: number; // minor units
  baseCurrency: Currency;
  remittanceMetadata?: RemittanceMetadataDto;
  tuitionMetadata?: TuitionMetadataDto;
  timestamp: Date;
  createdAt: Date;
}
