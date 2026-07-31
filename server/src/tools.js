import { searchNodes } from './search.js';

function summary(graph, coordinate) {
  const n = graph.nodes.get(coordinate);
  return n ? { coordinate: n.coordinate, title: n.title, domain: n.domain } : { coordinate };
}

function nodePayload(n) {
  return { coordinate: n.coordinate, title: n.title, domain: n.domain, body: n.body, links: n.links };
}

export function makeTools(graph, log) {
  return {
    async search_nodes({ query }) {
      const { matches, nearest } = searchNodes(graph, query);
      log.record({ type: 'search', query, matches });
      const res = {
        matches: matches.map(c => summary(graph, c)),
        nearest: nearest.map(c => summary(graph, c)),
      };
      if (matches.length === 0) {
        res.hint = 'No node routed. If this objection seems genuinely unmapped, classify the gap and call submit_miss (kind: alias | edge | node).';
      }
      return res;
    },

    async get_node({ coordinate }) {
      const n = graph.nodes.get(coordinate);
      if (!n) throw new Error(`unknown coordinate: ${coordinate}`);
      const revisit = log.seen.has(coordinate);
      log.record({ type: 'node_fetch', coordinate, revisit });
      return nodePayload(n);
    },

    async follow_edge({ from, to }) {
      const src = graph.nodes.get(from);
      if (!src) throw new Error(`unknown coordinate: ${from}`);
      const link = src.links.find(l => l.target === to);
      if (!link) throw new Error(`no typed edge from ${from} to ${to}`);
      const tgt = graph.nodes.get(to);
      if (!tgt) throw new Error(`unknown coordinate: ${to}`);
      log.record({ type: 'edge_follow', from, to, edge_type: link.type });
      const revisit = log.seen.has(to);
      log.record({ type: 'node_fetch', coordinate: to, revisit });
      return { ...nodePayload(tgt), edge_type: link.type };
    },

    async submit_miss({ query, kind, nearest = [], note }) {
      log.record({ type: 'unmapped', query, kind, nearest, ...(note ? { note } : {}) });
      return { queued: true };
    },
  };
}
