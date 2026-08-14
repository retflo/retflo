# Contributing to retflo

retflo is a typed argument graph and the tools that serve it. Contributions come
in four shapes: argument content, corrections, code, and translations.

## Before you contribute

retflo uses a Contributor License Agreement (CLA). You do not need to read the
whole thing before opening a PR. A bot handles it the first time you contribute.

**What the CLA does:**
- You keep copyright of your work.
- You grant the project the rights needed to distribute it under the RCCL and to
  issue commercial licenses to organizations that would otherwise be excluded.
- Commercial licensing revenue goes toward sustaining the project and funding
  cooperative and community infrastructure (CLA §7).

**What the CLA does not do:**
- It does not take ownership away from you.
- It does not allow the project to be sold to or taken over by an investor-owned
  entity. The license and the CLA both prevent that.

When you open your first pull request, a CLA bot comments with a one-click sign
process.

## What to contribute

**Argument nodes and connections**
The graph covers 66 arguments across 7 domains. If you find a gap (an objection
that is not addressed, a connection that is not mapped, a response that could be
stronger), open an issue or submit directly.

If you are modifying existing argument content, mark your changes clearly and
explain your reasoning. Argument structure is load-bearing, so changes to it have
to be legible in review.

Node format: every Objection Handling row's Concession cell carries a leading
`**Fact**`, `**Frame**`, or `**Contested**` tag (see STYLE-GUIDE §4.4). New nodes
follow the honest-strength pattern: state the critic's argument at full strength,
concede what is true, contest the inference. Stress-testing counts as
contribution. If you find a node that loses an argument it should not, that is a
bug report.

**Code**
Bug fixes, API improvements, visualizer features, tooling, documentation. Check
open issues for things already flagged.

**Translations and accessibility**
Translations of the argument graph are welcome from people who can carry both the
language and the political meaning. Open an issue first so the work can be
coordinated.

**Corrections**
If something is factually wrong or misrepresents a position, open an issue.
Corrections are handled the same as any other bug.

## How to contribute

1. Fork the repository
2. Create a branch for your change
3. Make your changes with clear commit messages
4. Open a pull request with a description of what you changed and why
5. Sign the CLA if it's your first contribution (the bot will prompt you)

For significant changes to argument content or structure, open an issue first. It
saves a review round.

## Standards

- Represent objections in their strongest form. Strawmen get sent back.
- Cite sources for factual and historical claims.
- Keep the reasoning aligned with the axiom stated in AGENTS.md.
- Be direct. Vague phrasing does not survive review.

## Questions

Open an issue, or write to **[contact@retflo.org](mailto:contact@retflo.org)**.

---

© 2026 retflo™ contributors. Licensed under [RCCL v1.0](https://retflo.org/license/).
Free for individuals and worker-controlled organizations. Commercial licensing for everyone else.
