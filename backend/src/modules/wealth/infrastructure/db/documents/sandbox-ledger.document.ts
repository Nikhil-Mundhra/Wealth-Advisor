import type { ObjectId } from 'mongodb';
import type { OrderType, SandboxLedgerDecision, SandboxLedgerStatus } from '@wealth-advisor/rules';
import type { ExecutedTradeDto, PasskeyProofDto } from '@wealth-advisor/contracts';

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
  status: SandboxLedgerStatus;
  inputs?: Record<string, unknown>;
  rulesEvaluated?: string[];
  engineOutputs?: Record<string, unknown>;
  modelVersion?: string;
  decision?: SandboxLedgerDecision;
  timestamp: Date;
}
