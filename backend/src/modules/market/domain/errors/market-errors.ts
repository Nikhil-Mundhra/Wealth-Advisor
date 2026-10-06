import { MARKET_ERROR_CODES as C } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';

// Every error the market module raises. Messages are developer text and never carry a provider key or URL query;
// statuses live in presentation/market-error-statuses.ts.
export const MarketErrors = {
  cronUnauthorized: () => new DomainError(C.cronUnauthorized, 'cron secret missing or wrong'),
  providerUnavailable: (provider: string, detail: string) =>
    new DomainError(C.providerUnavailable, `${provider} unavailable: ${detail}`),
  providerQuotaSpent: (provider: string) =>
    new DomainError(C.providerQuotaSpent, `${provider} monthly request quota is spent`),
  providerNotConfigured: (provider: string) =>
    new DomainError(C.providerNotConfigured, `${provider} is not configured (missing access key)`),
  invariantViolated: (detail: string) => new DomainError(C.invariantViolated, `market invariant violated: ${detail}`),
};
