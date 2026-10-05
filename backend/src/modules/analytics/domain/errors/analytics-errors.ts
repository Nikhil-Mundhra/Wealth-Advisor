import { ANALYTICS_ERROR_CODES as C } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';

// Every error the analytics module raises; statuses live in presentation/analytics-error-statuses.ts.
export const AnalyticsErrors = {
  noSnapshot: (asOf: string | null) =>
    new DomainError(C.noSnapshot, asOf ? `no market snapshot for ${asOf}` : 'no market snapshot computed yet'),
  invariantViolated: (detail: string) => new DomainError(C.invariantViolated, `analytics invariant violated: ${detail}`),
};
