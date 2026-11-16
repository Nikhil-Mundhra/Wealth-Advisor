import { z } from 'zod';
import {
  DEFAULT_ENGINE_MODEL_VERSION,
  DEFAULT_SANDBOX_RULES_EVALUATED,
  ORDER_TYPES,
  REBALANCE_ACTIONS,
  SANDBOX_LEDGER_DECISIONS,
  SANDBOX_LEDGER_STATUSES,
  type OrderType,
} from '@wealth-advisor/rules';

export { ORDER_TYPES, type OrderType };

export const ExecutedTradeDto = z.object({
  assetSymbol: z.string(),
  action: z.enum(REBALANCE_ACTIONS),
  amountBase: z.number().int(),
  targetWeight: z.number().min(0).max(1),
});
export type ExecutedTradeDto = z.infer<typeof ExecutedTradeDto>;

export const PasskeyProofDto = z.object({
  credentialId: z.string(),
  clientDataJson: z.string(),
  authenticatorData: z.string(),
  signature: z.string(),
  verifiedAt: z.string(),
});
export type PasskeyProofDto = z.infer<typeof PasskeyProofDto>;

export const SandboxLedgerEntryDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  orderType: z.enum(ORDER_TYPES),
  initialPortfolioStateHash: z.string(),
  executedTrades: z.array(ExecutedTradeDto),
  resultingPortfolioStateHash: z.string(),
  passkeyAssertionProof: PasskeyProofDto,
  auditDigest: z.string(),
  transactionHash: z.string(),
  status: z.enum(SANDBOX_LEDGER_STATUSES),
  inputs: z.record(z.string(), z.unknown()).optional(),
  rulesEvaluated: z.array(z.string()).default([...DEFAULT_SANDBOX_RULES_EVALUATED]),
  engineOutputs: z.record(z.string(), z.unknown()).optional(),
  modelVersion: z.string().default(DEFAULT_ENGINE_MODEL_VERSION),
  decision: z.enum(SANDBOX_LEDGER_DECISIONS).default('APPROVED'),
  timestamp: z.string(),
});
export type SandboxLedgerEntryDto = z.infer<typeof SandboxLedgerEntryDto>;

export const ExecuteTradeRequest = z.object({
  orderType: z.enum(ORDER_TYPES).default('PORTFOLIO_REBALANCE'),
  trades: z.array(ExecutedTradeDto),
  passkeyAssertion: z.object({
    credentialId: z.string(),
    clientDataJson: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
  }),
});
export type ExecuteTradeRequest = z.infer<typeof ExecuteTradeRequest>;

export const SandboxLedgerResponse = z.object({
  entries: z.array(SandboxLedgerEntryDto),
});
export type SandboxLedgerResponse = z.infer<typeof SandboxLedgerResponse>;

export const ExecuteTradeResponse = z.object({
  ledgerEntry: SandboxLedgerEntryDto,
  success: z.boolean(),
});
export type ExecuteTradeResponse = z.infer<typeof ExecuteTradeResponse>;
