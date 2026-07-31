import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, applyEvent, foldTo } from '../viewer/fold.js';

const EVENTS = [
  { t: 0, type: 'session_start', session: 's1', graph_version: '1.2.0' },
  { t: 500, type: 'search', query: 'x', matches: ['A.B.1'] },
  { t: 900, type: 'node_fetch', coordinate: 'A.B.1', revisit: false },
  { t: 1400, type: 'edge_follow', from: 'A.B.1', to: 'C.D.1', edge_type: 'escalation' },
  { t: 1500, type: 'node_fetch', coordinate: 'C.D.1', revisit: false },
  { t: 2000, type: 'unmapped', query: 'y', kind: 'alias', nearest: [] },
  { t: 2500, type: 'assistant_message', text: 'reply', sources: ['A.B.1'] },
  { t: 3000, type: 'session_end', stats: { fetched: 2, edges: 1, unmapped: 1 } },
];

test('full fold accumulates visited, edges, patch count, chat', () => {
  const s = foldTo(EVENTS, Infinity);
  assert.deepEqual(s.visited, ['A.B.1', 'C.D.1']);
  assert.deepEqual(s.litEdges, [{ from: 'A.B.1', to: 'C.D.1', type: 'escalation' }]);
  assert.equal(s.patch, 1);
  assert.equal(s.chat.length, 1);
  assert.equal(s.active, null);
  assert.deepEqual(s.stats, { fetched: 2, edges: 1, unmapped: 1 });
});

test('foldTo(cursor) equals incremental fold of the same prefix (scrub determinism)', () => {
  for (const ev of EVENTS) {
    const seek = foldTo(EVENTS, ev.t);
    const inc = initState();
    for (const e of EVENTS) if (e.t <= ev.t) applyEvent(inc, e);
    assert.deepEqual(seek, inc, `divergence at t=${ev.t}`);
  }
});

test('mid-session cursor leaves the last fetched node active', () => {
  const s = foldTo(EVENTS, 1500);
  assert.equal(s.active, 'C.D.1');
});

test('duplicate fetches do not duplicate visited entries', () => {
  const s = initState();
  applyEvent(s, EVENTS[2]);
  applyEvent(s, { t: 999, type: 'node_fetch', coordinate: 'A.B.1', revisit: true });
  assert.deepEqual(s.visited, ['A.B.1']);
});
