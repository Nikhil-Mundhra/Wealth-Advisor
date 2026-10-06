import type { AccountDocument } from '../infrastructure/db/documents/account.document.ts';
import type { TransactionDocument } from '../infrastructure/db/documents/transaction.document.ts';

export interface AccountRepository {
  findByUser(tenantId: string, userId: string): Promise<AccountDocument[]>;
  findById(id: string): Promise<AccountDocument | null>;
  create(account: Omit<AccountDocument, '_id'>): Promise<AccountDocument>;
}

export interface TransactionRepository {
  findByUser(tenantId: string, userId: string): Promise<TransactionDocument[]>;
  create(tx: Omit<TransactionDocument, '_id'>): Promise<TransactionDocument>;
}
