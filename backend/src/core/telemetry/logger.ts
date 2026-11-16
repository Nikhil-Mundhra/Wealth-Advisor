import { getCorrelationId, getRequestId } from '#core/telemetry/correlation.ts';

export type LogLevel = 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly service: string;
  readonly message: string;
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly [key: string]: unknown;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const ACCOUNT_OR_CARD_RE = /\b(?:\d[ -]?){12,19}\d\b/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{3,4}[\s.-]\d{3,4}\b/g;
const BEARER_OR_KEY_RE = /\b(?:Bearer\s+[A-Za-z0-9._-]+|sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{16,})\b/g;

export function redactLogString(value: string): string {
  return value
    .replace(BEARER_OR_KEY_RE, '[REDACTED_SECRET]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(IBAN_RE, '[REDACTED_IBAN]')
    .replace(ACCOUNT_OR_CARD_RE, '[REDACTED_ACCOUNT]')
    .replace(PHONE_RE, '[REDACTED_PHONE]');
}

export function redactLogValue(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;
  if (typeof value === 'string') return redactLogString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactLogString(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lower = k.toLowerCase();
      if (lower.includes('password') || lower.includes('secret') || lower.includes('apikey') || lower === 'authorization') {
        out[k] = '[REDACTED_SECRET]';
      } else {
        out[k] = redactLogValue(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

export interface LoggerOptions {
  readonly service?: string;
  readonly sink?: (serialized: string, level: LogLevel) => void;
}

function defaultSink(serialized: string, level: LogLevel): void {
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.log(serialized);
}

export function createLogger(options?: LoggerOptions) {
  const service = options?.service ?? 'dewa-backend';
  const sink = options?.sink ?? defaultSink;

  const emit = (level: LogLevel, message: string, fields?: Record<string, unknown>): StructuredLogEntry => {
    const correlationId = getCorrelationId();
    const requestId = getRequestId();
    const sanitizedFields = fields ? (redactLogValue(fields) as Record<string, unknown>) : {};

    const entry: StructuredLogEntry = {
      ...sanitizedFields,
      timestamp: new Date().toISOString(),
      level,
      service,
      ...(correlationId ? { correlationId } : {}),
      ...(requestId ? { requestId } : {}),
      message: redactLogString(message),
    };

    sink(JSON.stringify(entry), level);
    return entry;
  };

  return {
    info: (message: string, fields?: Record<string, unknown>) => emit('info', message, fields),
    warn: (message: string, fields?: Record<string, unknown>) => emit('warn', message, fields),
    error: (message: string, fields?: Record<string, unknown>) => emit('error', message, fields),
  };
}

export const telemetryLogger = createLogger();
