# Market APIs

## GET /api/market/quotes
- responsibility: return the latest stored end-of-day close of every tracked ETF with its asset class; reads stored data only, never calls a provider
- contract: request none, response `QuotesResponse` 200 (`asOf` null and `quotes` empty before the first refresh), errors `MK_1900`, `CORE_DB_UNCONFIGURED`; auth none (public market data)

## GET /api/market/fx
- responsibility: return the latest stored ECB rate on or before `date` from `base` to every other supported currency, crossed through EUR; reads stored data only
- contract: request query `FxRatesQuery`, response `FxRatesResponse` 200 (`asOf` null and `rates` empty when no rate is stored on or within 10 days before `date`), errors `CORE_VALIDATION_FAILED`, `MK_1900`, `CORE_DB_UNCONFIGURED`; auth none (public market data)
- nested route / query: `base` required, one of `CURRENCIES` (`currency.invalid`); `date` optional `YYYY-MM-DD`, default today in UTC (`date.invalid`)

## GET /api/market/refresh
- responsibility: called by Vercel Cron (`vercel.json` `crons`) once each weekday between 23:00 and 23:59 UTC; fetch ECB rates (Frankfurter) and end-of-day closes (Marketstack) from the oldest last-stored day, or one year back when anything is missing, through today; append both; publish `market.data_refreshed` (`backend/docs/events.md`). Both fetches finish before any write, so a failure stores nothing
- contract: request none, response `RefreshResponse` 200, errors `MK_1001`, `MK_1903`, `MK_1902`, `MK_1901`, `MK_1900`, `CORE_DB_UNCONFIGURED`; auth machine (Vercel Cron) via `Authorization: Bearer <CRON_SECRET>`, compared in constant time; not a user token; `CRON_SECRET` unset → every call `MK_1001`
