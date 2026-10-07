#!/usr/bin/env node
// Checks backend module boundaries: a module imports another module only through its public.ts and only along an
// edge listed in docs/module-dependencies.md; the listed edges themselves form no cycle; core imports no
// module.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Paths are relative to the backend repo, the folder above this script.
const EDGES_DOC = 'docs/module-dependencies.md';
const MODULES_DIR = 'src/modules';
const CORE_DIR = 'src/core';
const SOURCE = /\.(ts|tsx|mts|js|mjs)$/;
const PUBLIC_FILE = 'public.ts';

// `| \`from\` | \`to\` |` rows under the `## Edges` heading.
export function parseEdges(markdown) {
  const edges = [];
  let inEdges = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) inEdges = line.slice(3).trim() === 'Edges';
    if (!inEdges) continue;
    const row = /^\|\s*`([a-z0-9-]+)`\s*\|\s*`([a-z0-9-]+)`\s*\|/.exec(line);
    if (row) edges.push([row[1], row[2]]);
  }
  return edges;
}

// Returns one cycle as a module path (first module repeated at the end), or null.
export function findCycle(edges) {
  const next = new Map();
  for (const [from, to] of edges) next.set(from, [...(next.get(from) ?? []), to]);
  const state = new Map();
  const visit = (node, path) => {
    if (state.get(node) === 'done') return null;
    if (state.get(node) === 'open') return [...path.slice(path.indexOf(node)), node];
    state.set(node, 'open');
    for (const target of next.get(node) ?? []) {
      const cycle = visit(target, [...path, node]);
      if (cycle) return cycle;
    }
    state.set(node, 'done');
    return null;
  };
  for (const node of next.keys()) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return null;
}

// Comments are blanked, not removed, so match offsets still give the right line numbers.
function blankComments(text) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');
  return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/^[ \t]*\/\/.*$/gm, blank);
}

const IMPORT_PATTERNS = [
  /(?:^|[\s;])(?:import|export)\b[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /(?:^|[\s;])import\s*['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

export function importsOf(text) {
  const source = blankComments(text);
  const found = [];
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index + match[0].indexOf(match[1])).split('\n').length;
      found.push({ specifier: match[1], line });
    }
  }
  return found.sort((a, b) => a.line - b.line);
}

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (SOURCE.test(name)) out.push(path);
  }
  return out;
}

// Path of the imported file relative to the modules folder, or null when the import leaves it (core, packages).
function targetInModules(modulesDir, file, specifier) {
  let absolute;
  if (specifier.startsWith('.')) absolute = resolve(dirname(file), specifier);
  else if (specifier.startsWith('#modules/')) absolute = join(modulesDir, specifier.slice('#modules/'.length));
  else return null;
  const path = relative(modulesDir, absolute);
  return path.startsWith('..') ? null : path.split(sep).join('/');
}

export function checkModuleDeps(root) {
  const edges = parseEdges(readFileSync(join(root, EDGES_DOC), 'utf8'));
  const allowed = new Set(edges.map(([from, to]) => `${from}→${to}`));
  const modulesDir = join(root, MODULES_DIR);
  const modules = readdirSync(modulesDir).filter((name) => statSync(join(modulesDir, name)).isDirectory());
  const violations = [];
  for (const from of modules) {
    for (const file of sourceFiles(join(modulesDir, from))) {
      for (const { specifier, line } of importsOf(readFileSync(file, 'utf8'))) {
        const target = targetInModules(modulesDir, file, specifier);
        if (target === null) continue;
        const to = target.includes('/') ? target.slice(0, target.indexOf('/')) : null;
        if (to === from) continue;
        const where = `${relative(root, file).split(sep).join('/')}:${line}`;
        if (to === null) {
          violations.push({ kind: 'outside-module', where, from, to: target, specifier });
          continue;
        }
        if (target !== `${to}/${PUBLIC_FILE}`) violations.push({ kind: 'non-public', where, from, to, specifier });
        if (!allowed.has(`${from}→${to}`)) violations.push({ kind: 'off-graph', where, from, to, specifier });
      }
    }
  }
  violations.push(...coreViolations(root, modulesDir));
  return { edges, cycle: findCycle(edges), violations };
}

function coreViolations(root, modulesDir) {
  const coreDir = join(root, CORE_DIR);
  if (!existsSync(coreDir)) return [];
  const violations = [];
  for (const file of sourceFiles(coreDir)) {
    for (const { specifier, line } of importsOf(readFileSync(file, 'utf8'))) {
      const target = targetInModules(modulesDir, file, specifier);
      if (target === null) continue;
      const where = `${relative(root, file).split(sep).join('/')}:${line}`;
      violations.push({ kind: 'core-imports-module', where, from: 'core', to: target, specifier });
    }
  }
  return violations;
}

const MESSAGES = {
  'non-public': (v) => `${v.from} imports ${v.specifier}; import ${v.to}/${PUBLIC_FILE} instead`,
  'off-graph': (v) => `${v.from} → ${v.to} is not an edge in ${EDGES_DOC}`,
  'outside-module': (v) => `${v.from} imports ${v.to}, which belongs to no module`,
  'core-imports-module': (v) => `core imports ${v.specifier}; core holds mechanisms and never imports modules`,
};

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (!existsSync(join(root, EDGES_DOC))) {
    console.error(`module-deps: ${EDGES_DOC} is missing`);
    process.exit(1);
  }
  const { edges, cycle, violations } = checkModuleDeps(root);
  const errors = violations.map((v) => `[${v.kind}] ${v.where}: ${MESSAGES[v.kind](v)}`);
  if (cycle) errors.push(`[cycle] ${EDGES_DOC}: ${cycle.join(' → ')}`);
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    console.error(`module-deps: ${errors.length} problem(s)`);
    process.exit(1);
  }
  console.log(`module-deps: ok (${edges.length} allowed edges)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
