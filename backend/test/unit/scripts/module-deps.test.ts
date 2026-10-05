import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';

interface Violation {
  readonly kind: 'non-public' | 'off-graph' | 'outside-module' | 'core-imports-module';
  readonly where: string;
  readonly from: string;
  readonly to: string;
}

interface ModuleDeps {
  parseEdges(markdown: string): [string, string][];
  findCycle(edges: [string, string][]): string[] | null;
  checkModuleDeps(root: string): { edges: [string, string][]; cycle: string[] | null; violations: Violation[] };
}

// The checker is a plain .mjs script with no type declarations, so it is loaded through a computed specifier.
const SCRIPT = new URL('../../../../scripts/module-deps.mjs', import.meta.url).href;

const EDGES_DOC = `# Module dependencies

## Edges
| From | To |
|---|---|
| \`analytics\` | \`market\` |

## Properties
| \`not\` | \`an-edge\` |
`;

const FIXTURE: Record<string, string> = {
  'docs/backend/module-dependencies.md': EDGES_DOC,
  'backend/src/modules/index.ts': "import { createMarketModule } from './market/market.module.ts';\n",
  'backend/src/modules/market/public.ts': "export type { Money } from './domain/money.ts';\n",
  'backend/src/modules/market/domain/money.ts': 'export interface Money { amount: number }\n',
  'backend/src/modules/market/market.api.ts': [
    "import type { Clock } from '#core/time/clock.ts';",
    "import { z } from 'zod';",
    "import type { Money } from './domain/money.ts';",
    "import type { Snapshot } from '../analytics/public.ts';",
  ].join('\n'),
  'backend/src/modules/analytics/public.ts': 'export interface Snapshot { asOf: string }\n',
  'backend/src/modules/analytics/analytics.api.ts': [
    '// import { nothing } from "../market/domain/money.ts";',
    "import type { Money } from '../market/public.ts';",
    'import {',
    '  type Money as Cash,',
    "} from '../market/domain/money.ts';",
  ].join('\n'),
  'backend/src/modules/auth/auth.module.ts': "import { env } from '#core/config/env.ts';\n",
  'backend/src/core/time/clock.ts': "import type { Db } from 'mongodb';\n",
  'backend/src/core/http/alias.ts': "import type { Money } from '#modules/market/public.ts';\n",
  'backend/src/core/http/relative.ts': "\nimport { createMarketModule } from '../../modules/market/market.module.ts';\n",
};

describe('module-deps', () => {
  let root: string;
  let deps: ModuleDeps;

  before(async () => {
    deps = (await import(SCRIPT)) as ModuleDeps;
    root = mkdtempSync(join(tmpdir(), 'module-deps-'));
    for (const [path, content] of Object.entries(FIXTURE)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
  });

  after(() => rmSync(root, { recursive: true, force: true }));

  it('reads edges only from the Edges table', () => {
    assert.deepEqual(deps.parseEdges(EDGES_DOC), [['analytics', 'market']]);
  });

  it('allows a public.ts import along an edge and flags non-public and off-graph imports', () => {
    const { violations, cycle } = deps.checkModuleDeps(root);
    assert.equal(cycle, null);
    const found = violations.map(({ kind, where, from, to }) => ({ kind, where, from, to }));
    assert.deepEqual(found.filter((v) => v.from !== 'core'), [
      { kind: 'non-public', where: 'backend/src/modules/analytics/analytics.api.ts:5', from: 'analytics', to: 'market' },
      { kind: 'off-graph', where: 'backend/src/modules/market/market.api.ts:4', from: 'market', to: 'analytics' },
    ]);
  });

  it('flags any core import of a module file, by alias or relative path, even public.ts', () => {
    const found = deps.checkModuleDeps(root).violations.filter((v) => v.from === 'core');
    assert.deepEqual(
      found.map(({ kind, where, to }) => ({ kind, where, to })).sort((a, b) => a.where.localeCompare(b.where)),
      [
        { kind: 'core-imports-module', where: 'backend/src/core/http/alias.ts:1', to: 'market/public.ts' },
        { kind: 'core-imports-module', where: 'backend/src/core/http/relative.ts:2', to: 'market/market.module.ts' },
      ],
    );
  });

  it('finds a cycle in the edge list', () => {
    assert.equal(deps.findCycle([['a', 'b'], ['b', 'c']]), null);
    assert.deepEqual(deps.findCycle([['a', 'b'], ['b', 'c'], ['c', 'a']]), ['a', 'b', 'c', 'a']);
  });
});
