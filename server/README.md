# retflo MCP Server

A Model Context Protocol server that exposes the retflo graph as tools for Claude Code and other MCP-compatible agents. Includes a live traversal visualizer.

## What it does

The server provides four tools:

- **`search_nodes`** — find nodes in the graph by query text. Returns exact matches and nearest neighbors by semantic distance.
- **`get_node`** — fetch a node's full content (title, domain, body, links) by coordinate.
- **`follow_edge`** — traverse from one node to another along a typed connection. Returns the target node and edge type.
- **`submit_miss`** — record gaps in the mapping locally (unmapped queries, missing edges, missing nodes). Marked with kind (`alias`, `edge`, or `node`) and optional notes.

The server also runs a live traversal visualizer at `http://127.0.0.1:7317/` that replays sessions from disk: session picker, node inspector, edge follower, live tail, step/scrub controls.

## Register with Claude Code

```bash
claude mcp add retflo -- node ~/Documents/GitHub/retflo/server/src/index.js
```

This command registers the server as an MCP resource named `retflo` in Claude Code. Once registered, you can instruct Claude to search nodes, fetch content, follow edges, or submit unmapped queries during a conversation.

## Environment variables

- **`RETFLO_REPO`** — path to the retflo repo root (default: parent of the server directory). The server loads the graph from `nodes/` here.
- **`RETFLO_SESSIONS_DIR`** — path to session logs directory (default: `~/.retflo/sessions`). Session data is stored as JSONL files with millisecond-precision timestamps.
- **`RETFLO_VIEW_PORT`** — port for the live traversal viewer (default: `7317`). The viewer always binds to `127.0.0.1`; if the port is unavailable, the server logs `sidecar disabled` and continues serving MCP normally.

## Privacy

Session logs live in `~/.retflo/sessions/` on your own disk. They contain traversal events (node fetches, edge follows, search queries, unmapped submissions) and nothing more sensitive than what Claude Code already writes to disk locally. The sidecar binds to `127.0.0.1` only — the viewer is not accessible remotely. Nothing is transmitted anywhere. `submit_miss` records locally and does not contact any server.

## Event schema (v0.2)

Each session is a newline-delimited JSON file with these event types (all times are milliseconds since session start):

```
session_start: { t, session, graph_version }
  Emitted at session start. session is a UUID. graph_version is a semantic version string.

search: { t, query, matches }
  Emitted after search_nodes. matches is an array of node coordinates returned.

node_fetch: { t, coordinate, revisit }
  Emitted when a node is fetched (get_node or follow_edge).
  revisit is true if this node was seen earlier in the session.

edge_follow: { t, from, to, edge_type }
  Emitted when follow_edge is called.
  edge_type is one of: flow, escalation, premise, resolution, retreat, redirect.

unmapped: { t, query, kind, nearest, note? }
  Emitted when submit_miss is called.
  kind is one of: alias, edge, node.
  nearest is an array of node coordinates offered as fallback routes.
  note is an optional string attached to the submission.

user_message: { t, text }
  Emitted when a user sends a message in a chat session.
  (Not present in MCP-driven sessions; the server only sees tool calls, not conversation text.)

assistant_message: { t, text, sources }
  Emitted when an assistant responds in a chat session.
  (Not present in MCP-driven sessions; see user_message note.)

session_end: { t, stats }
  Emitted at session end.
  stats: { fetched, edges, unmapped } — counts of node_fetch, edge_follow, unmapped events.
```

## Viewer

The live traversal viewer runs at `http://127.0.0.1:7317/` and provides:

- **Session picker** — list all sessions in `~/.retflo/sessions/` with start time and stats.
- **Node inspector** — browse a selected node's content, links, domain.
- **Edge follower** — step through edges and see edge types and revisit status.
- **Live tail** — watch a session as it unfolds in real time.
- **Scrub controls** — play, pause, step forward/backward through events; scrub to any point in the timeline.

## Running the server

```bash
# Start in MCP mode (connects to Claude Code via stdio)
node src/index.js

# Customize graph location
RETFLO_REPO=/path/to/retflo node src/index.js

# Customize session storage or viewer port
RETFLO_SESSIONS_DIR=/tmp/sessions RETFLO_VIEW_PORT=8080 node src/index.js
```

The server logs graph metadata to stderr on startup: node count, version, any warnings.

## Testing

```bash
npm test
```

Runs the full test suite: MCP tool contracts, event logging, sidecar binding, session scrubbing.
