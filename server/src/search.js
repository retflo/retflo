const STOP = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'you', 'your',
  'not', 'but', 'are', 'was', 'were', 'has', 'have', 'its', 'his', 'her', 'they']);

function tokenize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

const MATCH_THRESHOLD = 4;

export function searchNodes(graph, query, limit = 5) {
  const q = query.toLowerCase();
  const qTokens = new Set(tokenize(query));
  const scored = [];
  for (const node of graph.nodes.values()) {
    let score = 0;
    for (const alias of node.aliases) {
      const a = alias.toLowerCase();
      if (q.includes(a)) { score += 10; continue; }
      const at = tokenize(alias);
      if (at.length === 0) continue;
      const hits = at.filter(t => qTokens.has(t)).length;
      if (hits === at.length) score += 8;
      else score += 5 * (hits / at.length);
    }
    for (const tag of node.tags) {
      if (qTokens.has(String(tag).toLowerCase())) score += 2;
    }
    const tt = tokenize(node.title);
    if (tt.length) score += 4 * tt.filter(t => qTokens.has(t)).length / tt.length;
    if (score > 0) scored.push({ coordinate: node.coordinate, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return {
    matches: scored.filter(s => s.score >= MATCH_THRESHOLD).slice(0, limit).map(s => s.coordinate),
    nearest: scored.slice(0, 3).map(s => s.coordinate),
  };
}
