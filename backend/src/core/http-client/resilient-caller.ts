import { HttpClientError } from '#core/http-client/http-client.ts';
import type { Clock } from '#core/time/clock.ts';
import { systemClock } from '#core/time/clock.ts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  readonly failureThreshold?: number;
  readonly cooldownMs?: number;
  readonly clock?: Clock;
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly clock: Clock;
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private openedAtMs = 0;

  constructor(name: string, options?: CircuitBreakerOptions) {
    this.name = name;
    this.failureThreshold = options?.failureThreshold ?? 3;
    this.cooldownMs = options?.cooldownMs ?? 30_000;
    this.clock = options?.clock ?? systemClock;
  }

  getState(): CircuitState {
    if (this.state === 'OPEN' && this.clock.now().getTime() - this.openedAtMs >= this.cooldownMs) {
      return 'HALF_OPEN';
    }
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openedAtMs = 0;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const current = this.getState();
    if (current === 'OPEN') {
      throw new CircuitOpenError(this.name);
    }
    if (current === 'HALF_OPEN') {
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.consecutiveFailures = 0;
      this.state = 'CLOSED';
      return result;
    } catch (error) {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        this.openedAtMs = this.clock.now().getTime();
      }
      throw error;
    }
  }
}

export interface RetryOptions {
  readonly maxRetries?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
  readonly shouldRetry?: (error: unknown) => boolean;
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof CircuitOpenError) return false;
  if (error instanceof HttpClientError) return error.kind === 'transient';
  return true;
}

export async function retryWithBackoffAndJitter<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 50;
  const maxDelayMs = options?.maxDelayMs ?? 1_000;
  const sleep = options?.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = options?.random ?? Math.random;
  const shouldRetry = options?.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const cap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const delayMs = Math.max(0, Math.round(random() * cap));
      attempt += 1;
      if (delayMs > 0) await sleep(delayMs);
    }
  }
}

export interface CachedCallResult<V> {
  readonly value: V;
  readonly stale: boolean;
  readonly cachedAt: string | null;
  readonly source: 'live' | 'cache' | 'stale_cache' | 'mock_fallback';
  readonly circuitState: CircuitState;
  readonly reason?: string;
}

interface CacheEntry<V> {
  readonly value: V;
  readonly cachedAtMs: number;
  readonly expiresAtMs: number;
}

export interface ResilientCallerOptions<K, V> {
  readonly name: string;
  readonly ttlMs: number;
  readonly fetcher: (key: K) => Promise<V>;
  readonly mockFallback?: (key: K) => Promise<V> | V;
  readonly circuitBreaker?: CircuitBreaker;
  readonly retry?: RetryOptions;
  readonly clock?: Clock;
  readonly keySerializer?: (key: K) => string;
}

/**
 * Wraps external dependencies behind a TTL cache, circuit breaker, exponential-backoff retry
 * with full jitter, stale-cache degradation, and optional deterministic mock fallback.
 */
export function createResilientCachedCaller<K, V>(options: ResilientCallerOptions<K, V>) {
  const clock = options.clock ?? systemClock;
  const breaker = options.circuitBreaker ?? new CircuitBreaker(options.name, { clock });
  const cache = new Map<string, CacheEntry<V>>();
  const serialize = options.keySerializer ?? ((key: K) => String(key));

  return {
    getCircuitState(): CircuitState {
      return breaker.getState();
    },

    async call(key: K): Promise<CachedCallResult<V>> {
      const nowMs = clock.now().getTime();
      const cacheKey = serialize(key);
      const cached = cache.get(cacheKey);

      if (cached && cached.expiresAtMs > nowMs) {
        return {
          value: cached.value,
          stale: false,
          cachedAt: new Date(cached.cachedAtMs).toISOString(),
          source: 'cache',
          circuitState: breaker.getState(),
        };
      }

      try {
        const fresh = await breaker.execute(() =>
          retryWithBackoffAndJitter(() => options.fetcher(key), options.retry),
        );
        cache.set(cacheKey, {
          value: fresh,
          cachedAtMs: nowMs,
          expiresAtMs: nowMs + options.ttlMs,
        });
        return {
          value: fresh,
          stale: false,
          cachedAt: new Date(nowMs).toISOString(),
          source: 'live',
          circuitState: breaker.getState(),
        };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        if (cached) {
          return {
            value: cached.value,
            stale: true,
            cachedAt: new Date(cached.cachedAtMs).toISOString(),
            source: 'stale_cache',
            circuitState: breaker.getState(),
            reason,
          };
        }
        if (options.mockFallback) {
          const mockVal = await options.mockFallback(key);
          return {
            value: mockVal,
            stale: true,
            cachedAt: null,
            source: 'mock_fallback',
            circuitState: breaker.getState(),
            reason,
          };
        }
        throw error;
      }
    },
  };
}
