import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CashflowSummaryResponse, PortfolioResponse } from '@wealth-advisor/contracts';
import type { HttpClient } from '../../../src/core/http-client/http-client.ts';
import type { LlmContext } from '../../../src/modules/advisory/domain/llm-gateway.ts';
import {
  buildAdvisoryFacts,
  ClaudeLlmAdapter,
  OpenAiLlmAdapter,
  OpenRouterLlmAdapter,
} from '../../../src/modules/advisory/domain/llm-gateway.ts';

const cashflow = {
  runwayMonths: 3.2,
  netCashflowBase: 510000,
  runwayBand: 'warning',
} as unknown as CashflowSummaryResponse;

const portfolio = {
  totalValuationBase: 9500000,
  holdings: [
    { assetSymbol: 'CSPX.LSE', assetClass: 'EQUITY_US', currentWeight: 0.6, targetWeight: 0.4 },
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

function stubHttp(response: unknown, capture?: { body?: unknown; timeoutMs?: number }): HttpClient {
  return {
    getJson: async () => ({}),
    postJson: async (_url, body: unknown, options?: { timeoutMs?: number }) => {
      if (capture) {
        capture.body = body;
        capture.timeoutMs = options?.timeoutMs;
      }
      return response;
    },
  };
}

describe('live adapter calculation shield', () => {
  it('rejects narrative numbers quoted from the user inquiry', async () => {
    // The engine never produced these figures; the only source is the user's own message, so the
    // model echoing them must not pass the shield.
    const userInquiry: LlmContext = {
      ...context,
      message: 'I read online that this strategy returns 300% a year, ok?',
    };
    const adapter = new OpenAiLlmAdapter(
      'test-openai-key',
      undefined,
      stubHttp({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: 'Yes, this strategy reliably returns 300% a year.',
                personalFinance: 'Runway at 3.2 months.',
                crossBorder: 'Hedge the EUR/CNY corridor.',
                wealthStrategy: 'Keep the target weights.',
              }),
            },
          },
        ],
      }),
    );
    const res = await adapter.chat(userInquiry);
    assert.ok(!res.reply.includes('300%'), 'user-quoted number leaked through the shield');
    assert.match(res.reply, /3\.2/);
  });

  it('keeps narrative numbers that restate the engine benchmarks', async () => {
    const adapter = new OpenAiLlmAdapter(
      'test-openai-key',
      undefined,
      stubHttp({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: 'Runway stands at 3.2 months and the plan expects a €95,000 portfolio.',
                personalFinance: 'Runway at 3.2 months.',
                crossBorder: 'Hedge the EUR/CNY corridor.',
                wealthStrategy: 'Keep the target weights.',
              }),
            },
          },
        ],
      }),
    );
    const res = await adapter.chat(context);
    assert.match(res.reply, /3\.2/);
    assert.match(res.reply, /€95,000/);
  });
});
