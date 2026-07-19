## Context

The current runtime already records a scope lock and limits polish, but its post-mutation exception lets a reproducible P0/P1 classification authorize a new correction or acceptance criterion. Delivery and final-review output is binding through `Required Next Actions` and `changes_requested`, while P1 definitions include broad readiness, architecture, reliability, compatibility, and evidence gaps. A reviewer can therefore reject readiness and implicitly authorize new work at the same time.

The earlier binding rule fixed the opposite failure mode, where the primary orchestrator ignored a valid blocked delivery result and ended an incomplete root goal. The new model must preserve binding rejection without preserving reviewer-owned scope expansion.

This is a loaded global instruction change and therefore follows the Material qualification path. It changes instruction contracts only; it does not install or activate a different global configuration, perform remote operations, or retrofit active OpenSpec changes.

## Goals / Non-Goals

**Goals:**

- Make post-freeze scope closed-world and monotonic: it may shrink but cannot grow inside the same revision.
- Give the user exclusive scope authority while preserving evidence-backed readiness rejection by reviewers and gates.
- Permit at most one bounded correction wave before final review, only for a candidate-attributable violation of a frozen criterion that is fully correctable inside frozen artifact scope; allow one fresh corrected-candidate SDET only when that wave is consumed.
- Make out-of-scope P0/P1 findings, unknowns, missing prerequisite capabilities, and final/delivery rejection terminal for the current qualification attempt.
- Prevent qualification evidence work from becoming a second product inside the current change.
- Enforce the new contract with the repository's existing validators and focused tests.

**Non-Goals:**

- No new lifecycle service, state store, plugin, hook, MCP server, agent, skill, validator framework, evidence ledger, benchmark harness, simulator, cross-repository runner, or background workflow.
- No edits to `integrate-continuous-sdlc-learning`, `add-lightweight-sdet-pr-ready-sdlc`, their historical artifacts, or unrelated active changes.
- No automatic splitting, migration, archive, or rewrite of existing OpenSpec changes.
- No application code, public API, protocol, compatibility implementation, deployment, release, installation, activation, commit, push, or remote operation.
- No attempt to make instruction compliance an OS sandbox or cryptographic guarantee.

## Decisions

### 1. Separate readiness authority from scope authority

Reviewers, SDET, validation, and delivery gates may produce binding evidence that the current candidate is not ready. They never authorize a candidate mutation, task addition, new acceptance criterion, new gate, new write path, or evidence tool. Only an explicit user decision may expand scope, and post-freeze expansion creates a new approved revision or separate change rather than modifying the frozen revision in place.

This replaces the current model where P0/P1 is both a readiness classification and a correction authorization. The alternative of narrowing the P1 definition alone is rejected because any severity exception still gives reviewers indirect scope authority.

### 2. Freeze one closed-world scope capsule before candidate mutation

The existing Authoritative Brief records one readable scope capsule with:

- one primary outcome;
- frozen acceptance criterion IDs and exact observable statements;
- frozen task IDs, with broad requests such as “implement all tasks” bound to that snapshot;
- allowed write roots and exact allowed additions;
- forbidden artifacts and explicit non-goals;
- mandatory gate IDs, exact procedures, trusted sources, and baseline outcomes;
- one initial fresh SDET, one correction wave, at most one fresh corrected-candidate SDET when that correction is consumed, one final review, and one delivery review for Material work;
- the stop line and terminal outcomes.

The capsule is not a new runtime service or state machine. OpenSpec, an existing project brief, or another readable project-native record may carry it. After freeze, checkbox/status and evidence-reference updates are allowed, but new criterion, task, gate, or path IDs are not part of the current revision.

### 3. Use a four-predicate correction eligibility rule

A current-change correction is eligible only when all of the following are evidenced:

1. The finding references a frozen acceptance criterion ID.
2. A concrete reproducer demonstrates the violation on the current candidate.
3. Baseline-versus-candidate evidence shows that the candidate introduced the violation, worsened it, or made it newly reachable.
4. The complete minimal correction remains inside frozen write roots and exact allowed artifacts, introduces no persistent evidence infrastructure, and the single correction wave remains unused.

If any predicate is false or unknown, the finding may reject readiness but cannot authorize current-change work. Pre-existing baseline debt remains attributed to baseline unless the frozen scope explicitly made its removal the primary outcome.

### 4. Make unknown and external blockers terminal, not generative

After freeze, an unknown may receive bounded read-only investigation. It may then become residual risk, an evidence-backed in-scope defect, or a terminal external blocker. It never becomes implementation authority by itself.

An out-of-scope security, compatibility, data-integrity, CI, or other P0/P1 finding remains stop-ship evidence. The orchestrator reports `Change-Ready: no` and routes an owner decision or separate prerequisite/follow-up change; it does not fix the issue inside the frozen change.

### 5. Prohibit persistent qualification infrastructure in the current change

A new reusable harness, validator framework, benchmark system, simulator, ledger, generator, cross-repository runner, or equivalent persistent artifact introduced solely to prove the current candidate is product work. It requires a separate prerequisite change even when a frozen mandatory gate cannot otherwise run.

The current change may use existing validation, an already frozen focused regression-test path, a bounded manual procedure, or ephemeral output. This removes the existing exception that allows evidence tooling when a mandatory gate is hard to reproduce.

### 6. Make qualification finite

The default Material sequence is one initial fresh SDET, zero or one eligible correction wave, at most one fresh corrected-candidate SDET if that correction is consumed, one complete current-candidate validation, one final review, and one delivery review. The corrected-candidate SDET is part of the single correction wave and never authorizes a second correction. A second serious failure after the correction wave terminates the qualification attempt.

Final Candidate Review and delivery review are accept-or-reject gates. They do not initiate autonomous correction or replay. A rejection produces `Change-Ready: no` and a new-revision, separate-change, abandon, or other explicit owner decision.

### 7. Replace action-authoring reviewer output with evidence classification

The shared reviewer contract and qualification role outputs distinguish:

- frozen criterion reference;
- observed evidence and reproducer;
- baseline/candidate attribution;
- readiness impact;
- whether all current-scope eligibility evidence is present;
- external follow-up candidates.

Reviewer and SDET outputs SHALL NOT contain `Required Next Actions` or `Actionable Continuation Items`. They use `Blocking Evidence` for facts that reject readiness and `Follow-up Candidates` for non-authorizing separate-change or investigation proposals. Final review uses `approved | approved_with_notes | rejected | blocked`.

Delivery retains its diagnostic verdict names for compatibility. `on plan` or `minor deviations` is accepted only with `Change-Ready: yes` and `Blocking for Acceptance: no`; `material deviations`, `blocked`, `not enough evidence`, `Change-Ready: no`, or `Blocking for Acceptance: yes` is rejected and terminal for the current attempt. Delivery emits `Blocking Evidence` and `Follow-up Candidates`, never an action list.

### 8. Keep deterministic enforcement inside existing validators

Existing contract modules and tests will require the canonical positive markers on loaded authority surfaces and reject the superseded P0/P1 expansion exception, reviewer-authored acceptance scope, open-ended gate additions, persistent evidence-tool exceptions, and unlimited correction replay. No fuzzy classification or semantic scope inference is added to helper code.

Production ownership is one serial `implementation-worker` dispatch with exact paths and no automated-test authorship. Shared global-config files are explicitly serialized in that brief. Main captures the Candidate Reference after production and after any SDET mutation as `git status --short` plus a scoped `git diff -- <frozen paths>`; no commit or generated identity artifact is required. A separate `code-quality-reviewer` gate is `N/A` because the candidate adds no application abstraction or new support file and existing static contracts plus complete tests cover the small validator edits.

The exact instruction write set is:

- `global/AGENTS.md`
- `global/skills/change-ready-sdlc/SKILL.md`
- `global/agents/code-quality-reviewer.md`
- `global/agents/deployment-config-reviewer.md`
- `global/agents/final-candidate-reviewer.md`
- `global/agents/implementation-readiness-reviewer.md`
- `global/agents/instruction-artifact-reviewer.md`
- `global/agents/legacy-client-compatibility-reviewer.md`
- `global/agents/legacy-evidence-reviewer.md`
- `global/agents/openspec-architecture-reviewer.md`
- `global/agents/performance-reliability-reviewer.md`
- `global/agents/protocol-api-reviewer.md`
- `global/agents/rust-concurrency-reviewer.md`
- `global/agents/sdet-quality-engineer.md`
- `global/agents/session-delivery-reviewer.md`
- `global/agents/test-coverage-reviewer.md`
- `global/agents/wire-protocol-reviewer.md`
- `instructions/leaf-reviewer-agent-contract.md`
- `instructions/universal-development-loop.md`
- `instructions/reusable-project-agent-instructions.md`
- `templates/project/AGENTS.md`
- `REPO_AGENTS.md`

The exact production support write set is:

- `tools/contracts/agents.ts`
- `tools/contracts/reviewer-binding.ts`
- `tools/contracts/sdet-quality-engineer.ts`
- `tools/contracts/skills.ts`
- `tools/validators/active-authority.ts`
- `tools/validators/devkit-contract.ts`
- `tools/validators/routing.ts`

The exact SDET test write set is:

- `tools/test-contracts.ts`
- `tools/test-contracts-change-ready.ts`
- `tools/test-contracts-change-ready-delivery.ts`
- `tools/test-helpers/library.ts`
- `tools/test-library/validator-1.ts`
- `tools/test-library/validator-2.ts`
- `tools/test-library/validator-change-ready.ts`

No new instruction, support, test, fixture, helper, or evidence file is allowed after this planning revision.

### 9. Owner-approved Revision 2 scope capsule

Revision 1 terminated after its single correction wave: complete validation showed conforming doctor active-authority fixtures were stale, and fresh corrected-candidate SDET proved their owner file was outside the frozen test scope. On 2026-07-19, the user explicitly approved a new revision rather than an autonomous correction.

Revision 2 freezes:

- primary outcome: complete the existing test-fixture migration without changing production semantics;
- active task IDs: `5.1`, `5.2`, `5.3`, `5.4`; prior unchecked Revision 1 tasks remain non-checkbox terminal history and are not marked complete;
- production artifact scope: the prior 22 instruction paths and seven production-support paths remain readable candidate inputs; no planned production mutation;
- SDET test write scope: the prior seven exact test paths plus exactly `tools/test-library/doctor.ts`;
- exact allowed additions: none;
- mandatory gates: `npm run validate:strict`, `npm test`, and `npm run openspec:validate`;
- baseline outcomes: Revision 1 `validate:strict` passed, `npm test` failed with 34 stale-fixture failures, and OpenSpec validation passed before this revision; Revision 2 reruns applicable baseline checks after artifact update;
- waves: one new initial fresh SDET, one new correction wave only if all frozen correction predicates hold, at most one fresh corrected-candidate SDET inside that wave, one final review, and one delivery review;
- stop line: any required ninth test path, new file, production-scope expansion, second serious failure, final rejection, or delivery rejection terminates Revision 2.

Candidate Reference is recaptured after the Revision 2 SDET mutation and before validation. No Revision 1 SDET, validation, final, or delivery evidence is reused as qualification evidence.

### 10. Owner-approved Revision 3 qualification-only capsule

Revision 2 passed every repository validation gate after its single correction wave. Its final reviewer returned `blocked` because the dispatch bundle summarized rather than inlined the complete corrected-candidate SDET report. The SDET and final reports also emitted an empty superseded action-list section, proving the current OpenCode process had not reloaded the changed role contracts. The final block is terminal for Revision 2 and authorizes no replay.

On 2026-07-19, the user approved Revision 3 with these immutable boundaries:

- precondition: restart OpenCode with `OPENCODE_CONFIG_DIR` still resolved to this repository's `global/` directory;
- primary outcome: qualify the unchanged Revision 2 candidate under newly loaded role contracts;
- active task IDs: `6.1`, `6.2`, `6.3`, `6.4`;
- candidate path set: exactly the Revision 2 paths; no added, removed, or newly authorized path;
- mutation authority: none; production dispatch is `N/A`, SDET is assessment-only, and correction budget is zero;
- SDET: one new fresh context must return `assessed-existing-tests` with the complete report body and no superseded action-list field;
- validation: one complete run of `npm run validate:strict`, `npm test`, and `npm run openspec:validate` on the unchanged candidate;
- final review: one fresh read-only review receives the complete SDET report inline, not a summary or external-only reference;
- delivery: one Material delivery review only after accepted final review;
- stop line: any candidate mutation, stale legacy output field, missing readable evidence, failed validation, final rejection/block, or delivery rejection terminates Revision 3 with `Change-Ready: no`.

No Revision 1 or Revision 2 SDET, final, or delivery verdict is reused as qualification evidence. Their reports remain history and failure evidence only.

### 11. Owner-approved Revision 4 strict action-field removal capsule

Revision 3's one final reviewer returned `rejected` after complete green validation. The reviewer found that registered reviewer outputs and shared delegation surfaces still exposed equivalent action-authoring fields even though the three original legacy labels were removed. The rejection is terminal for Revision 3 and authorizes no replay or mutation.

On 2026-07-20, the user selected strict removal and approved Revision 4 with these immutable boundaries:

- primary outcome: registered reviewer/SDET and shared delegation contracts expose evidence classifications only and no exact equivalent action-authoring field;
- frozen acceptance criteria:
  - `AC-R4-1`: every registered reviewer, SDET, and shared leaf-reviewer contract contains none of `Missing Tests`, `Missing Golden Tests`, `Missing Golden/Integration Tests`, `Missing Decisions`, `Required Evidence`, `Benchmark Suggestions`, `Validation Gaps`, `Manual Gates`, `Suggested Next Options`, `Required Next Actions`, `Actionable Continuation Items`, or `changes_requested`;
  - `AC-R4-2`: `global/AGENTS.md` and `REPO_AGENTS.md` do not require `Suggested Next Options` or generic actionable continuation items from reviewers/subagents and route readiness-rejecting, nonblocking, and separate-work information only through `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates`;
  - `AC-R4-3`: existing deterministic contracts reject every exact registered-role field in `AC-R4-1` and reject `Suggested Next Options` plus the exact lower-case phrase `actionable continuation items` on loaded closed-world authority surfaces, without fuzzy or semantic classification;
  - `AC-R4-4`: no path outside the prior 37-path candidate set changes, no file is added, and all three mandatory gates pass on one readable Candidate Reference;
- active task IDs: `7.1`, `7.2`, `7.3`, `7.4`, `7.5`;
- production write scope: only the already-authorized files `global/AGENTS.md`, `REPO_AGENTS.md`, `instructions/leaf-reviewer-agent-contract.md`, `global/agents/code-quality-reviewer.md`, `global/agents/implementation-readiness-reviewer.md`, `global/agents/instruction-artifact-reviewer.md`, `global/agents/legacy-client-compatibility-reviewer.md`, `global/agents/performance-reliability-reviewer.md`, `global/agents/protocol-api-reviewer.md`, `global/agents/rust-concurrency-reviewer.md`, `global/agents/test-coverage-reviewer.md`, `global/agents/wire-protocol-reviewer.md`, `tools/contracts/agents.ts`, `tools/contracts/reviewer-binding.ts`, and `tools/validators/devkit-contract.ts`;
- SDET test write scope: only the already-authorized files `tools/test-contracts-change-ready.ts`, `tools/test-helpers/library.ts`, `tools/test-library/validator-2.ts`, and `tools/test-library/validator-change-ready.ts`;
- exact allowed additions: none; Revision 4 may delete obsolete output-field lines and add exact array entries, assertions, and fixtures only inside the listed existing files;
- mandatory gates: `npm run validate:strict`, `npm test`, and `npm run openspec:validate`;
- baseline: recapture all three outcomes before production mutation; Revision 3's green outcomes are historical evidence only;
- waves: one serial production author, one initial fresh SDET, one correction wave only if all four frozen correction predicates hold, at most one fresh corrected-candidate SDET inside that wave, one final review, and one Material delivery review;
- stop line: any new path/file, equivalent field not in the frozen exact list, fuzzy classifier, persistent evidence infrastructure, second serious failure, final rejection/block, or delivery rejection terminates Revision 4 with `Change-Ready: no`.

Revision 4 does not remove domain evidence matrices, evidence-backed finding `Recommendation` fields, or the non-authorizing `Follow-up Candidates` category. It does not change non-registered worker contracts outside the frozen path set. No Revision 3 SDET, validation, final, or delivery verdict is reused as qualification evidence.

### 12. Owner-approved Revision 5 evidence-only capsule

Revision 4's one final reviewer returned `blocked` after accepting the production/test behavior, exact 37-path scope, strict 12-field removal, non-registered qwen boundary, and complete green validation. The mandatory SDET evidence was incomplete: its matrix had no separate `AC-R4-4` disposition, and the final-review bundle omitted the SDET report's actual `Requested Validation Procedures` section. The block is terminal for Revision 4 and authorizes no replay.

On 2026-07-20, the user approved Revision 5 with these immutable boundaries:

- primary outcome: qualify the unchanged Revision 4 candidate with a conforming, completely transferred evidence package;
- acceptance criteria: exactly `AC-R4-1` through `AC-R4-4` from Revision 4, with no new or changed criterion;
- active task IDs: `8.1`, `8.2`, `8.3`, `8.4`;
- candidate path set: exactly the prior 37 tracked paths; no added, removed, or newly authorized path;
- mutation authority: none; production dispatch is `N/A`, SDET is assessment-only with no write scope, and correction budget is zero;
- SDET: one new fresh context must return `Action: assessed-existing-tests`, `Status: done`, a separate risk/oracle disposition for each `AC-R4-1`, `AC-R4-2`, `AC-R4-3`, and `AC-R4-4`, exact existing-test/procedure evidence, every required `SDET_QUALITY_REPORT` section including `Requested Validation Procedures`, empty `Blocking Evidence`, and no superseded/equivalent action field;
- evidence transfer: main must preserve the complete SDET report body from opening to closing envelope without summarizing, omitting, renaming, or reordering its sections when dispatching final review and delivery;
- validation: one complete run of `npm run validate:strict`, `npm test`, and `npm run openspec:validate` against the unchanged candidate;
- final review: one fresh read-only review receives the complete exact SDET report body inline plus readable current candidate and complete validation outcomes;
- delivery: one Material delivery review only after final `approved | approved_with_notes`, receiving the same complete SDET report body, final report, candidate evidence, and validation outcomes;
- stop line: any candidate mutation, missing `AC-R4-1` through `AC-R4-4` SDET disposition, missing/renamed SDET section, summarized or incomplete report transfer, failed validation, final rejection/block, or delivery rejection terminates Revision 5 with `Change-Ready: no`.

No Revision 4 SDET, validation, final, or delivery verdict is reused as Revision 5 qualification evidence. Revision 4 reports remain history and explain why complete report transfer is a mandatory Revision 5 gate.

## Risks / Trade-offs

- **Risk: a serious out-of-scope defect stops delivery instead of being fixed immediately.** Mitigation: retain binding stop-ship evidence and route a separate prerequisite or owner-approved revision; never trade safety for scope closure.
- **Risk: one correction wave may reject a candidate that could pass after another small fix.** Mitigation: the owner may explicitly start a new revision with a new frozen capsule; the current attempt remains finite and auditable.
- **Risk: changing final-review output breaks consumers.** Mitigation: update all kit-owned contracts and focused fixtures in the same candidate and call out the breaking contract in the proposal.
- **Risk: broad acceptance criteria can still absorb findings.** Mitigation: require exact observable frozen criterion IDs and implementation-readiness rejection before mutation when criteria are not independently checkable.
- **Risk: instruction-only policy cannot prevent every model violation.** Mitigation: use deterministic positive/negative contract tests for explicit authority language and report the remaining semantic-compliance risk honestly.

## Migration Plan

1. Update canonical specs and loaded runtime authority together.
2. Update qualification role outputs and project-facing instruction mirrors in the same candidate so no mixed authority remains.
3. Update existing deterministic contracts and focused fixtures; do not add a new validator or evidence subsystem.
4. Prove positive closed-world fixtures and negative fixtures for every superseded authority path.
5. Run fresh SDET, complete repository validation, fresh final review, and Material delivery review.
6. Do not auto-rewrite active changes. They adopt the new policy only through a later explicit owner-approved revision or new work session.

Rollback is repository-only: restore this change's exact scoped files to their prior content. Installation or active-config activation is not part of this change.

## Open Questions

None. The user selected the ten-rule closed-world policy and requested that it be enforced across current relevant instructions.
