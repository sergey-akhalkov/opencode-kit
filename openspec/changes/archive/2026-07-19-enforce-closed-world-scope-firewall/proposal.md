## Why

The current anti-polishing policy still lets a reviewer-created P0/P1 classification or newly treated mandatory gate authorize additional acceptance criteria, evidence infrastructure, tasks, and correction loops. This conflates authority to reject a candidate with authority to expand the change, so Material qualification can grow into implementation, compatibility, performance, deployment, and release work inside one OpenSpec change.

## What Changes

- **BREAKING** Replace reviewer/SDET action-list and final-review correction-request semantics with evidence-only accept-or-reject semantics. Existing consumers of `changes_requested`, `Required Next Actions`, or reviewer/SDET `Actionable Continuation Items` must use `Blocking Evidence` and non-authorizing `Follow-up Candidates`.
- Replace the post-mutation P0/P1 expansion exception with a closed-world scope firewall: after the scope freeze, scope may only shrink unless the user creates an explicitly approved new revision or separate change.
- Separate readiness authority from scope authority. Reviewers, SDET, validation, and delivery gates may reject a candidate, but they may not add acceptance criteria, gates, tasks, write paths, evidence tools, or implementation work.
- Make blockers non-authorizing: an out-of-scope P0/P1 or mandatory-gate failure yields `Change-Ready: no` and a terminal owner decision or separate prerequisite/follow-up change, never autonomous scope expansion.
- Permit a current-change correction only when a reproducible candidate-attributable defect violates a frozen acceptance criterion, the complete fix remains inside the frozen write/artifact scope, and the single predeclared correction wave is still available.
- Treat post-freeze unknowns as read-only investigation, residual risk, or terminal external blockers; unknowns never become implementation authority.
- Prohibit persistent evidence infrastructure from being introduced solely to qualify the current change. A missing harness, validator framework, benchmark system, simulator, ledger, or cross-repository runner is a separate prerequisite change.
- Freeze task IDs, acceptance IDs, mandatory gate IDs, allowed write roots, allowed additions, baseline gate outcomes, and the correction budget before the first candidate mutation. A broad request such as “implement all tasks” applies only to that frozen task snapshot.
- Limit qualification to one initial fresh SDET, one correction wave, at most one fresh corrected-candidate SDET when that correction is consumed, one final review, and one delivery review. A second serious failure terminates the qualification attempt instead of opening another autonomous loop.
- Make final and delivery review accept-or-reject gates. Their findings may block readiness but may not emit binding candidate-change actions.
- Add focused static contract checks to reject the superseded P0/P1 scope-expansion exception, open-ended mandatory-gate authority, persistent evidence-tool exceptions, reviewer-authored acceptance scope, and unbounded correction replay.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-change-ready-sdlc`: Replace the current anti-polishing exception with closed-world post-freeze scope, non-authorizing blockers, candidate-attributable in-scope corrections, terminal external blockers, and finite qualification waves.
- `library-instruction-artifacts`: Require the canonical scope-firewall rules in loaded orchestration/reviewer instructions and reject superseded scope-expansion language through existing deterministic validation.

## Impact

- Runtime instruction authority: `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, every registered read-only reviewer agent, and `sdet-quality-engineer` so no reviewer/SDET output retains an action-authoring field.
- Canonical reviewer maintenance contract: `instructions/leaf-reviewer-agent-contract.md`.
- Portable project guidance only where it independently grants scope or correction authority: `templates/project/AGENTS.md` and existing reusable instruction sources discovered during design.
- Existing deterministic validation and focused instruction-contract tests under `tools/`; no new validator framework, lifecycle service, evidence store, harness, plugin, MCP server, or background workflow.
- Existing active changes are not rewritten, expanded, archived, or automatically migrated. The new runtime policy governs future work and any later owner-approved revision of an active change.
- No application code, public API, persisted data, protocol, deployment, release, remote operation, active-config installation, or compatibility layer is introduced.

## Owner-Approved Revision 2

On 2026-07-19, after Revision 1 exhausted its correction wave and a fresh corrected-candidate SDET proved that conforming doctor authority fixtures live outside the frozen test scope, the user approved one exact scope addition: existing file `tools/test-library/doctor.ts`. Revision 1 remains terminal history. Revision 2 invalidates prior qualification evidence, freezes a new task/scope capsule, permits no other path or capability expansion, and reruns fresh SDET, complete validation, final review, and delivery.

## Owner-Approved Revision 3

On 2026-07-19, after Revision 2 passed complete repository validation but its one final reviewer blocked on a missing inline SDET report body and both SDET/final outputs exposed stale loaded legacy fields, the user approved a qualification-only Revision 3 after an OpenCode restart. Revision 3 adds no path, file, requirement, correction budget, or candidate mutation authority. It exists only to load the new role contracts, assess the unchanged candidate through fresh SDET, rerun complete validation, and provide complete inline evidence to one fresh final review and one delivery review.

## Owner-Approved Revision 4

On 2026-07-20, after Revision 3's final reviewer rejected the candidate because registered reviewer and shared delegation contracts retained equivalent action-authoring fields, the user approved the strict-removal option. Revision 4 adds no path, file, capability, fuzzy classifier, or evidence subsystem. It removes the exact equivalent fields from the existing frozen path set, routes their information only through `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates`, and extends existing deterministic validators and fixtures to reject those exact fields.

## Owner-Approved Revision 5

On 2026-07-20, after Revision 4's final reviewer accepted the production/test behavior and green validation but blocked on incomplete SDET evidence packaging, the user approved an evidence-only Revision 5. Revision 5 adds no path, file, requirement, capability, mutation authority, correction budget, or evidence subsystem. It assesses the unchanged candidate through one fresh SDET report with explicit `AC-R4-1` through `AC-R4-4` dispositions and the complete required report schema, reruns the three mandatory gates once, and supplies the exact complete SDET report body to one fresh final review and one Material delivery review.
