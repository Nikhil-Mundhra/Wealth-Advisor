import { InProcessEventBus } from '#core/events/event-bus.ts';
import { MemoryProcessedEvents } from '#core/events/memory-processed-events.ts';
import { systemClock } from '#core/time/clock.ts';
import { runAdvisoryEvalSuite } from '#modules/advisory/domain/eval-runner.ts';
import { LlmGateway } from '#modules/advisory/domain/llm-gateway.ts';
import { createAnalyticsApi } from '#modules/analytics/analytics.api.ts';
import { MemoryMarketSnapshotRepository } from '#modules/analytics/infrastructure/db/memory/memory-market-snapshot.repository.ts';
import { createFinanceApi } from '#modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '#modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { MemoryFxRateRepository } from '#modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '#modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { createMarketApi } from '#modules/market/market.api.ts';
import { unregisteredPasskeyVerifier } from '#modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '#modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '#modules/wealth/wealth.api.ts';

const clock = systemClock;
const events = new InProcessEventBus();
const market = createMarketApi({
  prices: new MemoryPriceRepository(),
  fxRates: new MemoryFxRateRepository(),
  priceSource: { fetchEndOfDay: async () => [] },
  fxSource: { fetchRange: async () => [] },
  events,
  clock,
});
const analytics = createAnalyticsApi({
  market,
  snapshots: new MemoryMarketSnapshotRepository(),
  processed: new MemoryProcessedEvents(),
  clock,
});
const finance = createFinanceApi({
  accounts: new MemoryAccountRepository(),
  transactions: new MemoryTransactionRepository(),
  clock,
  market,
});
const wealth = createWealthApi({
  products: new MemoryAssetProductRepository(),
  portfolios: new MemoryPortfolioRepository(),
  profiles: new MemoryRiskProfileRepository(),
  ledger: new MemorySandboxLedgerRepository(),
  passkeys: unregisteredPasskeyVerifier,
  clock,
  analytics,
});

const report = await runAdvisoryEvalSuite({
  finance,
  wealth,
  market,
  analytics,
  gateway: new LlmGateway(),
});

console.log(`DEWA Advisory Eval Suite v${report.suiteVersion} (provider=${report.provider})`);
for (const c of report.cases) {
  console.log(`  [${c.passed ? 'PASS' : 'FAIL'}] ${c.id} (${c.durationMs}ms) — ${c.details}`);
}
console.log(
  `Summary: ${report.passedCases}/${report.totalCases} passed (${report.failedCases} failed) in ${report.durationMs}ms`,
);

if (report.failedCases > 0) {
  process.exit(1);
}
