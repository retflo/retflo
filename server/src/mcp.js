import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const text = obj => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function createMcpServer(tools) {
  const server = new McpServer({ name: 'retflo', version: '0.1.0' });

  server.registerTool('search_nodes', {
    description: 'Route an objection to retflo graph nodes. Returns matched coordinates plus nearest territory. Always search before fetching.',
    inputSchema: { query: z.string().describe('The objection or claim to route') },
  }, async args => text(await tools.search_nodes(args)));

  server.registerTool('get_node', {
    description: 'Fetch a retflo node body and its typed links by coordinate (e.g. RHET.BURDEN.1).',
    inputSchema: { coordinate: z.string() },
  }, async args => text(await tools.get_node(args)));

  server.registerTool('follow_edge', {
    description: 'Follow a typed edge listed on a fetched node to its target node. Use instead of get_node when moving along a link.',
    inputSchema: { from: z.string(), to: z.string() },
  }, async args => text(await tools.follow_edge(args)));

  server.registerTool('submit_miss', {
    description: 'Queue an unmapped objection locally as a suspected patch (kind: alias = phrasing gap, edge = missing connection, node = missing argument). Local only; nothing is transmitted.',
    inputSchema: {
      query: z.string(),
      kind: z.enum(['alias', 'edge', 'node']),
      nearest: z.array(z.string()).optional(),
      note: z.string().optional(),
    },
  }, async args => text(await tools.submit_miss(args)));

  return server;
}
