import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createLogger } from '#core/telemetry/logger.ts';
import { correlationMiddleware, getCorrelationId, runWithCorrelation } from '#core/telemetry/correlation.ts';
import { formatPrometheusMetrics, recordGuardrailTrigger, recordLlmUsage, resetMetrics } from '#core/telemetry/metrics.ts';
import { clearSpans, exportOtlpResourceSpans, getRecentSpans, withSpan } from '#core/telemetry/tracing.ts';
import { startTestApp, type TestApp } from '../../support/test-app.ts';

describe('Telemetry (correlation, redacted JSON logging, OTLP spans, Prometheus metrics)', () => {
  let app: TestApp;

  before(async () => {
    resetMetrics();
    clearSpans();
    app = await startTestApp({ store: 'memory' });
  });

  after(async () => {
    await app.stop();
  });

  it('propagates incoming X-Correlation-Id and mints one when absent', async () => {
    const incoming = 'req-trace-abc-123';
    const res1 = await app.app.request('/api/health', {
      headers: { 'x-correlation-id': incoming },
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('x-correlation-id'), incoming);

    const res2 = await app.app.request('/api/health');
    assert.equal(res2.status, 200);
    const minted = res2.headers.get('x-correlation-id');
    assert.ok(minted && minted.length > 8);
  });

  it('emits structured JSON logs with correlationId while redacting PII and secrets', () => {
    const lines: string[] = [];
    const logger = createLogger({
      service: 'dewa-backend',
      sink: (line) => lines.push(line),
    });

    runWithCorrelation('corr-pii-test', () => {
      logger.info('Advisory request from alice@example.com on 2026-10-06 for €1,500.00', {
        iban: 'DE89370400440532013000',
        authorization: 'Bearer secret-token-123456',
      });
    });

    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]!) as Record<string, unknown>;
    assert.equal(parsed.correlationId, 'corr-pii-test');
    assert.equal(parsed.service, 'dewa-backend');
    assert.ok(String(parsed.message).includes('[REDACTED_EMAIL]'));
    assert.ok(String(parsed.message).includes('2026-10-06'));
    assert.ok(String(parsed.message).includes('€1,500.00'));
    assert.equal(parsed.iban, '[REDACTED_IBAN]');
    assert.equal(parsed.authorization, '[REDACTED_SECRET]');
  });

  it('captures nested OTLP-compatible parent/child spans bound to correlationId', async () => {
    clearSpans();
    await runWithCorrelation('corr-span-42', async () => {
      assert.equal(getCorrelationId(), 'corr-span-42');
      await withSpan('parent.op', { 'http.route': '/api/ai' }, async () => {
        await withSpan('child.tool', { 'tool.name': 'get_cashflow_and_runway' }, async () => 'done');
      });
    });

    const spans = getRecentSpans();
    assert.equal(spans.length, 2);
    const [child, parent] = spans;
    assert.equal(child?.traceId, parent?.traceId);
    assert.equal(child?.parentSpanId, parent?.spanId);
    assert.equal(parent?.correlationId, 'corr-span-42');

    const otlp = exportOtlpResourceSpans();
    assert.equal(otlp.resourceSpans[0]?.scopeSpans[0]?.spans.length, 2);
  });

  it('exposes Prometheus exposition metrics on GET /api/metrics', async () => {
    recordLlmUsage('mock', 250, 500);
    recordGuardrailTrigger('prompt_injection');

    const res = await app.app.request('/api/metrics');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /text\/plain/);
    const body = await res.text();
    assert.match(body, /http_requests_total/);
    assert.match(body, /http_request_duration_ms_bucket/);
    assert.match(body, /outbox_events_depth 0/);
    assert.match(body, /llm_tokens_total\{provider="mock"\}/);
    assert.match(body, /guardrail_triggers_total\{category="prompt_injection"\}/);

    assert.ok(formatPrometheusMetrics().includes('dlq_events_total'));
    assert.equal(typeof correlationMiddleware, 'function');
  });
});
