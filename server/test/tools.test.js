import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from '../src/graph.js';
import { SessionLog } from '../src/events.js';
import { makeTools } from '../src/tools.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let graph;
before(async () => { graph = await loadGraph(REPO); });

let log, tools, events;
beforeEach(() => {
  log = new SessionLog({ dir: mkdtempSync(join(tmpdir(), 'retflo-')), graphVersion: graph.version });
  events = [];
  log.on('event', ev => events.push(ev));
  tools = makeTools(graph, log);
});

test('search_nodes records a search event with matched coordinates', async () => {
  const res = await tools.search_nodes({ query: 'prove your system would work' });
  assert.ok(res.matches.some(m => m.coordinate === 'RHET.BURDEN.1'));
  const ev = events.find(e => e.type === 'search');
  assert.ok(ev.matches.includes('RHET.BURDEN.1'));
  assert.equal(ev.query, 'prove your system would work');
});

test('search_nodes with no matches records empty search and hints submit_miss', async () => {
  const res = await tools.search_nodes({ query: 'quantum yogurt telescope firmware' });
  assert.equal(res.matches.length, 0);
  assert.ok(res.hint.includes('submit_miss'));
  assert.deepEqual(events.find(e => e.type === 'search').matches, []);
});

test('get_node returns body and records node_fetch with revisit tracking', async () => {
  const a = await tools.get_node({ coordinate: 'RHET.BURDEN.1' });
  assert.ok(a.body.length > 100);
  assert.ok(a.links.length > 0);
  await tools.get_node({ coordinate: 'RHET.BURDEN.1' });
  const fetches = events.filter(e => e.type === 'node_fetch');
  assert.deepEqual(fetches.map(f => f.revisit), [false, true]);
});

test('get_node on unknown coordinate throws, records nothing', async () => {
  await assert.rejects(() => tools.get_node({ coordinate: 'NOPE.X.9' }), /unknown/i);
  assert.equal(events.filter(e => e.type === 'node_fetch').length, 0);
});

test('follow_edge validates the typed link and records edge_follow + node_fetch', async () => {
  const res = await tools.follow_edge({ from: 'RHET.CIRCULARREALISM.1', to: 'RHET.SURVIVAL.1' });
  assert.equal(res.edge_type, 'flow');
  assert.equal(res.coordinate, 'RHET.SURVIVAL.1');
  assert.deepEqual(events.slice(1).map(e => e.type), ['edge_follow', 'node_fetch']);
  assert.equal(events.find(e => e.type === 'edge_follow').edge_type, 'flow');
});

test('follow_edge on a non-existent edge throws, records nothing', async () => {
  await assert.rejects(() => tools.follow_edge({ from: 'RHET.BURDEN.1', to: 'RHET.BURDEN.1' }), /no .*edge/i);
  assert.equal(events.filter(e => e.type === 'edge_follow').length, 0);
});

test('submit_miss records an unmapped event locally', async () => {
  const res = await tools.submit_miss({ query: 'mutual aid already suffices', kind: 'alias', nearest: ['HIST.MONDRAGON.1'] });
  assert.equal(res.queued, true);
  const ev = events.find(e => e.type === 'unmapped');
  assert.equal(ev.kind, 'alias');
  assert.deepEqual(ev.nearest, ['HIST.MONDRAGON.1']);
});
