import { cpus, totalmem } from 'node:os';
import { serve } from '@hono/node-server';

interface StageReport {
  readonly concurrency: number;
  readonly totalRequests: number;
  readonly errors: number;
  readonly rps: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly slaBreached: boolean;
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Number((sorted[idx] ?? 0).toFixed(2));
}

async function runStage(baseUrl: string, concurrency: number, roundsPerWorker: number): Promise<StageReport> {
  const latencies: number[] = [];
  let errors = 0;
  const startedAll = performance.now();

  const workers = Array.from({ length: concurrency }, async (_, workerIdx) => {
    for (let r = 0; r < roundsPerWorker; r += 1) {
      const pick = (workerIdx + r) % 4;
      const t0 = performance.now();
      try {
        let res: Response;
        if (pick === 0) {
          res = await fetch(`${baseUrl}/api/health`);
        } else if (pick === 1) {
          res = await fetch(`${baseUrl}/api/finance/cashflow?householdMode=FAMILY_HOUSEHOLD`);
        } else if (pick === 2) {
          res = await fetch(`${baseUrl}/api/wealth/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdMode: 'FAMILY_HOUSEHOLD' }),
          });
        } else {
          res = await fetch(`${baseUrl}/api/advisory/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Summarize my liquidity runway and currency corridor.',
              locale: 'en',
              householdMode: 'FAMILY_HOUSEHOLD',
            }),
          });
        }
        await res.arrayBuffer();
        if (!res.ok) errors += 1;
      } catch {
        errors += 1;
      }
      latencies.push(performance.now() - t0);
    }
  });

  await Promise.all(workers);
  const elapsedSec = Math.max(0.001, (performance.now() - startedAll) / 1000);
  latencies.sort((a, b) => a - b);

  const p50Ms = percentile(latencies, 50);
  const p95Ms = percentile(latencies, 95);
  const p99Ms = percentile(latencies, 99);
  const maxMs = percentile(latencies, 100);
  const totalRequests = latencies.length;
  const errorRate = totalRequests > 0 ? errors / totalRequests : 0;

  return {
    concurrency,
    totalRequests,
    errors,
    rps: Number((totalRequests / elapsedSec).toFixed(1)),
    p50Ms,
    p95Ms,
    p99Ms,
    maxMs,
    slaBreached: p99Ms >= 400 || errorRate > 0.01,
  };
}

async function main(): Promise<void> {
  // Force isolated memory store + suppress per-request logs during load sweep.
  process.env.DATA_STORE = 'memory';
  process.env.NODE_ENV = 'test';

  const { default: app } = await import('../app.ts');

  const server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' });
  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Warmup JIT and caches
    await runStage(baseUrl, 5, 4);

    const stages = [10, 50, 100, 200, 350, 500];
    const results: StageReport[] = [];

    console.log(`DEWA Load Benchmark (Node ${process.version}, ${cpus()[0]?.model ?? 'unknown CPU'}, ${Math.round(totalmem() / (1024 ** 3))} GiB RAM)`);
    console.log('Target mix: 25% /api/health, 25% /api/finance/cashflow, 25% /api/wealth/optimize, 25% /api/advisory/chat');
    console.log('concurrency | requests | errors |     RPS |  P50 ms |  P95 ms |  P99 ms |  Max ms | SLA (<400ms P99 & <1% err)');
    console.log('------------+----------+--------+---------+---------+---------+---------+---------+---------------------------');

    let breakingStage: StageReport | undefined;
    for (const c of stages) {
      const rounds = c <= 100 ? 6 : 4;
      const report = await runStage(baseUrl, c, rounds);
      results.push(report);
      if (!breakingStage && report.slaBreached) {
        breakingStage = report;
      }
      console.log(
        `${String(report.concurrency).padStart(11)} | ${String(report.totalRequests).padStart(8)} | ${String(report.errors).padStart(6)} | ${String(report.rps).padStart(7)} | ${String(report.p50Ms).padStart(7)} | ${String(report.p95Ms).padStart(7)} | ${String(report.p99Ms).padStart(7)} | ${String(report.maxMs).padStart(7)} | ${report.slaBreached ? 'BREACHED' : 'OK'}`,
      );
    }

    const peakClean = results.filter((r) => !r.slaBreached).at(-1);
    if (breakingStage) {
      console.log(`\nBreaking point reached at ${breakingStage.concurrency} concurrent workers (P99=${breakingStage.p99Ms}ms, errors=${breakingStage.errors}/${breakingStage.totalRequests}).`);
    } else if (peakClean) {
      console.log(`\nZero SLA breaches up to ${peakClean.concurrency} concurrent workers (peak ${peakClean.rps} RPS, P99=${peakClean.p99Ms}ms).`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

await main();
