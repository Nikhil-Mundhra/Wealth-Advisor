import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const problems = [];

function checkContains(file, patterns, label) {
  const content = readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (!content.includes(p)) {
      problems.push(`${file} (${label}): missing expected directive "${p}"`);
    }
  }
}

function checkHclBraces(file) {
  const content = readFileSync(file, 'utf8');
  let depth = 0;
  for (const ch of content) {
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    if (depth < 0) {
      problems.push(`${file}: unmatched closing brace '}'`);
      return;
    }
  }
  if (depth !== 0) {
    problems.push(`${file}: unclosed brace block (balance=${depth})`);
  }
}

// 1. Validate Dockerfiles enforce non-root or slim Alpine runtime + HEALTHCHECK
checkContains('infra/docker/backend.Dockerfile', ['FROM node:24-alpine', 'USER node', 'HEALTHCHECK'], 'backend Dockerfile');
checkContains('infra/docker/frontend.Dockerfile', ['FROM node:24-alpine', 'FROM nginx:1.29-alpine', 'HEALTHCHECK'], 'frontend Dockerfile');

// 2. Validate Cloud Run Terraform Always Free constraints & Secret Manager wiring
for (const tf of ['versions.tf', 'variables.tf', 'main.tf', 'outputs.tf']) {
  checkHclBraces(`infra/terraform/${tf}`);
}
checkContains(
  'infra/terraform/main.tf',
  ['google_cloud_run_v2_service', 'min_instance_count = 0', 'secret_key_ref', 'roles/secretmanager.secretAccessor'],
  'Cloud Run Free Tier Terraform',
);

// 3. Validate Observability configs exist & reference backend
checkContains('infra/observability/prometheus.yml', ['/api/metrics', 'backend:3000'], 'Prometheus config');
const dashboardFile = 'infra/observability/grafana/dashboards/dewa-overview.json';
try {
  JSON.parse(readFileSync(dashboardFile, 'utf8'));
} catch (err) {
  problems.push(`${dashboardFile}: invalid JSON (${err instanceof Error ? err.message : String(err)})`);
}

// 4. Scan tracked files for accidental private keys or cloud API tokens (ignoring test fixtures)
const tracked = execSync('git ls-files', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((f) => f && !f.includes('test/') && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx') && !f.endsWith('.png') && !f.endsWith('.jpg'));

const secretPatterns = [
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{35}/,
  /sk-[A-Za-z0-9]{20,}/,
  /mongodb\+srv:\/\/[^<\s]+:[^<\s]+@/,
];

for (const file of tracked) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const re of secretPatterns) {
    if (re.test(content)) {
      problems.push(`${file}: potential leaked secret or credential matching ${re}`);
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`[infra-lint] ${p}`);
  process.exit(1);
}

console.log('infra-lint: ok (Dockerfiles, Terraform Free Tier, Prometheus/Grafana, and secret scan passed)');
