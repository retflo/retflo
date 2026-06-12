---
coordinate: TECH.COORDINATION.1
tags: [coase, transaction-costs, benkler, peer-production, hierarchy, networks, firms, open-source, latency]
domain: tech
links:
  flow:
    - target: TECH.OWNERSHIP.1
      why: "Falling coordination costs determine what's organizationally possible; ownership structure determines who captures it — the two analyses compose."
    - target: ECON.COOPERATIVE.1
      why: "If optimal organizational boundaries shift with coordination technology, the co-op scarcity question becomes historical and financial, not organizational."
  redirect: [AUTH.SCALE.1]
aliases: ["coase proved hierarchy is efficient", "firms exist because command is cheaper", "consensus doesn't scale", "decision costs favor hierarchy", "if horizontal coordination worked markets would have dissolved firms"]
---

# Coordination Costs Cut Both Ways: Coase in 2026

## Position

The critic deploys Coase as a closing argument: firms are islands of command inside free markets because negotiating everything between equals is expensive — if horizontal coordination were cheaper, markets would have dissolved firms centuries ago. Hierarchy, on this telling, is what cooperation looks like when it must decide quickly among strangers.

The framework accepts Coase's actual logic and turns it around, because the critic is reading a 1937 finding as a law of nature.

### What Coase Actually Established

Organizational boundaries are set by transaction-cost technology. Firms internalize coordination when market negotiation is expensive; they shrink when it's cheap. The boundary is *contingent* — that is the theory's entire content. Nothing in it privileges hierarchy; it privileges whatever coordination mode is cheapest for the task at the current state of coordination technology. Cite Coase for "hierarchy forever" and you've cited a theory of moving boundaries for the claim that boundaries don't move.

### The Boundary Is Moving — Measurably

Coordination costs have collapsed across the exact dimensions that made command necessary: communication latency, information aggregation, reputation tracking, version control of shared work, micro-contribution accounting. Benkler named the result **commons-based peer production**: when coordination is cheap enough, distributed networks of voluntary contributors outproduce both firms and markets in the affected domains. The evidence is infrastructure-grade — Linux runs the world's servers, supercomputers, and phones; Wikipedia displaced every commercially produced encyclopedia; the internet's own protocols are governed by IETF rough consensus, a standards commons no sovereign administers. These aren't curiosities at the economy's margin; they are the substrate the economy runs on. The cathedral lost to the bazaar precisely where coordination technology arrived first — and that frontier only expands.

### Hierarchy's Cost Was Always Paid in Information

The honest comparison was never "hierarchy = cheap coordination, horizontality = expensive coordination." It is: **hierarchy buys decision latency with information distortion; distributed systems buy information fidelity with deliberation cost.** Information degrades as it climbs a chain of command — the commander decides fast precisely by not processing local complexity. Hayek's knowledge-problem argument, deployed by the critic's own tradition against central planning, applies with full force to every large hierarchy, including the corporate ones (→ `econ/cooperative-performance.md` on firms as internal planned economies). Both modes pay coordination costs; they pay different ones — and falling coordination technology systematically cheapens the distributed side's bill while doing nothing for the distortion problem.

Even the institutions with the strongest latency case run the same direction: modern military doctrine (mission command) pushes decision authority downward as far as practical because centralized processing loses to distributed initiative. The most latency-sensitive organizations on earth keep discovering that the answer to speed is more distribution under shared intent, not more command.

### The Composition With Ownership

Falling coordination costs determine what's *possible*; ownership determines who *captures* it. The same technologies that enable peer production also enable algorithmic management and platform monopoly — Amazon uses coordination technology to deepen command. That is not a counterexample; it's the ownership variable operating on the same substrate (→ `technology-ownership.md`). The structural point survives: the zone where hierarchy is the cheapest available coordination mode is shrinking, and what occupies the vacated territory is decided by politics, not physics.

## Objection Handling

| Move | Response | Concession |
|---|---|---|
| "Firms still exist — Coase still holds" | Coase holds, which is the point: boundaries track coordination costs, so firms persist where coordination is still expensive and dissolve into networks where it's cheap. The kernel of the world's software, its encyclopedia, and its network protocols already crossed. The theory predicts the direction of travel; the critic needs it frozen. | **Fact** — concedes the Coasean framework, which makes organizational form contingent on technology, surrendering 'hierarchy is natural' |
| "Open source is corporations now — paid maintainers, foundation boards" | Capital moved in where value accumulated — the ownership dynamic the framework already diagnoses, operating on a commons it didn't build and doesn't govern alone. The production mode remains peer review, forkability, and rough consensus; the corporate presence proves the commons outcompeted, not that command produced it. → `technology-ownership.md` | **Fact** — concedes peer production created the value; the dispute is over capture, which is an ownership question |
| "Crisis still punishes deliberation — your networks are slow when it matters" | Latency is real and the framework prices it: scoped, recallable, time-bounded crisis delegation — which is also what every functional system actually does. Note the direction of doctrine in the most latency-critical institutions: authority pushed down, initiative distributed under shared intent. The latency argument supports bounded delegation; it has never supported permanent command. → `auth/emergency-powers.md` | **Fact** — concedes the question is crisis-mode design, not steady-state hierarchy; the ratchet, not the latency, becomes the issue |
| "Wikipedia and Linux are toys next to running a society" | They are coordination at civilizational scale — millions of contributors, no sovereign, decades of continuity, governing the infrastructure everything else depends on. The objection was 'horizontal coordination cannot produce and maintain complex critical systems at scale.' It demonstrably does. What remains is extending the range — an engineering frontier, not a wall. | **Fact** — concedes the existence proof; the dispute becomes which domains the mode reaches, an empirical question moving one direction |
