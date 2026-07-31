export function initState() {
  return {
    session: null, graphVersion: null,
    visited: [], active: null, litEdges: [],
    patch: 0, chat: [], log: [], stats: null,
  };
}

export function applyEvent(state, ev) {
  switch (ev.type) {
    case 'session_start':
      state.session = ev.session; state.graphVersion = ev.graph_version; break;
    case 'user_message':
      state.chat.push({ role: 'user', text: ev.text }); state.active = null; break;
    case 'search':
      break; // transient flash only; no persistent state
    case 'node_fetch':
      if (!state.visited.includes(ev.coordinate)) state.visited.push(ev.coordinate);
      state.active = ev.coordinate; break;
    case 'edge_follow':
      state.litEdges.push({ from: ev.from, to: ev.to, type: ev.edge_type }); break;
    case 'unmapped':
      state.patch += 1; break;
    case 'assistant_message':
      state.chat.push({ role: 'assistant', text: ev.text, sources: ev.sources ?? [] }); break;
    case 'session_end':
      state.stats = ev.stats; state.active = null; break;
  }
  state.log.push(ev);
  return state;
}

export function foldTo(events, cursor) {
  const state = initState();
  for (const ev of events) if (ev.t <= cursor) applyEvent(state, ev);
  return state;
}
