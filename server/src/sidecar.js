import http from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function json(res, body, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function graphPayload(graph) {
  const nodes = [], edges = [];
  for (const n of graph.nodes.values()) {
    nodes.push({ coordinate: n.coordinate, domain: n.domain, title: n.title });
    for (const l of n.links) {
      if (graph.nodes.has(l.target)) edges.push({ source: n.coordinate, target: l.target, type: l.type });
    }
  }
  return { version: graph.version, nodes, edges };
}

export function createSidecar({ graph, sessionsDir, activeLog = null, viewerDir }) {
  viewerDir ??= join(dirname(fileURLToPath(import.meta.url)), '..', 'viewer');

  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);

    // static viewer
    if (parts.length === 0 || ['app.js', 'fold.js', 'index.html'].includes(parts[0])) {
      const name = parts[0] ?? 'index.html';
      const file = join(viewerDir, name);
      if (!existsSync(file)) return json(res, { error: 'not found' }, 404);
      res.writeHead(200, { 'content-type': MIME[extname(name)] ?? 'text/plain' });
      return res.end(readFileSync(file));
    }

    if (parts[0] === 'graph' && parts.length === 1) return json(res, graphPayload(graph));

    if (parts[0] === 'sessions' && parts.length === 1) {
      const out = [];
      for (const f of readdirSync(sessionsDir)) {
        if (!f.endsWith('.jsonl')) continue;
        const lines = readFileSync(join(sessionsDir, f), 'utf8').trim().split('\n').filter(Boolean);
        let start = {};
        try { start = JSON.parse(lines[0]); } catch { /* skip corrupt first line */ }
        out.push({ id: start.session ?? f, file: f, started: start.graph_version ? f.slice(0, 24) : null, events: lines.length });
      }
      out.sort((a, b) => b.file.localeCompare(a.file));
      return json(res, out);
    }

    if (parts[0] === 'sessions' && parts.length === 3) {
      const file = decodeURIComponent(parts[1]);
      if (file.includes('/') || file.includes('..') || basename(file) !== file) {
        return json(res, { error: 'bad session file' }, 400);
      }
      const full = join(sessionsDir, file);
      if (!existsSync(full)) return json(res, { error: 'not found' }, 404);

      if (parts[2] === 'events') {
        res.writeHead(200, { 'content-type': 'application/x-ndjson' });
        return res.end(readFileSync(full));
      }

      if (parts[2] === 'live') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        for (const line of readFileSync(full, 'utf8').trim().split('\n').filter(Boolean)) {
          res.write(`data: ${line}\n\n`);
        }
        const isActive = activeLog && basename(activeLog.file) === file;
        if (isActive) {
          const onEvent = ev => res.write(`data: ${JSON.stringify(ev)}\n\n`);
          activeLog.on('event', onEvent);
          req.on('close', () => activeLog.off('event', onEvent));
        }
        return; // keep stream open
      }
    }

    json(res, { error: 'not found' }, 404);
  });
}
