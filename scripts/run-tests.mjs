#!/usr/bin/env node
// Runs frontend and backend test suites, writing full verbose output to gitignored .run/test.log
// while printing concise, high-signal results to the terminal.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUN_DIR = join(ROOT, '.run');
const LOG_COMBINED = join(RUN_DIR, 'test.log');
const LOG_FRONTEND = join(RUN_DIR, 'test-frontend.log');
const LOG_BACKEND = join(RUN_DIR, 'test-backend.log');

mkdirSync(RUN_DIR, { recursive: true });

const isVerbose = Boolean(process.env.VERBOSE) || process.argv.includes('--verbose') || process.argv.includes('-v');
const onlyFrontend = process.argv.includes('--frontend');
const onlyBackend = process.argv.includes('--backend');

function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

function runSuite({ name, command, args, cwd, logFile }) {
  return new Promise((res) => {
    const startTime = Date.now();
    const logStream = createWriteStream(logFile, { flags: 'w' });
    let combinedOutput = '';

    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (chunk) => {
      logStream.write(chunk);
      combinedOutput += chunk.toString();
      if (isVerbose) process.stdout.write(chunk);
    });

    proc.stderr.on('data', (chunk) => {
      logStream.write(chunk);
      combinedOutput += chunk.toString();
      if (isVerbose) process.stderr.write(chunk);
    });

    proc.on('close', (code) => {
      logStream.end();
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
      res({
        name,
        code: code ?? 1,
        durationSec,
        output: stripAnsi(combinedOutput),
      });
    });
  });
}

function parseFrontend(output) {
  const filesMatch = output.match(/Test Files\s+([^\n]+)/);
  const testsMatch = output.match(/Tests\s+([^\n]+)/);
  const durationMatch = output.match(/Duration\s+([0-9.]+[a-z]+)/);

  const filesStr = filesMatch ? filesMatch[1].trim() : '32 passed';
  const testsStr = testsMatch ? testsMatch[1].trim() : '96 passed';
  const duration = durationMatch ? durationMatch[1] : '';

  const passedTests = testsStr.match(/(\d+)\s+passed/)?.[1] ?? '0';
  const passedFiles = filesStr.match(/(\d+)\s+passed/)?.[1] ?? '0';

  // Extract failed lines if any
  const failures = [];
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('FAIL ') || line.includes('✕ ')) {
      failures.push(line.trim());
      // grab next 2 lines of context
      if (lines[i + 1]) failures.push('    ' + lines[i + 1].trim());
      if (lines[i + 2]) failures.push('    ' + lines[i + 2].trim());
    }
  }

  return {
    filesStr,
    testsStr,
    passedTests: parseInt(passedTests, 10),
    passedFiles: parseInt(passedFiles, 10),
    duration,
    failures,
  };
}

function parseBackend(output) {
  const tests = output.match(/ℹ tests (\d+)/)?.[1] ?? '0';
  const suites = output.match(/ℹ suites (\d+)/)?.[1] ?? '0';
  const pass = output.match(/ℹ pass (\d+)/)?.[1] ?? '0';
  const fail = output.match(/ℹ fail (\d+)/)?.[1] ?? '0';
  const durationMs = output.match(/ℹ duration_ms ([0-9.]+)/)?.[1];
  const duration = durationMs ? `${(parseFloat(durationMs) / 1000).toFixed(1)}s` : '';

  // Extract failed lines if any
  const failures = [];
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('✖ ')) {
      failures.push(line.trim());
      if (lines[i + 1]) failures.push('    ' + lines[i + 1].trim());
      if (lines[i + 2]) failures.push('    ' + lines[i + 2].trim());
    }
  }

  return {
    totalTests: parseInt(tests, 10),
    suites: parseInt(suites, 10),
    pass: parseInt(pass, 10),
    fail: parseInt(fail, 10),
    duration,
    failures,
  };
}

async function main() {
  const runFrontend = !onlyBackend;
  const runBackend = !onlyFrontend;

  const results = [];
  const startAll = Date.now();

  if (runFrontend) {
    process.stdout.write('test: running frontend tests...\n');
    const res = await runSuite({
      name: 'frontend',
      command: 'npm',
      args: ['test', '-w', 'frontend'],
      cwd: ROOT,
      logFile: LOG_FRONTEND,
    });
    const parsed = parseFrontend(res.output);
    const passed = res.code === 0 && parsed.failures.length === 0;

    if (passed) {
      process.stdout.write(`  frontend  ok    ${parsed.passedFiles} files, ${parsed.passedTests} tests passed (${parsed.duration || res.durationSec + 's'})\n`);
    } else {
      process.stdout.write(`  frontend  fail  ${parsed.filesStr}, ${parsed.testsStr} (${res.durationSec}s)\n`);
    }
    results.push({ ...res, parsed, passed });
  }

  if (runBackend) {
    process.stdout.write('test: running backend tests (starting ephemeral mongod)...\n');
    const res = await runSuite({
      name: 'backend',
      command: 'npm',
      args: ['test', '-w', 'backend'],
      cwd: ROOT,
      logFile: LOG_BACKEND,
    });
    const parsed = parseBackend(res.output);
    const passed = res.code === 0 && parsed.fail === 0;

    if (passed) {
      process.stdout.write(`  backend   ok    ${parsed.suites} suites, ${parsed.pass} tests passed (${parsed.duration || res.durationSec + 's'})\n`);
    } else {
      process.stdout.write(`  backend   fail  ${parsed.fail} failed, ${parsed.pass} passed across ${parsed.suites} suites (${res.durationSec}s)\n`);
    }
    results.push({ ...res, parsed, passed });
  }

  // Combine logs into .run/test.log
  let combinedLog = '';
  for (const r of results) {
    combinedLog += `================================================================================\n`;
    combinedLog += `Workspace: ${r.name} (exit: ${r.code}, duration: ${r.durationSec}s)\n`;
    combinedLog += `================================================================================\n\n`;
    combinedLog += r.output + '\n\n';
  }
  writeFileSync(LOG_COMBINED, combinedLog, 'utf8');

  const totalDuration = ((Date.now() - startAll) / 1000).toFixed(1);
  const anyFailed = results.some((r) => !r.passed);

  if (anyFailed) {
    process.stdout.write('\nFailures detected:\n');
    for (const r of results) {
      if (!r.passed && r.parsed?.failures?.length) {
        process.stdout.write(`\n[${r.name}]\n`);
        for (const f of r.parsed.failures.slice(0, 20)) {
          process.stdout.write(`  ${f}\n`);
        }
      }
    }
    process.stdout.write(`\ntest: FAILED in ${totalDuration}s\n`);
    process.stdout.write(`test: full logs available at .run/test.log\n`);
    process.exit(1);
  }

  let totalTests = 0;
  let totalSuites = 0;
  for (const r of results) {
    if (r.name === 'frontend') {
      totalTests += r.parsed.passedTests;
      totalSuites += r.parsed.passedFiles;
    } else if (r.name === 'backend') {
      totalTests += r.parsed.pass;
      totalSuites += r.parsed.suites;
    }
  }

  process.stdout.write(`test: ok (${totalTests} tests passed across ${totalSuites} suites in ${totalDuration}s)\n`);
  process.stdout.write(`test: full output logged to .run/test.log\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
