import type { MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Db } from 'mongodb';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import { systemClock } from '#core/time/clock.ts';
import { IDEMPOTENCY_KEYS_COLLECTION, type IdempotencyKeyDocument } from './idempotency-keys.schema.ts';

export interface IdempotencyRecord {
  readonly payloadHash: string;
  readonly status: number;
  readonly contentType: string;
  readonly bodyText: string;
  readonly expiresAtMs: number;
}

export interface IdempotencyScopeMeta {
  readonly key: string;
  readonly callerHash: string;
  readonly method: string;
  readonly path: string;
  readonly createdAtMs?: number;
}

export interface IdempotencyStore {
  get(
    scopeKey: string,
    nowMs: number,
    meta?: IdempotencyScopeMeta,
  ): IdempotencyRecord | null | Promise<IdempotencyRecord | null>;
  set(
    scopeKey: string,
    record: IdempotencyRecord,
    meta?: IdempotencyScopeMeta,
  ): void | Promise<void>;
}

function parseScopeKey(scopeKey: string, meta?: IdempotencyScopeMeta): IdempotencyScopeMeta {
  if (meta) return meta;
  const [callerHash = '', method = '', path = '', ...keyParts] = scopeKey.split(':');
  return {
    key: keyParts.join(':') || scopeKey,
    callerHash: callerHash || 'anonymous',
    method: method || 'POST',
    path: path || '/',
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000;
}

/** Persistent MongoDB idempotency store backed by the TTL-indexed `idempotency_keys` collection. */
export function createMongoIdempotencyStore(db: Db | (() => Promise<Db>)): IdempotencyStore {
  const getDatabase = typeof db === 'function' ? db : async () => db;
  const col = async () => (await getDatabase()).collection<IdempotencyKeyDocument>(IDEMPOTENCY_KEYS_COLLECTION);

  return {
    async get(scopeKey, nowMs, meta) {
      const { key, callerHash, method, path } = parseScopeKey(scopeKey, meta);
      const doc = await (await col()).findOne({
        key,
        callerHash,
        method,
        path,
        expiresAt: { $gt: new Date(nowMs) },
      });
      if (!doc) return null;
      return {
        payloadHash: doc.payloadHash,
        status: doc.status,
        contentType: doc.contentType,
        bodyText: doc.bodyText,
        expiresAtMs: doc.expiresAt.getTime(),
      };
    },
    async set(scopeKey, record, meta) {
      const { key, callerHash, method, path } = parseScopeKey(scopeKey, meta);
      const createdAt = new Date(meta?.createdAtMs ?? Date.now());
      try {
        await (await col()).updateOne(
          { key, callerHash, method, path },
          {
            $set: {
              key,
              callerHash,
              method,
              path,
              payloadHash: record.payloadHash,
              status: record.status,
              contentType: record.contentType || 'application/json; charset=UTF-8',
              bodyText: record.bodyText,
              createdAt,
              expiresAt: new Date(record.expiresAtMs),
            },
          },
          { upsert: true },
        );
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    },
  };
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_MEMORY_ENTRIES = 10_000;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createMemoryIdempotencyStore(maxEntries = DEFAULT_MAX_MEMORY_ENTRIES): IdempotencyStore {
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
      if (entries.size >= maxEntries) {
        const now = Date.now();
        for (const [k, v] of entries) {
          if (v.expiresAtMs <= now) entries.delete(k);
        }
        if (entries.size >= maxEntries) {
          const oldestKey = entries.keys().next().value;
          if (oldestKey !== undefined) entries.delete(oldestKey);
        }
      }
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
    const method = c.req.method.toUpperCase();
    const path = c.req.path;
    const scopeKey = `${callerHash}:${method}:${path}:${rawKey}`;
    const scopeMeta: IdempotencyScopeMeta = { key: rawKey, callerHash, method, path };
    const nowMs = clock.now().getTime();

    const cached = await store.get(scopeKey, nowMs, scopeMeta);
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
      await store.set(
        scopeKey,
        {
          payloadHash,
          status: c.res.status,
          contentType,
          bodyText,
          expiresAtMs: nowMs + ttlMs,
        },
        { ...scopeMeta, createdAtMs: nowMs },
      );
      c.res.headers.set('X-Idempotent-Replay', 'false');
    }
  };
}
