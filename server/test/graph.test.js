import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { loadGraph } from '../src/graph.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('loads all node files with parsed frontmatter', async () => {
  const graph = await loadGraph(REPO);
  assert.equal(graph.nodes.size, 66);
  const n = graph.nodes.get('RHET.CIRCULARREALISM');
  assert.ok(n, 'circular realism node present');
  assert.equal(n.domain, 'rhet');
  assert.ok(n.title.length > 0);
  assert.ok(n.aliases.length > 0);
  assert.ok(n.body.includes('#'));
});

test('links are normalized to {type, target, why?}', async () => {
  const graph = await loadGraph(REPO);
  const n = graph.nodes.get('RHET.CIRCULARREALISM');
  const flow = n.links.find(l => l.type === 'flow' && l.target === 'RHET.SURVIVAL');
  assert.ok(flow, 'flow link to survival test exists');
  assert.equal(typeof flow.why, 'string');
});

test('reads graph version from RELEASE_NOTES.md', async () => {
  const graph = await loadGraph(REPO);
  assert.match(graph.version, /^\d+\.\d+\.\d+$/);
});

test('link targets that do not resolve are warnings, not crashes', async () => {
  const graph = await loadGraph(REPO);
  for (const w of graph.warnings) assert.equal(typeof w, 'string');
  for (const node of graph.nodes.values()) {
    for (const l of node.links) {
      if (!graph.nodes.has(l.target)) {
        assert.ok(graph.warnings.some(w => w.includes(l.target)));
      }
    }
  }
});
