#!/usr/bin/env node
// Checks the agent-guide and docs graph: one-way edges, one owner per mapped path, no dangling paths,
// an index.md in every docs folder, and every guide or doc reachable from the entry point.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'CLAUDE.md';
// A backticked token or map path is checked only when it starts at one of these repo-root entries.
const ROOTS = new Set([
  'agents', 'docs', 'backend', 'frontend', 'contracts', 'rules', 'infra', 'scripts',
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'Makefile', 'package.json', 'package-lock.json', 'vercel.json',
  '.gitignore', '.vercelignore',
]);
// Build output and local state: referenced on purpose, absent until something generates them.
const GENERATED = new Set(['dist', 'node_modules', '.run', '.vercel']);

const errors = [];
const fail = (check, file, message) => errors.push(`${check} ${file}: ${message}`);

const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const exists = (path) => existsSync(join(ROOT, path));

function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const path = `${dir}/${name}`;
    if (statSync(join(ROOT, path)).isDirectory()) walk(path, out);
    else if (name.endsWith('.md')) out.push(path);
  }
  return out;
}

function dirsUnder(dir, out = [dir]) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const path = `${dir}/${name}`;
    if (!statSync(join(ROOT, path)).isDirectory()) continue;
    out.push(path);
    dirsUnder(path, out);
  }
  return out;
}

// Returns { heading: body } for every `## ` section; text before the first heading is under ''.
function sections(text) {
  const result = { '': [] };
  let current = '';
  let fenced = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && line.startsWith('## ')) {
      current = line.slice(3).trim();
      result[current] = [];
    } else {
      result[current].push(line);
    }
  }
  return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.join('\n')]));
}

// Lines inside non-Mermaid code fences.
function fencedLines(text) {
  const lines = [];
  let fence = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      fence = fence === null ? line.slice(3).trim() : null;
      continue;
    }
    if (fence !== null && fence !== 'mermaid') lines.push(line);
  }
  return lines;
}

const mapPath = (line) => /^(\S+) : \S/.exec(line)?.[1];
const backticked = (text) => [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
const linked = (text, from) =>
  [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((m) => m[1])
    .filter((target) => !/^[a-z]+:/.test(target) && !target.startsWith('#'))
    .map((target) => relative(ROOT, resolve(ROOT, dirname(from), target.split('#')[0])));

// A token names a repo path when it starts at a known root and holds no placeholder or glob.
function asRepoPath(token) {
  const path = token.replace(/:\d.*$/, '').replace(/#.*$/, '').replace(/\/$/, '');
  if (!path || /[<>*{}$|\s]/.test(path)) return null;
  const segments = path.split('/');
  if (!ROOTS.has(segments[0])) return null;
  if (segments.some((segment) => GENERATED.has(segment))) return null;
  return path;
}

const agentFiles = ['AGENTS.md', ...(exists('agents') ? walk('agents') : [])];
const docFiles = exists('docs') ? walk('docs') : [];
const allMd = [ENTRY, ...agentFiles, ...docFiles];

// (a) docs never link to agents/
for (const file of docFiles) {
  read(file)
    .split('\n')
    .forEach((line, i) => {
      if (/(^|[^A-Za-z0-9_-])agents\//.test(line)) fail('[docs→agents]', `${file}:${i + 1}`, line.trim());
    });
}

// (b) a source path appears in at most one guide map; (f) map lines are sorted by path
const owners = new Map();
for (const file of agentFiles) {
  const map = sections(read(file))['File structure'];
  if (!map) continue;
  const paths = fencedLines(map).map(mapPath).filter(Boolean);
  paths.forEach((path, i) => {
    if (i > 0 && paths[i - 1] > path) fail('[unsorted map]', file, `${path} after ${paths[i - 1]}`);
    owners.set(path, [...(owners.get(path) ?? []), file]);
  });
}
for (const [path, files] of owners) {
  if (files.length > 1) fail('[two maps]', path, files.join(', '));
}

// (g) every tracked or new source file has an owning map; .md files are inventoried by indexes and routes
const sourceFiles = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((path) => path && exists(path) && !path.endsWith('.md') && path !== 'package-lock.json');
for (const path of sourceFiles) {
  if (!owners.has(path)) fail('[unmapped]', path, 'no guide `## File structure` lists it');
}

// (c) every referenced repo path exists
for (const file of allMd) {
  const text = read(file);
  const tokens = [...backticked(text), ...fencedLines(text).map(mapPath).filter(Boolean)];
  for (const token of tokens) {
    const path = asRepoPath(token);
    if (path && !exists(path)) fail('[missing path]', file, path);
  }
  for (const path of linked(text, file)) {
    if (!exists(path)) fail('[missing link]', file, path);
  }
}

// (d) every docs folder has an index.md
if (exists('docs')) {
  for (const dir of dirsUnder('docs')) {
    if (!exists(`${dir}/index.md`)) fail('[no index]', dir, 'missing index.md');
  }
}

// (e) every guide and doc is reachable from the entry point through @imports, Route/Calls lines and index maps
function edges(file) {
  const text = read(file);
  if (file === ENTRY) return [...text.matchAll(/^@(\S+)/gm)].map((m) => m[1]);
  if (file.startsWith('docs/')) {
    if (!file.endsWith('/index.md')) return [];
    return fencedLines(text).map(mapPath).filter(Boolean);
  }
  const parts = sections(text);
  return backticked([parts.Route, parts.Axes, parts.Calls].join('\n')).filter((token) => token.endsWith('.md'));
}
const reached = new Set();
const queue = [ENTRY];
while (queue.length > 0) {
  const file = queue.shift();
  if (reached.has(file) || !exists(file)) continue;
  reached.add(file);
  queue.push(...edges(file).filter((path) => path.endsWith('.md')));
}
for (const file of [...agentFiles, ...docFiles]) {
  if (!reached.has(file)) fail('[unreachable]', file, `no Route, Axes, Calls or index edge from ${ENTRY}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`docs-lint: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`docs-lint: ok (${allMd.length} files, ${owners.size} mapped paths, ${reached.size} reachable)`);
