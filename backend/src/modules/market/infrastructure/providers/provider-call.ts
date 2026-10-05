import { z } from 'zod';
import { MARKET_ERROR_CODES } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';
import { HttpClientError } from '#core/http-client/http-client.ts';
import { MarketErrors } from '../../domain/errors/market-errors.ts';

// apilayer (Marketstack) can answer 200 with { error: { code, message } }; any status without a parseable body
// reaches here as an HttpClientError, whose message names only origin + path.
const ProviderErrorBody = z.object({ error: z.object({ code: z.string() }) });

// Every provider failure becomes MK_1901: a network error, a non-2xx status, an error body, or a body that does not
// match the shape the adapter was written against.
export async function callProvider<S extends z.ZodType>(provider: string, call: () => Promise<unknown>, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await call();
  } catch (error) {
    if (error instanceof HttpClientError) throw MarketErrors.providerUnavailable(provider, error.message);
    throw error;
  }
  const failure = ProviderErrorBody.safeParse(body);
  if (failure.success) throw MarketErrors.providerUnavailable(provider, `answered error ${failure.data.error.code}`);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw MarketErrors.providerUnavailable(provider, 'answered an unexpected response shape');
  return parsed.data;
}

// A provider value that breaks a domain invariant (a zero close, a malformed date) is the provider's failure, not
// ours: MK_1901 instead of MK_1900.
export function fromProvider<T>(provider: string, build: () => T): T {
  try {
    return build();
  } catch (error) {
    if (error instanceof DomainError && error.code === MARKET_ERROR_CODES.invariantViolated) {
      throw MarketErrors.providerUnavailable(provider, `sent an invalid value (${error.message})`);
    }
    throw error;
  }
}
