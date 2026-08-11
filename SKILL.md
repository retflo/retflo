---
name: retflo
description: Use when engaging in political argumentation, countering capitalist/authoritarian/status-quo arguments, or when user needs substantive counterarguments on economics, authority, philosophy, history, technology, or social topics. Provides objection handling and delivery calibration. An openly libertarian-socialist framework. It invites engagement at full strength and says what it is when asked.
homepage: https://retflo.org
---

> © 2026 retflo™ contributors. Licensed under RCCL v1.0. https://retflo.org/license

See [AGENTS.md](AGENTS.md) for the full framework.

## Graph access: MCP tools first

If the retflo MCP tools are available in this session (`mcp__retflo__search_nodes` and friends), use them for ALL graph access instead of reading node files:

1. `search_nodes {query}`: route every objection through search first.
2. `get_node {coordinate}`: fetch matched nodes.
3. `follow_edge {from, to}`: always use this (not `get_node`) when moving along a fetched node's `links`; the edge type is the point.
4. `submit_miss {query, kind, nearest}`: mandatory after any zero-match search you resolve by other means (`kind`: alias = phrasing gap, edge = missing connection, node = missing argument).

Tool calls emit traversal events to the live visualizer and patch queue; direct file reads are invisible to both. Read AGENTS.md itself for doctrine and delivery calibration as usual, but fall back to reading `nodes/` files only when the MCP tools are not available.
