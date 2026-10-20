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

  it('discards model-invented numbers and keeps the engine figures', async () => {
    const adapter = new ClaudeLlmAdapter(
      'test-anthropic-key',
      undefined,
      stubHttp({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              reply: 'Runway stands at 9.9 months with a €1,000,000 bonus.',
              personalFinance: 'Monthly net burn is €99999.',
              crossBorder: 'Shields the EUR/CNY corridor with 0% risk.',
              wealthStrategy: 'Shifts portfolio from 99% equities down.',
            }),
          },
        ],
      }),
    );
    const res = await adapter.chat(context);
    assert.ok(!res.reply.includes('9.9'), `invented runway leaked: ${res.reply}`);
    assert.match(res.reply, /3\.2/);
    assert.ok(!res.threePillarRationale.personalFinance.includes('99999'));
    assert.ok(!res.threePillarRationale.crossBorder.includes('0%'));
    assert.ok(!res.threePillarRationale.wealthStrategy.includes('99%'));
  });

  it('fails loudly without an API key', async () => {
    const adapter = new ClaudeLlmAdapter(undefined, undefined, stubHttp({}));
    await assert.rejects(() => adapter.chat(context), (err: any) => err.code === 'AV_1001');
  });

  it('fails loudly when Claude fails', async () => {
    const failing: HttpClient = {
      getJson: async () => ({}),
      postJson: async () => {
        throw new Error('provider outage');
      },
    };
    const adapter = new ClaudeLlmAdapter('test-anthropic-key', undefined, failing);
    await assert.rejects(() => adapter.chat(context), (err: any) => err.code === 'AV_1001');
  });
});
