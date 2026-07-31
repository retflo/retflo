import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { loadGraph } from '../src/graph.js';
import { searchNodes } from '../src/search.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let graph;
before(async () => { graph = await loadGraph(REPO); });

test('exact alias phrase routes to its node', () => {
  const { matches } = searchNodes(graph, 'prove your system would work');
  assert.ok(matches.includes('RHET.BURDEN.1'), `got ${matches}`);
});

test('alias embedded in a longer objection still routes', () => {
  const { matches } = searchNodes(graph, "look, the burden is on you to show an alternative that works");
  assert.ok(matches.includes('RHET.BURDEN.1'), `got ${matches}`);
});

test('nonsense query misses but still yields nearest territory', () => {
  const { matches, nearest } = searchNodes(graph, 'quantum yogurt telescope firmware');
  assert.equal(matches.length, 0);
  assert.ok(nearest.length <= 3);
});

test('results are capped at limit', () => {
  const { matches } = searchNodes(graph, 'state power hierarchy capitalism property', 3);
  assert.ok(matches.length <= 3);
});

test('landlord/rent voluntarism phrasing routes to the boomerang node', () => {
  const { matches } = searchNodes(graph, 'voluntary exchange exit landlord consent coercion');
  assert.ok(matches.includes('RHET.BOOMERANG.1'), `got ${matches}`);
});
