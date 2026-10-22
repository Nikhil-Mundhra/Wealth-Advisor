import type { MiddlewareHandler } from 'hono';
import { SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';

export interface RateLimiterOptions {
  readonly windowMs: number;
  readonly maxRequests: number;
}

export class InMemoryRateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 60_000, maxRequests: 60 }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  reset(): void {
    this.hits.clear();
  }

  check(ip: string, now: number = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const record = this.hits.get(ip);
    if (!record || record.resetAt <= now) {
      this.hits.set(ip, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    record.count += 1;
    if (record.count > this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  middleware(): MiddlewareHandler {
    return async (c, next) => {
      const forwarded = c.req.header('x-forwarded-for');
      const ip = (forwarded ? forwarded.split(',')[0]!.trim() : c.req.header('x-real-ip')) || 'local';
      const result = this.check(ip);
      if (!result.allowed) {
        c.header('Retry-After', String(result.retryAfterSeconds));
        throw new DomainError(SHARING_ERROR_CODES.rateLimited, 'too many requests; please try again later');
      }
      await next();
    };
  }
}
