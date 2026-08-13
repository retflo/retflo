import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const text = obj => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function createMcpServer(tools) {
  const server = new McpServer({ name: 'retflo', version: '0.1.0' });

  server.registerTool('search_nodes', {
    description: 'Resolve a phrase or objection to retflo node coordinates. Matches against roughly 1,400 aliases, tags, and titles, and returns the nearest territory when nothing matches cleanly. Search first: the graph answers a given objection with a specific node, and guessing the coordinate gets the wrong one.',
    inputSchema: { query: z.string().describe('The objection or claim to route') },
  }, async args => text(await tools.search_nodes(args)));

  server.registerTool('get_node', {
    description: 'Fetch one node by coordinate (e.g. RHET.BURDEN): the position, the objection table with each concession typed as fact, frame, or contested, and the typed links out. When moving to a node already listed in a fetched node\'s links, use follow_edge instead, which records the edge type.',
    inputSchema: { coordinate: z.string() },
  }, async args => text(await tools.get_node(args)));

  server.registerTool('follow_edge', {
    description: 'Move along a typed edge from a fetched node to its target, and get the edge type back. The type is the content: flow, resolution, premise, escalation, retreat, or redirect. Prefer this over get_node whenever the target is listed in the source node\'s links.',
    inputSchema: { from: z.string(), to: z.string() },
  }, async args => text(await tools.follow_edge(args)));

  server.registerTool('submit_miss', {
    description: 'Record an objection that resolved to nothing (kind: alias = phrasing gap, edge = missing connection, node = missing argument). This is how a gap in the graph gets found and fixed. Written to local disk only; nothing is transmitted anywhere.',
    inputSchema: {
      query: z.string(),
      kind: z.enum(['alias', 'edge', 'node']),
      nearest: z.array(z.string()).optional(),
      note: z.string().optional(),
    },
  }, async args => text(await tools.submit_miss(args)));

  return server;
}
