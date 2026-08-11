import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionLog } from '../src/events.js';

function makeClock(start = 1000) {
  let t = start;
  const now = () => t;
  now.advance = ms => { t += ms; };
  return now;
}

test('session_start written at t=0 on construction', () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const log = new SessionLog({ dir, graphVersion: '1.2.0', now: makeClock() });
  const lines = readFileSync(log.file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].type, 'session_start');
  assert.equal(lines[0].t, 0);
  assert.equal(lines[0].graph_version, '1.2.0');
  assert.equal(lines[0].session, log.id);
});

test('record stamps monotonic offsets and appends JSONL', () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const now = makeClock();
  const log = new SessionLog({ dir, graphVersion: '1.2.0', now });
  now.advance(500);
  log.record({ type: 'search', query: 'x', matches: [] });
  now.advance(300);
  log.record({ type: 'node_fetch', coordinate: 'RHET.BURDEN', revisit: false });
  const lines = readFileSync(log.file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(lines.map(l => l.t), [0, 500, 800]);
});

test('stats and seen-set track fetch/edge/unmapped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const log = new SessionLog({ dir, graphVersion: '1.2.0', now: makeClock() });
  log.record({ type: 'node_fetch', coordinate: 'A.B.1', revisit: false });
  log.record({ type: 'edge_follow', from: 'A.B.1', to: 'C.D.1', edge_type: 'flow' });
  log.record({ type: 'node_fetch', coordinate: 'C.D.1', revisit: false });
  log.record({ type: 'unmapped', query: 'q', kind: 'alias', nearest: [] });
  assert.deepEqual(log.stats, { fetched: 2, edges: 1, unmapped: 1 });
  assert.ok(log.seen.has('A.B.1') && log.seen.has('C.D.1'));
});

test('end() records session_end once', () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const log = new SessionLog({ dir, graphVersion: '1.2.0', now: makeClock() });
  log.end(); log.end();
  const lines = readFileSync(log.file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.filter(l => l.type === 'session_end').length, 1);
  assert.deepEqual(lines.at(-1).stats, { fetched: 0, edges: 0, unmapped: 0 });
});

test("subscribers receive each recorded event via 'event'", () => {
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  const log = new SessionLog({ dir, graphVersion: '1.2.0', now: makeClock() });
  const got = [];
  log.on('event', ev => got.push(ev.type));
  log.record({ type: 'search', query: 'x', matches: [] });
  assert.deepEqual(got, ['search']);
});
