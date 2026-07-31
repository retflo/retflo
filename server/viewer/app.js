import { initState, applyEvent, foldTo } from '/fold.js';

const DOM = { econ:'#d4a24e', auth:'#c65a4d', phil:'#8f7fc4', hist:'#4f9a8c',
              rhet:'#cf7fa8', soc:'#7fae5c', tech:'#5b8fc9' };

// Event-derived strings (tool-call arguments, prompt-injectable) are persisted to
// the session log and rendered into innerHTML for markup (log lines, chat bubbles).
// Escape before interpolating into any innerHTML string.
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const GRAPH = await (await fetch('/graph')).json();
document.getElementById('graphmeta').textContent =
  `graph v${GRAPH.version} · ${GRAPH.nodes.length} nodes / ${GRAPH.edges.length} connections`;

// ---- radial layout: identical math to the prototype, driven by GRAPH.nodes ----
const CX = 500, CY = 390, GAP = 0.05;
const domains = ['auth','econ','phil','hist','rhet','soc','tech'];
const byDom = Object.fromEntries(domains.map(d => [d, []]));
for (const n of GRAPH.nodes) byDom[n.domain]?.push(n);
const total = GRAPH.nodes.length;
const pos = {}, nodeMeta = {};
{
  let ang = -Math.PI / 2;
  for (const d of domains) {
    const list = byDom[d];
    const span = (list.length / total) * (Math.PI * 2 - GAP * domains.length);
    const start = ang + GAP / 2;
    list.forEach((n, i) => {
      const a = start + span * ((i + 0.5) / list.length);
      const r = (i % 2 === 0) ? 270 : 315;
      pos[n.coordinate] = { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, a };
      nodeMeta[n.coordinate] = { dom: n.domain, title: n.title };
    });
    ang += span + GAP;
  }
}

// ---- DOM refs ----
const svg = document.getElementById('svg');
const tip = document.getElementById('tip');
const msgs = document.getElementById('msgs');
const logbody = document.getElementById('logbody');
const patchn = document.getElementById('patchn');
const patchbar = document.getElementById('patchbar');
const clock = document.getElementById('clock');
const scrub = document.getElementById('scrub');
const speedSel = document.getElementById('speedSel');
const playBtn = document.getElementById('playBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionSel = document.getElementById('sessionSel');
const followBtn = document.getElementById('followBtn');
const schemaBtn = document.getElementById('schemaBtn');
const overlay = document.getElementById('overlay');
const closeSchema = document.getElementById('closeSchema');

schemaBtn.onclick = () => overlay.classList.add('open');
closeSchema.onclick = () => overlay.classList.remove('open');
overlay.addEventListener('click', e => { if (e.target.id === 'overlay') overlay.classList.remove('open'); });

// ---- SVG build ----
const NS = 'http://www.w3.org/2000/svg';
function el(t, attrs, parent) {
  const e = document.createElementNS(NS, t);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}
const edgeLayer = el('g', {}), trailLayer = el('g', {}), nodeLayer = el('g', {});

const edgeEls = {};
function edgeKey(s, t) { return s + '>' + t; }
for (const e of GRAPH.edges) {
  const p1 = pos[e.source], p2 = pos[e.target];
  if (!p1 || !p2) continue;
  const mx = (p1.x + p2.x) / 2 + (CX - (p1.x + p2.x) / 2) * 0.35;
  const my = (p1.y + p2.y) / 2 + (CY - (p1.y + p2.y) / 2) * 0.35;
  const d = `M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`;
  const path = el('path', { d, class: 'edge' }, edgeLayer);
  edgeEls[edgeKey(e.source, e.target)] = { path, type: e.type };
}

const domLabels = [];
{
  let a = -Math.PI / 2;
  for (const d of domains) {
    const list = byDom[d];
    const span = (list.length / total) * (Math.PI * 2 - GAP * domains.length);
    const mid = a + GAP / 2 + span / 2;
    domLabels.push({ d, x: CX + Math.cos(mid) * 365, y: CY + Math.sin(mid) * 365 });
    a += span + GAP;
  }
}
for (const l of domLabels) {
  el('text', { x: l.x, y: l.y, 'text-anchor': 'middle', class: 'domlabel', fill: DOM[l.d] }, nodeLayer).textContent = l.d;
}

const nodeEls = {};
for (const n of GRAPH.nodes) {
  const p = pos[n.coordinate];
  if (!p) continue;
  const g = el('g', { class: 'node', 'data-id': n.coordinate, style: `color:${DOM[n.domain]}` }, nodeLayer);
  el('circle', { cx: p.x, cy: p.y, r: 15, class: 'ring', stroke: DOM[n.domain] }, g);
  el('circle', { cx: p.x, cy: p.y, r: 7 }, g).style.stroke = DOM[n.domain];
  const outward = Math.cos(p.a) >= 0;
  el('text', { x: p.x + (outward ? 11 : -11), y: p.y + 3, 'text-anchor': outward ? 'start' : 'end' }, g)
    .textContent = n.title.length > 22 ? n.title.slice(0, 21) + '…' : n.title;
  nodeEls[n.coordinate] = g;
  g.addEventListener('mousemove', ev => showTip(ev, n.coordinate));
  g.addEventListener('mouseleave', hideTip);
}

const unmark = el('g', { class: 'unmapped-marker' }, nodeLayer);
el('rect', { x: CX - 120, y: CY - 24, width: 240, height: 48, rx: 4 }, unmark);
const umT1 = el('text', { x: CX, y: CY - 4, 'text-anchor': 'middle' }, unmark); umT1.textContent = 'ROUTING GAP';
const umT2 = el('text', { x: CX, y: CY + 14, 'text-anchor': 'middle', style: 'font-size:8.5px;fill:var(--muted)' }, unmark);

function showTip(ev, id) {
  const m = nodeMeta[id];
  document.getElementById('tipco').textContent = id + ' · ' + m.dom;
  document.getElementById('tiptitle').textContent = m.title;
  const r = svg.parentElement.getBoundingClientRect();
  tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 250) + 'px';
  tip.style.top = (ev.clientY - r.top + 10) + 'px';
  tip.style.opacity = 1;
}
function hideTip() { tip.style.opacity = 0; }

// ---- edge lighting ----
const EDGE_COLORS = { flow:'var(--e-flow)', escalation:'var(--e-esc)', premise:'var(--e-prem)',
                       resolution:'var(--e-res)', retreat:'var(--e-ret)', redirect:'var(--e-red)' };
const EDGE_DASH = { flow:'none', escalation:'none', premise:'2 4', resolution:'8 5',
                     retreat:'8 3 2 3', redirect:'3 3' };

function litEdge(s, t, type) {
  const e = edgeEls[edgeKey(s, t)] || edgeEls[edgeKey(t, s)];
  if (!e) return;
  const len = e.path.getTotalLength();
  e.path.classList.add('lit', 'draw');
  e.path.style.stroke = EDGE_COLORS[type];
  e.path.style.setProperty('--len', len);
  e.path.style.strokeDasharray = (EDGE_DASH[type] === 'none') ? `${len}` : EDGE_DASH[type];
  if (EDGE_DASH[type] === 'none') setTimeout(() => { e.path.style.strokeDasharray = 'none'; }, 850);
}

// litEdge minus the draw animation — used by seek()'s static re-render.
function litEdgeStatic(s, t, type) {
  const e = edgeEls[edgeKey(s, t)] || edgeEls[edgeKey(t, s)];
  if (!e) return;
  e.path.classList.add('lit');
  e.path.style.stroke = EDGE_COLORS[type];
  e.path.style.strokeDasharray = (EDGE_DASH[type] === 'none') ? 'none' : EDGE_DASH[type];
}

// ---- chat + log rendering ----
function chatMsg(role, text, sources) {
  const d = document.createElement('div'); d.className = 'msg ' + role;
  d.innerHTML = '<div class="who">' + (role === 'user' ? 'challenger' : 'graph / defender') + '</div>' +
    esc(text).replace(/\*(.+?)\*/g, '<i>$1</i>');
  if (sources && sources.length) {
    const s = document.createElement('div'); s.className = 'srcs';
    sources.forEach(id => {
      const m = nodeMeta[id];
      const c = document.createElement('button');
      c.className = 'chip';
      c.style.borderColor = m ? DOM[m.dom] : 'var(--faint)';
      c.textContent = id.toLowerCase();
      c.onmouseenter = () => nodeEls[id]?.classList.add('active');
      c.onmouseleave = () => { if (activeEl !== nodeEls[id]) nodeEls[id]?.classList.remove('active'); };
      s.appendChild(c);
    });
    d.appendChild(s);
  }
  msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
}

function fmt(ms) {
  const clamped = Math.max(0, ms);
  const s = clamped / 1000;
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + (s % 60).toFixed(1).padStart(4, '0');
}

function logLine(cls, html, t) {
  const d = document.createElement('div'); d.className = 'lg ' + cls;
  d.innerHTML = '<span class="t">' + fmt(t) + '</span>  ' + html;
  logbody.appendChild(d); logbody.scrollTop = logbody.scrollHeight;
}

// The log-only half of renderEvent: produces the same log entry for an event
// whether it's being animated live (advance) or rebuilt statically (seek).
function logLineForEvent(ev) {
  switch (ev.type) {
    case 'session_start':
      logLine('sys', '<span class="k">SESSION</span> ' + esc(ev.session) + ' <span class="dim">graph ' + esc(ev.graph_version) + '</span>', ev.t);
      break;
    case 'user_message':
      logLine('sys', '<span class="k">USER</span> <span class="dim">' + esc(ev.text.slice(0, 52)) + '…</span>', ev.t);
      break;
    case 'search':
      logLine('search', '<span class="k">SEARCH</span> ' + esc(ev.query) + ' <span class="dim">→ ' + ev.matches.length + ' match' + (ev.matches.length === 1 ? '' : 'es') + '</span>', ev.t);
      break;
    case 'node_fetch':
      logLine('fetch', '<span class="k">FETCH</span> ' + esc(ev.coordinate.toLowerCase()) + (ev.revisit ? ' <span class="dim">(revisit)</span>' : ''), ev.t);
      break;
    case 'edge_follow':
      logLine('edge', '<span class="k">EDGE</span>  ' + esc(ev.from.toLowerCase()) + ' ─' + esc(ev.edge_type) + '→ ' + esc(ev.to.toLowerCase()), ev.t);
      break;
    case 'unmapped':
      logLine('unmapped', '<span class="k">ROUTE-MISS</span> ' + esc(ev.query) + '<br><span class="dim">↳ queued as ' +
        esc(ev.kind || 'node') + ' patch · premise territory: ' + ev.nearest.map(n => esc(n.toLowerCase())).join(', ') + '</span>', ev.t);
      break;
    case 'assistant_message':
      logLine('reply', '<span class="k">REPLY</span> <span class="dim">sources: ' + (ev.sources ?? []).map(s => esc(s.toLowerCase())).join(', ') + '</span>', ev.t);
      break;
    case 'session_end':
      logLine('sys', '<span class="k">END</span> <span class="dim">' + esc(ev.stats.fetched) + ' nodes fetched · ' +
        esc(ev.stats.edges) + ' edges followed · ' + esc(ev.stats.unmapped) + ' unmapped → patch queue</span>', ev.t);
      break;
  }
}

// ---- engine state ----
let events = [];          // current session's full event list
let cursor = -1;          // t of last applied event
let applied = 0;          // count of events applied to the DOM
let state = initState();
let playing = false, timer = null, following = false, es = null;
let activeEl = null;      // DOM node currently marked .active (tracked independently of fold state)

const tMax = () => events.length ? events.at(-1).t : 0;

function setPlaying(v) {
  playing = v;
  playBtn.textContent = playing ? '⏸ Pause' : '▶ Play demo';
  if (!playing) { clearTimeout(timer); timer = null; }
}

// Animated DOM/CSS side effects for one event (state bookkeeping already
// happened in applyEvent by the time this runs).
function renderEvent(ev) {
  switch (ev.type) {
    case 'session_start':
      document.getElementById('sess').textContent = 'session ' + ev.session.slice(0, 8) + ' · graph ' + ev.graph_version;
      break;
    case 'user_message':
      chatMsg('user', ev.text);
      if (activeEl) { activeEl.classList.remove('active'); activeEl = null; }
      break;
    case 'search':
      for (const id of ev.matches) {
        const g = nodeEls[id]; if (!g) continue;
        g.classList.add('searchflash');
        setTimeout(() => g.classList.remove('searchflash'), 750);
      }
      break;
    case 'node_fetch': {
      const g = nodeEls[ev.coordinate];
      g?.classList.add('visited');
      if (activeEl) activeEl.classList.remove('active');
      activeEl = g ?? null;
      activeEl?.classList.add('active');
      break;
    }
    case 'edge_follow':
      litEdge(ev.from, ev.to, ev.edge_type);
      break;
    case 'unmapped':
      patchbar.classList.remove('bump'); void patchbar.offsetWidth; patchbar.classList.add('bump');
      patchn.textContent = state.patch;
      umT1.textContent = (ev.kind === 'node') ? 'COVERAGE GAP' : 'ROUTING GAP';
      umT2.textContent = ev.query.slice(0, 44);
      unmark.classList.add('show');
      setTimeout(() => unmark.classList.remove('show'), 5200);
      break;
    case 'assistant_message':
      chatMsg('assistant', ev.text, ev.sources);
      break;
    case 'session_end':
      if (activeEl) { activeEl.classList.remove('active'); activeEl = null; }
      break;
  }
  logLineForEvent(ev);
}

// Full static re-render from a folded state (used by seek; no animations).
function renderState(s) {
  // clear
  document.querySelectorAll('.node').forEach(n => n.classList.remove('visited','active'));
  document.querySelectorAll('.edge').forEach(p => { p.classList.remove('lit','draw'); p.style.stroke=''; p.style.strokeDasharray=''; });
  msgs.innerHTML = ''; logbody.innerHTML = '';
  patchn.textContent = s.patch;
  unmark.classList.remove('show');
  // rebuild
  for (const c of s.visited) nodeEls[c]?.classList.add('visited');
  activeEl = s.active ? (nodeEls[s.active] ?? null) : null;
  activeEl?.classList.add('active');
  for (const e of s.litEdges) litEdgeStatic(e.from, e.to, e.type);   // litEdge minus the draw animation
  for (const m of s.chat) chatMsg(m.role, m.text, m.sources);
  for (const ev of s.log) logLineForEvent(ev);                       // renderEvent's log-only half
  document.getElementById('sess').textContent =
    s.session ? `session ${s.session.slice(0,8)} · graph ${s.graphVersion}` : 'session —';
}

function seek(t) {
  state = foldTo(events, t);
  applied = state.log.length;
  cursor = t;
  clock.textContent = fmt(t);
  renderState(state);
}

// Advance exactly one event with animation (play/step/live paths).
function advance() {
  if (applied >= events.length) return false;
  const ev = events[applied];
  applyEvent(state, ev);
  applied += 1; cursor = ev.t;
  clock.textContent = fmt(ev.t);
  scrub.value = ev.t;
  renderEvent(ev);          // animated DOM side effects (prototype's handle-switch)
  return true;
}

function schedule() {
  if (!playing || applied >= events.length) { setPlaying(false); return; }
  const next = events[applied];
  const delay = Math.min(Math.max(next.t - cursor, 120), 2200) * parseFloat(speedSel.value);
  timer = setTimeout(() => { advance(); schedule(); }, delay);
}

// ---- wire controls ----
playBtn.onclick = () => {
  if (applied >= events.length) { seek(0); scrub.value = 0; }
  setPlaying(!playing);
  if (playing) schedule();
};
stepBtn.onclick = () => { setPlaying(false); advance(); };
resetBtn.onclick = () => { setPlaying(false); seek(-1); scrub.value = 0; };
scrub.oninput = () => { setPlaying(false); if (following) stopFollow(); seek(Number(scrub.value)); };

// ---- sessions + live tail ----
async function refreshSessions() {
  const list = await (await fetch('/sessions')).json();
  sessionSel.innerHTML = '';
  for (const s of list) {
    const o = document.createElement('option');
    o.value = s.file;
    o.textContent = `${s.id.slice(0,8)} · ${s.events} ev`;
    sessionSel.appendChild(o);
  }
  return list;
}

async function loadSession(file) {
  if (es) { es.close(); es = null; }
  setPlaying(false);
  const text = await (await fetch(`/sessions/${encodeURIComponent(file)}/events`)).text();
  events = text.trim().split('\n').filter(Boolean).map(JSON.parse);
  scrub.max = tMax();
  scrub.value = 0;
  seek(-1);
}

// Turn off live-follow: close the SSE stream (if open) and un-glow the button.
// The single follow-off codepath, reused by the follow button, session switch,
// SSE end frame, and scrubbing away from live.
function stopFollow() {
  if (es) { es.close(); es = null; }
  following = false;
  followBtn.classList.remove('primary');
}

function follow(file) {
  // SSE replays the whole log then tails; rebuild from scratch to stay deterministic.
  if (es) es.close();
  events = []; scrub.value = 0; seek(-1);
  es = new EventSource(`/sessions/${encodeURIComponent(file)}/live`);
  // Historical sessions: the sidecar replays the full log, sends `event: end`,
  // and closes. A raw EventSource auto-reconnects on close and would replay
  // forever, so stop following (and let the browser's retry no-op against a
  // finished stream) once we see the end frame.
  es.addEventListener('end', stopFollow);
  es.onmessage = m => {
    const ev = JSON.parse(m.data);
    events.push(ev);
    scrub.max = tMax();
    if (following) { advance(); }        // caught-up live: animate as they arrive
  };
  following = true;
  followBtn.classList.add('primary');
}

sessionSel.onchange = () => { stopFollow(); loadSession(sessionSel.value); };
followBtn.onclick = () => following ? stopFollow() : follow(sessionSel.value);

const sessions = await refreshSessions();
if (sessions.length) { sessionSel.value = sessions[0].file; follow(sessions[0].file); }
