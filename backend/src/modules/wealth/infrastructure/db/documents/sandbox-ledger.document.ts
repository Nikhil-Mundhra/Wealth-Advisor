import type { ObjectId } from 'mongodb';
import type { ExecutedTradeDto, OrderType, PasskeyProofDto } from '@wealth-advisor/contracts';

export const SANDBOX_LEDGERS_COLLECTION = 'sandbox_ledgers';

export interface SandboxLedgerDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  orderType: OrderType;
  initialPortfolioStateHash: string;
  executedTrades: ExecutedTradeDto[];
  resultingPortfolioStateHash: string;
  passkeyAssertionProof: PasskeyProofDto;
  auditDigest: string;
  transactionHash: string;
  status: 'COMMITTED' | 'REJECTED';
  timestamp: Date;
}
