import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from '../src/graph.js';
import { SessionLog } from '../src/events.js';
import { createSidecar } from '../src/sidecar.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let graph, log, server, base;

before(async () => {
  graph = await loadGraph(REPO);
  const dir = mkdtempSync(join(tmpdir(), 'retflo-'));
  log = new SessionLog({ dir, graphVersion: graph.version });
  log.record({ type: 'node_fetch', coordinate: 'RHET.BURDEN.1', revisit: false });
  server = createSidecar({ graph, sessionsDir: dir, activeLog: log });
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('binds 127.0.0.1 only (INV-4 release gate)', () => {
  assert.equal(server.address().address, '127.0.0.1');
});

test('GET /graph returns nodes and typed edges', async () => {
  const g = await (await fetch(`${base}/graph`)).json();
  assert.equal(g.nodes.length, graph.nodes.size);
  assert.ok(g.edges.length > 100);
  assert.ok(g.edges.every(e => ['flow','escalation','premise','resolution','retreat','redirect'].includes(e.type)));
});

test('GET /sessions lists the session with event count', async () => {
  const s = await (await fetch(`${base}/sessions`)).json();
  assert.equal(s.length, 1);
  assert.equal(s[0].id, log.id);
  assert.equal(s[0].events, 2);
});

test('GET /sessions/:file/events returns parseable JSONL', async () => {
  const file = basename(log.file);
  const text = await (await fetch(`${base}/sessions/${file}/events`)).text();
  const lines = text.trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].type, 'session_start');
});

test('path traversal in session file is rejected', async () => {
  const r = await fetch(`${base}/sessions/..%2F..%2Fetc%2Fpasswd/events`);
  assert.equal(r.status, 400);
});

test('SSE replays existing events then tails live ones', async () => {
  const file = basename(log.file);
  const res = await fetch(`${base}/sessions/${file}/live`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const readEvents = async wanted => {
    while ((buf.match(/\n\n/g) ?? []).length < wanted) {
      const { value } = await reader.read();
      buf += dec.decode(value);
    }
    return buf.split('\n\n').filter(Boolean)
      .map(b => JSON.parse(b.replace(/^data: /, '')));
  };
  const replayed = await readEvents(2);
  assert.equal(replayed[0].type, 'session_start');
  log.record({ type: 'search', query: 'live one', matches: [] });
  const all = await readEvents(3);
  assert.equal(all.at(-1).type, 'search');
  await reader.cancel();
});
