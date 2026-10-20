#!/usr/bin/env node
/**
 * AI Platform Health Checker CLI
 * 
 * Tests the health, connectivity, and responsiveness of configured AI platform providers
 * (e.g. OpenRouter, Gemini, OpenAI, Claude, Mock) on a deployed or local instance.
 * 
 * Usage:
 *   node scripts/check-ai-health.mjs [options]
 * 
 * Options:
 *   --url <url>            Target baseUrl (default: https://wealth-advisor-ai.vercel.app)
 *   --email <email>        Admin email (default: Shenzhen@Fintechathon.com or env ADMIN_EMAIL)
 *   --password <pwd>       Admin password (default: 12345678987654321 or env ADMIN_PASSWORD)
 *   --token <jwt>          Admin Bearer token (bypasses login if provided)
 *   --provider <name>      Check specific provider (openrouter, gemini, openai, claude, mock)
 *   --test-chat            Send an advisory chat query to verify end-to-end inference
 *   --help                 Display this help message
 */

import { parseArgs } from 'node:util';

const DEFAULT_URL = process.env.TARGET_URL || 'https://wealth-advisor-ai.vercel.app';
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Shenzhen@Fintechathon.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678987654321';

const options = {
  url: { type: 'string', default: DEFAULT_URL },
  email: { type: 'string', default: DEFAULT_ADMIN_EMAIL },
  password: { type: 'string', default: DEFAULT_ADMIN_PASSWORD },
  token: { type: 'string' },
  provider: { type: 'string' },
  'test-chat': { type: 'boolean', default: false },
  help: { type: 'boolean', default: false },
};

let args;
try {
  args = parseArgs({ options, allowPositionals: true }).values;
} catch (err) {
  console.error(`Argument error: ${err.message}`);
  process.exit(1);
}

if (args.help) {
  console.log(`
AI Platform Health Checker

Usage:
  node scripts/check-ai-health.mjs [options]
  npm run check-ai [-- options]

Options:
  --url <url>            Target URL (default: ${DEFAULT_URL})
  --email <email>        Admin email
  --password <password>  Admin password
  --token <token>        Admin Bearer token
  --provider <name>      Check single provider (openrouter, gemini, openai, claude, mock)
  --test-chat            Also execute an advisory chat turn
  --help                 Show this help message
`);
  process.exit(0);
}

const targetUrl = (args.url || DEFAULT_URL).replace(/\/+$/, '');

async function obtainToken() {
  if (args.token) return args.token;

  const loginUrl = `${targetUrl}/api/auth/login`;
  process.stdout.write(`Authenticating as admin (${args.email}) at ${targetUrl}... `);

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: args.email,
      password: args.password,
    }),
  }).catch((err) => {
    console.log('[FAILED]');
    console.error(`Network error connecting to ${loginUrl}: ${err.message}`);
    process.exit(1);
  });

  if (!res.ok) {
    console.log('[FAILED]');
    const errText = await res.text().catch(() => '');
    console.error(`Login failed with HTTP ${res.status}: ${errText}`);
    process.exit(1);
  }

  const data = await res.json();
  if (!data?.accessToken) {
    console.log('[FAILED]');
    console.error('Login response missing accessToken');
    process.exit(1);
  }

  console.log('[OK]');
  return data.accessToken;
}

async function checkHealth(token) {
  const providerParam = args.provider ? `?provider=${encodeURIComponent(args.provider)}` : '';
  const healthUrl = `${targetUrl}/api/admin/models/health${providerParam}`;

  process.stdout.write(`Probing AI health status from ${healthUrl}... `);
  const start = Date.now();
  const res = await fetch(healthUrl, {
    headers: { authorization: `Bearer ${token}` },
  }).catch((err) => {
    console.log('[FAILED]');
    console.error(`Failed to reach health endpoint: ${err.message}`);
    process.exit(1);
  });

  if (!res.ok) {
    console.log('[FAILED]');
    const errText = await res.text().catch(() => '');
    console.error(`Health check answered HTTP ${res.status}: ${errText}`);
    process.exit(1);
  }

  const duration = Date.now() - start;
  console.log(`[OK in ${duration}ms]`);

  const report = await res.json();
  return report;
}

async function testAdvisoryChat(token) {
  const chatUrl = `${targetUrl}/api/advisory/chat`;
  console.log(`\nTesting End-to-End Advisory Chat Turn via ${chatUrl}:`);
  const payload = {
    message: 'What is our current liquid runway buffer and portfolio rebalance recommendation?',
    locale: 'en',
    householdMode: 'INDIVIDUAL',
  };

  const start = Date.now();
  const res = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error(`Chat connection error: ${err.message}`);
    return null;
  });

  if (!res) return false;

  const duration = Date.now() - start;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.log(`[FAILED with HTTP ${res.status} in ${duration}ms]`);
    console.log(`Error Response: ${errText}`);
    return false;
  }

  const json = await res.json();
  console.log(`[SUCCESS in ${duration}ms]`);
  console.log(`Reply: "${json.reply?.slice(0, 160)}..."`);
  return true;
}

function printHealthTable(report) {
  console.log('\n================================================================================');
  console.log(`AI PLATFORM HEALTH REPORT: ${targetUrl}`);
  console.log(`Active Platform Provider: ${report.activeProvider.toUpperCase()}`);
  console.log(`Checked At:               ${report.checkedAt}`);
  console.log('================================================================================');

  const headers = ['PROVIDER', 'STATUS', 'LATENCY', 'KEY SOURCE', 'MASKED KEY', 'DETAILS'];
  const rows = report.providers.map((p) => {
    const latency = p.latencyMs !== null ? `${p.latencyMs}ms` : '-';
    const masked = p.maskedKey || (p.provider === 'mock' ? 'n/a' : 'none');
    const details = p.error ? `Error: ${p.error}` : p.message || '';
    return [
      p.provider,
      p.status,
      latency,
      p.source,
      masked,
      details.length > 40 ? `${details.slice(0, 37)}...` : details,
    ];
  });

  // Calculate column widths
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));

  const formatRow = (cols) =>
    cols.map((c, i) => c.padEnd(colWidths[i])).join(' | ');

  console.log(formatRow(headers));
  console.log(colWidths.map((w) => '-'.repeat(w)).join('-+-'));
  for (const r of rows) {
    console.log(formatRow(r));
  }
  console.log('================================================================================\n');
}

async function main() {
  const token = await obtainToken();
  const report = await checkHealth(token);
  printHealthTable(report);

  if (args['test-chat']) {
    await testAdvisoryChat(token);
  }

  // If a specific provider was requested, check if it was healthy
  if (args.provider) {
    const match = report.providers.find((p) => p.provider === args.provider);
    if (!match || !match.healthy) {
      console.error(`Target provider "${args.provider}" is UNHEALTHY or NOT_CONFIGURED.`);
      process.exit(1);
    }
  }

  // If the active provider is unhealthy, exit with code 1
  const activeMatch = report.providers.find((p) => p.provider === report.activeProvider);
  if (activeMatch && !activeMatch.healthy) {
    console.error(`Active provider "${report.activeProvider}" is not healthy.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
