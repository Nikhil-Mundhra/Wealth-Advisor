import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomBytes } from 'node:crypto';
import { getCorrelationId } from '#core/telemetry/correlation.ts';

export type SpanKind = 'SERVER' | 'INTERNAL' | 'CLIENT';
export type SpanStatus = 'OK' | 'ERROR';

export interface SpanRecord {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly correlationId?: string;
  readonly name: string;
  readonly kind: SpanKind;
  readonly startTimeUnixMs: number;
  readonly endTimeUnixMs: number;
  readonly durationMs: number;
  readonly status: SpanStatus;
  readonly errorMessage?: string;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

interface ActiveSpanContext {
  readonly traceId: string;
  readonly spanId: string;
}

const spanStorage = new AsyncLocalStorage<ActiveSpanContext>();
const MAX_SPANS = 500;
const spanBuffer: SpanRecord[] = [];

function toTraceId(correlationId: string | undefined): string {
  if (!correlationId) return randomBytes(16).toString('hex');
  return createHash('sha256').update(correlationId).digest('hex').slice(0, 32);
}

function newSpanId(): string {
  return randomBytes(8).toString('hex');
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T> | T,
  kind: SpanKind = 'INTERNAL',
): Promise<T> {
  const parent = spanStorage.getStore();
  const correlationId = getCorrelationId();
  const traceId = parent?.traceId ?? toTraceId(correlationId);
  const spanId = newSpanId();
  const startTimeUnixMs = Date.now();
  const startPerf = performance.now();

  try {
    const result = await spanStorage.run({ traceId, spanId }, () => Promise.resolve(fn()));
    const durationMs = Number((performance.now() - startPerf).toFixed(3));
    recordSpan({
      traceId,
      spanId,
      ...(parent ? { parentSpanId: parent.spanId } : {}),
      ...(correlationId ? { correlationId } : {}),
      name,
      kind,
      startTimeUnixMs,
      endTimeUnixMs: Date.now(),
      durationMs,
      status: 'OK',
      attributes: { ...attributes },
    });
    return result;
  } catch (error) {
    const durationMs = Number((performance.now() - startPerf).toFixed(3));
    recordSpan({
      traceId,
      spanId,
      ...(parent ? { parentSpanId: parent.spanId } : {}),
      ...(correlationId ? { correlationId } : {}),
      name,
      kind,
      startTimeUnixMs,
      endTimeUnixMs: Date.now(),
      durationMs,
      status: 'ERROR',
      errorMessage: error instanceof Error ? error.message : String(error),
      attributes: { ...attributes },
    });
    throw error;
  }
}

function recordSpan(span: SpanRecord): void {
  spanBuffer.push(span);
  if (spanBuffer.length > MAX_SPANS) {
    spanBuffer.splice(0, spanBuffer.length - MAX_SPANS);
  }
}

export function getRecentSpans(limit = 100): readonly SpanRecord[] {
  return spanBuffer.slice(-limit);
}

export function clearSpans(): void {
  spanBuffer.length = 0;
}

/**
 * Formats buffered spans into OTLP/JSON shape compatible with OpenTelemetry collectors.
 */
export function exportOtlpResourceSpans(serviceName = 'dewa-backend') {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [{ key: 'service.name', value: { stringValue: serviceName } }],
        },
        scopeSpans: [
          {
            scope: { name: 'dewa.tracer', version: '1.0.0' },
            spans: spanBuffer.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              ...(s.parentSpanId ? { parentSpanId: s.parentSpanId } : {}),
              name: s.name,
              startTimeUnixNano: String(s.startTimeUnixMs * 1_000_000),
              endTimeUnixNano: String(s.endTimeUnixMs * 1_000_000),
              status: { code: s.status === 'OK' ? 1 : 2, ...(s.errorMessage ? { message: s.errorMessage } : {}) },
              attributes: Object.entries(s.attributes).map(([key, val]) => ({
                key,
                value:
                  typeof val === 'number'
                    ? { doubleValue: val }
                    : typeof val === 'boolean'
                      ? { boolValue: val }
                      : { stringValue: val },
              })),
            })),
          },
        ],
      },
    ],
  };
}
