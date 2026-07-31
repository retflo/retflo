import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadGraph } from './graph.js';
import { SessionLog } from './events.js';
import { makeTools } from './tools.js';
import { createMcpServer } from './mcp.js';
import { createSidecar } from './sidecar.js';

const repoRoot = process.env.RETFLO_REPO
  ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sessionsDir = process.env.RETFLO_SESSIONS_DIR ?? join(homedir(), '.retflo', 'sessions');
const port = Number(process.env.RETFLO_VIEW_PORT ?? 7317);

const graph = await loadGraph(repoRoot);
for (const w of graph.warnings) console.error(`[graph] ${w}`);
console.error(`[graph] v${graph.version}, ${graph.nodes.size} nodes`);

const log = new SessionLog({ dir: sessionsDir, graphVersion: graph.version });
const tools = makeTools(graph, log);

const sidecar = createSidecar({ graph, sessionsDir, activeLog: log });
sidecar.on('error', err => {
  console.error(`sidecar disabled: ${err.message}`);
});
sidecar.listen(port, '127.0.0.1', () => {
  console.error(`sidecar http://127.0.0.1:${sidecar.address().port}/`);
});

const shutdown = () => {
  log.end();
  try { sidecar.close(); } catch { /* not listening */ }
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const mcp = createMcpServer(tools);
await mcp.connect(new StdioServerTransport());
