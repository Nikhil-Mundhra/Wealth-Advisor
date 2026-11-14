import type { MiddlewareHandler } from 'hono';

const LATENCY_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 400, 1000] as const;

interface HistogramData {
  readonly counts: number[];
  sum: number;
  count: number;
}

const httpRequestsTotal = new Map<string, number>();
const httpErrorsTotal = new Map<string, number>();
const httpDurationHist = new Map<string, HistogramData>();
const llmTokensTotal = new Map<string, number>();
const llmCostUsdMicrosTotal = new Map<string, number>();
const guardrailTriggersTotal = new Map<string, number>();

let outboxEventsDepth = 0;
let dlqEventsTotal = 0;

function labelKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
    .join(',');
}

function incMap(map: Map<string, number>, labels: Record<string, string>, delta = 1): void {
  const key = labelKey(labels);
  map.set(key, (map.get(key) ?? 0) + delta);
}

function observeHistogram(map: Map<string, HistogramData>, labels: Record<string, string>, valueMs: number): void {
  const key = labelKey(labels);
  let hist = map.get(key);
  if (!hist) {
    hist = { counts: LATENCY_BUCKETS_MS.map(() => 0), sum: 0, count: 0 };
    map.set(key, hist);
  }
  for (let i = 0; i < LATENCY_BUCKETS_MS.length; i += 1) {
    if (valueMs <= LATENCY_BUCKETS_MS[i]!) {
      hist.counts[i] = (hist.counts[i] ?? 0) + 1;
    }
  }
  hist.sum += valueMs;
  hist.count += 1;
}

export function normalizeRoutePath(path: string): string {
  return path
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
    .replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, '/:uuid');
}

export function recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
  const route = normalizeRoutePath(path);
  const statusStr = String(status);
  incMap(httpRequestsTotal, { method, route, status: statusStr });
  if (status >= 400) {
    incMap(httpErrorsTotal, { method, route, status: statusStr });
  }
  observeHistogram(httpDurationHist, { method, route }, durationMs);
}

export function recordLlmUsage(provider: string, tokens: number, costUsdMicros: number): void {
  incMap(llmTokensTotal, { provider }, tokens);
  incMap(llmCostUsdMicrosTotal, { provider }, costUsdMicros);
}

export function recordGuardrailTrigger(category: string): void {
  incMap(guardrailTriggersTotal, { category });
}

export function setOutboxDepth(pending: number, deadLettered?: number): void {
  outboxEventsDepth = pending;
  if (deadLettered !== undefined) {
    dlqEventsTotal = deadLettered;
  }
}

export function metricsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const durationMs = performance.now() - start;
    // Skip self-scrape noise if desired or record all API routes accurately
    recordHttpRequest(c.req.method, c.req.path, c.res.status, durationMs);
  };
}

export function resetMetrics(): void {
  httpRequestsTotal.clear();
  httpErrorsTotal.clear();
  httpDurationHist.clear();
  llmTokensTotal.clear();
  llmCostUsdMicrosTotal.clear();
  guardrailTriggersTotal.clear();
  outboxEventsDepth = 0;
  dlqEventsTotal = 0;
}

export function formatPrometheusMetrics(): string {
  const lines: string[] = [];

  lines.push('# HELP http_requests_total Total HTTP requests processed by DEWA backend.');
  lines.push('# TYPE http_requests_total counter');
  for (const [labels, val] of httpRequestsTotal.entries()) {
    lines.push(`http_requests_total{${labels}} ${val}`);
  }

  lines.push('# HELP http_errors_total Total HTTP responses with status >= 400.');
  lines.push('# TYPE http_errors_total counter');
  for (const [labels, val] of httpErrorsTotal.entries()) {
    lines.push(`http_errors_total{${labels}} ${val}`);
  }

  lines.push('# HELP http_request_duration_ms HTTP request latency distribution in milliseconds.');
  lines.push('# TYPE http_request_duration_ms histogram');
  for (const [labels, hist] of httpDurationHist.entries()) {
    for (let i = 0; i < LATENCY_BUCKETS_MS.length; i += 1) {
      lines.push(`http_request_duration_ms_bucket{${labels},le="${LATENCY_BUCKETS_MS[i]}"} ${hist.counts[i]}`);
    }
    lines.push(`http_request_duration_ms_bucket{${labels},le="+Inf"} ${hist.count}`);
    lines.push(`http_request_duration_ms_sum{${labels}} ${hist.sum.toFixed(3)}`);
    lines.push(`http_request_duration_ms_count{${labels}} ${hist.count}`);
  }

  lines.push('# HELP outbox_events_depth Pending events waiting in the transactional outbox.');
  lines.push('# TYPE outbox_events_depth gauge');
  lines.push(`outbox_events_depth ${outboxEventsDepth}`);

  lines.push('# HELP dlq_events_total Events routed to dead_letter_events.');
  lines.push('# TYPE dlq_events_total gauge');
  lines.push(`dlq_events_total ${dlqEventsTotal}`);

  lines.push('# HELP llm_tokens_total Estimated LLM tokens consumed per provider.');
  lines.push('# TYPE llm_tokens_total counter');
  for (const [labels, val] of llmTokensTotal.entries()) {
    lines.push(`llm_tokens_total{${labels}} ${val}`);
  }

  lines.push('# HELP llm_cost_usd_micros_total Estimated LLM spend in micro-USD (1e-6 USD).');
  lines.push('# TYPE llm_cost_usd_micros_total counter');
  for (const [labels, val] of llmCostUsdMicrosTotal.entries()) {
    lines.push(`llm_cost_usd_micros_total{${labels}} ${val}`);
  }

  lines.push('# HELP guardrail_triggers_total Count of deterministic/prompt guardrails triggered.');
  lines.push('# TYPE guardrail_triggers_total counter');
  for (const [labels, val] of guardrailTriggersTotal.entries()) {
    lines.push(`guardrail_triggers_total{${labels}} ${val}`);
  }

  return `${lines.join('\n')}\n`;
}
