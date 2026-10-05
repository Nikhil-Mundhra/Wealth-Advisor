import { FxRatesQuery, FxRatesResponse, QuotesResponse, RefreshResponse } from '@wealth-advisor/contracts';
import { RouteBuilder, type RouteDefinition } from '#core/http/route-builder.ts';
import { requireBearerSecret } from '#core/http/require-bearer-secret.ts';
import { toIsoDate } from '#core/time/calendar-date.ts';
import type { Clock } from '#core/time/clock.ts';
import { MarketErrors } from '../../domain/errors/market-errors.ts';
import type { MarketApi } from '../../market.api.ts';
import { toFxRatesResponse, toQuotesResponse, toRefreshResponse } from '../mappers/result-to-contract.mapper.ts';

export interface MarketRouteDeps {
  readonly api: MarketApi;
  readonly clock: Clock;
  readonly cronSecret: () => string | undefined;
}

// quotes and fx are public market data. refresh is called by Vercel Cron with GET and
// `Authorization: Bearer <CRON_SECRET>`; it is a machine credential, not a user token.
export function marketRoutes(deps: MarketRouteDeps): RouteDefinition[] {
  return [
    RouteBuilder.get('/quotes')
      .responds(QuotesResponse)
      .handle(async () => toQuotesResponse(await deps.api.quotes())),
    RouteBuilder.get('/fx')
      .query(FxRatesQuery)
      .responds(FxRatesResponse)
      .handle(async ({ query }) => toFxRatesResponse(await deps.api.rates(query.base, query.date))),
    RouteBuilder.get('/refresh')
      .use(requireBearerSecret(deps.cronSecret, MarketErrors.cronUnauthorized))
      .responds(RefreshResponse)
      .handle(async () => toRefreshResponse(await deps.api.refresh(toIsoDate(deps.clock.now())))),
  ];
}
