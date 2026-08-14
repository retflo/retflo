retflo v2.0.0

## Breaking

- **Coordinates lost the legacy `.1` suffix.** `ECON.PROFIT.1` is now
  `ECON.PROFIT`, across every node, link, and API response. Any stored
  coordinate, saved link, or integration that pinned the old form needs
  updating.
- **AGENTS.md was rebuilt.** It now leads with what the graph is and how to
  address it, then how to use it, then the position it argues from. Anything
  parsing the old section order will not find it.

## The graph

- The first amendment batch landed under the amendment protocol: 12 approved
  change classes, no blank connection rationales.
- Alias coverage went from roughly 700 to 1,459. Aliases are the phrasings people
  actually use, and they are how a plain-language objection resolves to a node.
- 66 nodes, 286 typed connections, 7 domains. 16 nodes are recursion points.

## New

- **OPERATORS.md**: the material read. Before a node is applied, read the subject
  and where they stand relative to the thing being argued. The same argument can
  be true, partial, or inverted depending on who it is about.
- **SECURITY.md**: official sources, and a warning about an impersonating copy
  distributing a binary archive. retflo ships no binaries.
- **MCP server**: `search_nodes`, `get_node`, `follow_edge`, `submit_miss`, plus a
  local traversal visualizer. It runs on your machine and transmits nothing.

## Machine surfaces

AGENTS.md is now the single source for every machine-facing surface. The site's
`agents.md`, `llms.txt`, and `/agents` page are generated from it, so they cannot
drift apart. Every node is addressable as raw markdown by appending `.md`, as
JSON at `/api/nodes/{COORDINATE}`, and in full at `/api/graph`.

## Voice

Every audience-facing surface was rewritten: the site, this repository's
documentation, and the framework itself. Claims about what retflo is are now
checkable facts about the artifact. Where the framework argues a position, it
says so plainly and argues it rather than describing itself.

## Full changelog

https://github.com/retflo/retflo/compare/v1.2.0...v2.0.0
