import { EventEmitter } from 'node:events';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export class SessionLog extends EventEmitter {
  constructor({ dir, graphVersion, now = Date.now }) {
    super();
    this.now = now;
    this.t0 = now();
    this.id = randomUUID();
    this.stats = { fetched: 0, edges: 0, unmapped: 0 };
    this.seen = new Set();
    this.ended = false;
    mkdirSync(dir, { recursive: true });
    const stamp = new Date(this.t0).toISOString().replace(/[:.]/g, '-');
    this.file = join(dir, `${stamp}-${this.id.slice(0, 8)}.jsonl`);
    this.record({ type: 'session_start', session: this.id, graph_version: graphVersion });
  }

  record(ev) {
    const full = { t: this.now() - this.t0, ...ev };
    if (ev.type === 'node_fetch') { this.stats.fetched += 1; this.seen.add(ev.coordinate); }
    else if (ev.type === 'edge_follow') this.stats.edges += 1;
    else if (ev.type === 'unmapped') this.stats.unmapped += 1;
    appendFileSync(this.file, JSON.stringify(full) + '\n');
    this.emit('event', full);
    return full;
  }

  end() {
    if (this.ended) return;
    this.ended = true;
    this.record({ type: 'session_end', stats: { ...this.stats } });
  }
}
