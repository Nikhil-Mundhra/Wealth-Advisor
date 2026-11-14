import type { MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import { systemClock } from '#core/time/clock.ts';

export interface IdempotencyRecord {
  readonly payloadHash: string;
  readonly status: number;
  readonly contentType: string;
  readonly bodyText: string;
  readonly expiresAtMs: number;
}

export interface IdempotencyStore {
  get(scopeKey: string, nowMs: number): IdempotencyRecord | null;
  set(scopeKey: string, record: IdempotencyRecord): void;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createMemoryIdempotencyStore(): IdempotencyStore {
  const entries = new Map<string, IdempotencyRecord>();
  return {
    get(scopeKey, nowMs) {
      const existing = entries.get(scopeKey);
      if (!existing) return null;
      if (existing.expiresAtMs <= nowMs) {
        entries.delete(scopeKey);
        return null;
      }
      return existing;
    },
    set(scopeKey, record) {
      entries.set(scopeKey, record);
    },
  };
}

export interface IdempotencyMiddlewareOptions {
  readonly store?: IdempotencyStore;
  readonly clock?: Clock;
  readonly ttlMs?: number;
}

/**
 * Enforces `Idempotency-Key` semantics on state-changing HTTP requests.
 * Replays identical `(caller, method, path, payloadHash)` calls with `X-Idempotent-Replay: true`
 * and refuses key reuse with a mutated payload (`409 CORE_IDEMPOTENCY_CONFLICT`).
 */
export function createIdempotencyMiddleware(options?: IdempotencyMiddlewareOptions): MiddlewareHandler {
  const store = options?.store ?? createMemoryIdempotencyStore();
  const clock = options?.clock ?? systemClock;
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  return async (c, next) => {
    if (!WRITE_METHODS.has(c.req.method.toUpperCase())) {
      await next();
      return;
    }

    const rawKey = c.req.header('idempotency-key')?.trim();
    if (!rawKey) {
      await next();
      return;
    }

    const authHeader = c.req.header('authorization') ?? 'anonymous';
    const callerHash = sha256Hex(authHeader);
    const rawBody = await c.req.raw.clone().text().catch(() => '');
    const payloadHash = sha256Hex(rawBody);
    const scopeKey = `${callerHash}:${c.req.method.toUpperCase()}:${c.req.path}:${rawKey}`;
    const nowMs = clock.now().getTime();

    const cached = store.get(scopeKey, nowMs);
    if (cached) {
      if (cached.payloadHash !== payloadHash) {
        return c.json(
          {
            code: CORE_ERROR_CODES.idempotencyConflict,
            message: 'Idempotency-Key already used with a different request payload',
          },
          409,
        );
      }
      return c.body(cached.bodyText, cached.status as ContentfulStatusCode, {
        'Content-Type': cached.contentType,
        'X-Idempotent-Replay': 'true',
      });
    }

    await next();

    if (c.res && c.res.status >= 200 && c.res.status < 300) {
      const cloned = c.res.clone();
      const bodyText = await cloned.text();
      const contentType = cloned.headers.get('content-type') ?? 'application/json; charset=UTF-8';
      store.set(scopeKey, {
        payloadHash,
        status: c.res.status,
        contentType,
        bodyText,
        expiresAtMs: nowMs + ttlMs,
      });
      c.res.headers.set('X-Idempotent-Replay', 'false');
    }
  };
}
