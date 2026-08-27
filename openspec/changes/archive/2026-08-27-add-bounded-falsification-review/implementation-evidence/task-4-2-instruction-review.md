# Task 4.2 Instruction Governance Review

- Practice: `instruction-governance`, maintenance mode.
- Candidate: `bounded-falsification-review-current-r1`; governed source `d6d7dcfba687a51f38b5df249de4a32e1be1ba11379cd6f7c9629d17ec8cb80f`.
- Fresh reviewer: `instruction-artifact-reviewer`, session `ses_fbe40e3b9ffe4c87RHd6KJg1Nt`, effective model `xai/grok-4.6`.
- Practice Observation: `no-material-finding`.

## Review Coverage

| Dimension | Current evidence | Observation |
| --- | --- | --- |
| Trigger cohesion | `global/AGENTS.md:97-99`, `global/principles-of-work.md:32`, readiness owner lines 42-45, and `ordinary-small-exempt` configured member | One early decision-material/Material-inline owner route; Ordinary Small remains direct. |
| Original-request privacy | Propose/apply route plus `bounded-falsification.ts:59-60,139-144,164-170` | Child receives the original request separately; durable state accepts privacy-safe refs rather than raw request or transcript text. |
| No-finding permission | Readiness owner lines 29-34 and 69-79 plus `clean-no-finding` member | `no-material-finding` is conforming; no finding-count, novelty, severity, or review-length target exists. |
| Anti-loop | `global/AGENTS.md:99`, helper lines 194-200 and 267-272, `material-correction-rereview` and `unchanged-repeat` members | One initial challenge plus at most one decision-surface-changing re-review; no generic third challenge. |
| Owner separation | `config/practice-owners.json:113-122`, `profiles/core.json:7-17`, `profiles/all.json:7-27`, and `exact-practice-owner` member | One readiness owner; exact owners remain independent; final review remains optional and post-proof. |
| No semantic automation | Helper lines 52-54, 120-121, and 285-287 | Deterministic parsing returns semantic readiness `unknown` and rejects unsupported semantic fields. |

## Main Disposition

Main reproduced the cited current routing, permission, profile, helper, and catalog facts by direct readback. No current accepted-outcome or non-deferrable defect was found, so no correction or new work is authorized.

- The broad README reviewer-map wording at line 428 is non-normative catalog shorthand; the specific catalog entry at line 507 and always-loaded `global/AGENTS.md:97-99` carry the exact trigger. It does not create a second owner or reachable every-task route.
- The readiness agent description omits the explicit Ordinary Small stay-quiet phrase, but its role trigger is exact and the always-loaded main route owns the exemption. The configured `ordinary-small-exempt` member launched no child. This is non-material duplication avoidance, not a missing behavior guard.
- Frozen prior reviewer body bytes were not independently extracted in this maintenance pass. The frozen source digest, task 2.2 prior/current source evidence, and configured current behavior bound the review; no causal improvement claim is made.
- Installation/activation/restart, other models/providers/domains, and causal historical comparison remain outside the claim.

Commands run by the reviewer: none. Main used read-only source inspection only. External operations: none.
