import { z } from 'zod';

export const ORDER_TYPES = ['PORTFOLIO_REBALANCE', 'SCHEDULED_REMITTANCE_BUFFER', 'TUITION_CARVE_OUT'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ExecutedTradeDto = z.object({
  assetSymbol: z.string(),
  action: z.enum(['BUY', 'SELL']),
  amountBase: z.number().int(),
  targetWeight: z.number(),
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
  status: z.enum(['COMMITTED', 'REJECTED']),
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
