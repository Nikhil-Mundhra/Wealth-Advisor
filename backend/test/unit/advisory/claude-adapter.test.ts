import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CashflowSummaryResponse, PortfolioResponse } from '@wealth-advisor/contracts';
import type { HttpClient } from '../../../src/core/http-client/http-client.ts';
import { ClaudeLlmAdapter, type LlmContext } from '../../../src/modules/advisory/domain/llm-gateway.ts';

const cashflow = {
  runwayMonths: 3.2,
  netCashflowBase: 510000,
  runwayBand: 'warning',
} as unknown as CashflowSummaryResponse;

const portfolio = {
  totalValuationBase: 9500000,
  holdings: [
    { assetSymbol: 'CSPX.LSE', assetClass: 'EQUITY_US', currentWeight: 0.6, targetWeight: 0.4 },
    { assetSymbol: 'IEAC.LSE', assetClass: 'FIXED_INCOME_GOV', currentWeight: 0.25, targetWeight: 0.35 },
    { assetSymbol: 'XEON.XETRA', assetClass: 'MONEY_MARKET', currentWeight: 0.15, targetWeight: 0.25 },
  ],
} as unknown as PortfolioResponse;

const context: LlmContext = {
  message: 'How should our household portfolio adapt?',
  locale: 'en',
  householdMode: 'FAMILY_HOUSEHOLD',
  cashflow,
  portfolio,
  proposalHoldings: [],
};

function stubHttp(response: unknown): HttpClient {
  return {
    getJson: async () => ({}),
    postJson: async () => response,
  };
}

describe('ClaudeLlmAdapter', () => {
  it('narrates with the Claude response when numbers match engine facts', async () => {
    const adapter = new ClaudeLlmAdapter(
      'test-anthropic-key',
      undefined,
      stubHttp({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              reply: 'Runway stands at 3.2 months.',
              personalFinance: 'Runway at 3.2 months.',
              crossBorder: 'Shields the EUR/CNY corridor.',
              wealthStrategy: 'Shifts portfolio from 60% equities down.',
            }),
          },
        ],
      }),
    );
    const res = await adapter.chat(context);
    assert.equal(res.reply, 'Runway stands at 3.2 months.');
    assert.match(res.complianceDisclaimer, /sandbox/i);
  });

  it('falls back to the deterministic mock without a key', async () => {
    const adapter = new ClaudeLlmAdapter(undefined, undefined, stubHttp({}));
    const res = await adapter.chat(context);
    assert.match(res.reply, /family household/);
  });

  it('falls back to the deterministic mock when Claude fails', async () => {
    const failing: HttpClient = {
      getJson: async () => ({}),
      postJson: async () => {
        throw new Error('provider outage');
      },
    };
    const adapter = new ClaudeLlmAdapter('test-anthropic-key', undefined, failing);
    const res = await adapter.chat(context);
    assert.match(res.reply, /family household/);
  });
});
