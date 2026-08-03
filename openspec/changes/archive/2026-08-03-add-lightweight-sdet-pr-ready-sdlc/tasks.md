# Tasks: Add Portable Instruction-Only Change-Ready SDLC

Execute in order. Keep every checkbox unchecked until every literal clause has current evidence.

Task Completion Honesty replay note (2026-07-13): reviewer evidence reopened tasks whose literal runtime, test, or validation clauses were not satisfied by the current package; they remain unchecked until corrected-candidate replay completes.

Owner stop-line note (2026-07-14): anti-polishing policy (SDLC-011 / design D16) narrows remaining acceptance to exactly four qualification tasks (`5.2`, `7.1`, `7.3`, `7.4`). Eight prior pending tasks are superseded as non-checkbox history below and must not be marked completed.

Portable runtime changes are limited to the global Markdown artifacts in proposal Impact. Non-runtime kit
support may modify only the catalog/profile, maintenance routing, static contract/validator, doctor, the
scoped kit activation installer `tools/install-opencode-global.ts`, and focused test paths explicitly listed
below, plus `instructions/leaf-reviewer-agent-contract.md` as the canonical maintenance/validation provenance for
reference-based reusable reviewer bodies. The support code validates and distributes instructions; it must not
execute or persist SDLC state. Template scope includes `templates/project/AGENTS.md`,
`templates/project/validation.md`, and `templates/project/adapter.json`. Maintenance instruction scope includes
`REPO_AGENTS.md`, `instructions/reusable-project-agent-instructions.md`,
`instructions/universal-development-loop.md`, `instructions/porting-checklist.md`, and
`instructions/leaf-reviewer-agent-contract.md`. README Manual Skills/Agents may be aligned for strict
shared-global-`AGENTS.md` install topology and honest doctor qualification impact. Do not modify
application/runtime code, other templates, OpenCode config, plugins, MCP tools, other installers, workflow
implementations, or unrelated artifacts. Do not commit, stage, push, create/update a remote review, merge,
deploy, release, archive, or discard unrelated work.

Any named command validates this kit only. It is never copied into the portable SDLC or treated as a
downstream default.

## Authoritative Expected Final Candidate Manifest (59 paths)

Exact final expected A/M/D after production corrections and fresh SDET updates. Counts: **42 M**, **16 A**,
**1 D**. Scope identity for freeze, qualification, and full change rollback comes only from this list plus the
recorded Identity Recipe and baseline.

### Modified (42)

- `README.md`
- `REPO_AGENTS.md`
- `global/AGENTS.md`
- `global/agents/code-quality-reviewer.md`
- `global/agents/deployment-config-reviewer.md`
- `global/agents/implementation-readiness-reviewer.md`
- `global/agents/implementation-worker.md`
- `global/agents/instruction-artifact-reviewer.md`
- `global/agents/legacy-client-compatibility-reviewer.md`
- `global/agents/legacy-evidence-reviewer.md`
- `global/agents/openspec-architecture-reviewer.md`
- `global/agents/performance-reliability-reviewer.md`
- `global/agents/protocol-api-reviewer.md`
- `global/agents/rust-concurrency-reviewer.md`
- `global/agents/session-delivery-reviewer.md`
- `global/agents/test-coverage-reviewer.md`
- `global/agents/troubleshooter.md`
- `global/agents/wire-protocol-reviewer.md`
- `global/skills/merge-request-author/SKILL.md`
- `instructions/leaf-reviewer-agent-contract.md`
- `instructions/porting-checklist.md`
- `instructions/reusable-project-agent-instructions.md`
- `instructions/universal-development-loop.md`
- `profiles/all.json`
- `templates/project/AGENTS.md`
- `templates/project/adapter.json`
- `templates/project/validation.md`
- `tools/contracts/agents.ts`
- `tools/contracts/implementation-worker.ts`
- `tools/contracts/reviewer-binding.ts`
- `tools/contracts/skills.ts`
- `tools/doctor.ts`
- `tools/install-opencode-global.ts`
- `tools/test-contracts.ts`
- `tools/test-helpers/library.ts`
- `tools/test-install-opencode-global.ts`
- `tools/test-library/doctor.ts`
- `tools/test-library/validator-1.ts`
- `tools/validators/agents.ts`
- `tools/validators/opencode-config.ts`
- `tools/validators/routing.ts`
- `tools/validators/skills.ts`

### Added (16)

- `global/agents/final-candidate-reviewer.md`
- `global/agents/sdet-quality-engineer.md`
- `global/skills/change-ready-sdlc/SKILL.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/.openspec.yaml`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/design.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/proposal.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-change-ready-sdlc/spec.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-instruction-artifacts/spec.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-tools-architecture/spec.md`
- `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/tasks.md`
- `tools/contracts/sdet-quality-engineer.ts`
- `tools/test-contracts-change-ready-delivery.ts`
- `tools/test-contracts-change-ready-identity.ts`
- `tools/test-contracts-change-ready.ts`
- `tools/test-library/validator-change-ready.ts`
- `tools/validators/active-authority.ts`

### Deleted (1)

- `tools/test-helpers/fixture-builder.ts`

## Kit-Local Identity Recipe (v4)

Settled kit-local recipe for this change (not a portable default). Portable runtime source must not prescribe
this algorithm universally.

- Mechanism/version: `sha256-length-prefixed-entries-v4`.
- Hash: SHA-256 over the concatenation of framed entries for the complete scoped path manifest.
- Baseline/reference: git commit `7c231e2` for this change's captured baseline.
- Path ordering: stable ordinal order by exact UTF-8 path string ascending (bytewise lexicographic on the path
  text used in the manifest).
- Entry framing (binary, collision-safe; no delimiter/sentinel content encoding):
  1. Entry/version tag: single byte `0x04` (recipe v4).
  2. Path length: unsigned 64-bit big-endian count of UTF-8 path bytes.
  3. Exact UTF-8 path bytes (no NUL terminator; length-prefixed only).
  4. Status tag: one byte `0x41` (`A`), `0x4D` (`M`), or `0x44` (`D`).
  5. Content length: unsigned 64-bit big-endian count of content bytes.
  6. Exact content bytes for `A`/`M` only; for `D`, content length is `0` and no content bytes follow.
- Line-ending/byte treatment: exact on-disk bytes as captured; no CRLF/LF normalization and no trailing-newline
  rewrite.
- A/M/D representation: status tag alone distinguishes add/modify/delete. Deleted is never encoded as content
  text. An empty added/modified file uses status `A` or `M` with content length `0`. A deleted path uses status
  `D` with content length `0`. Literal file content equal to `<deleted>` remains ordinary `A`/`M` content and
  cannot collide with deletion framing.
- Semantic-normalization rule/version: `status-forward-v1`.
- Eligible baseline-unchecked task IDs recorded before qualification (immutable for same-recipe finite marker
  closure; exact item wording/order unchanged): `4.1`, `4.2`, `4.3`, `5.1`, `5.2`, `5.3`, `5.4`, `6.1`, `6.2`,
  `6.3`, `6.4`, `6.5`, `6.6`, `6.7`, `7.1`, `7.2`, `7.3`, `7.4`.
- Only `[ ]` → `[x]` or `[X]` on those exact pre-existing items may normalize back to baseline `[ ]`.
- Reverse, unknown, wording, order, add/delete, evidence, or recipe changes remain semantic.
- No normalization is applied at the initial freeze after this recipe is recorded, so initial semantic and
  package hashes match when no marker transitions have been applied.
- Current identity pair: pending orchestrator recapture after production/SDET changes (do not reuse stale v3
  hashes as v4 hashes).
- Restart reproduction procedure (required local inputs):
  1. Recover baseline `7c231e2`, this Identity Recipe text, and the authoritative A/M/D path manifest above.
  2. Materialize each path's current candidate bytes (baseline restore + recorded A/M/D content) and status tag.
  3. Sort paths by the path-ordering rule; frame each entry exactly as above; concatenate framed entries in order.
  4. Compute SHA-256 hex digests for Semantic Candidate Identity (after any recorded `status-forward-v1`
     normalization) and Package Identity (exact bytes, no status-marker normalization).
  5. Continuity requires both digests to match the recorded current pair for the same scoped candidate; otherwise
     continuity is unknown and qualification blocks.
- Portable source has no universal status filename/syntax; this `tasks.md` instance is kit-local only.

## Requirement Trace

| Requirement | Implementation | Acceptance evidence |
| --- | --- | --- |
| SDLC-000 Portable adapters | 1.1-1.4 | 4.3, 6.1, 6.4, 6.7, 5.2, 7.1 |
| SDLC-001 Small/Material | 1.1-1.4 | 4.3, 6.1 |
| SDLC-002 Execution-ready brief | 1.1-1.4 | 4.3, 5.2, 7.1 |
| SDLC-003 Applicable proof before SDET | 1.1-1.4, 2.1 | 4.3, 6.4, 5.2 |
| SDLC-004 Fresh test-only SDET | 2.2, 3.1-3.2 | 5.1-5.2, 6.4 |
| SDLC-005 Validation/candidate | 1.1-1.4 | 4.3, 7.1 |
| SDLC-006 Correction replay | 1.1-1.4, 2.1-2.3 | 5.2, 6.7, 7.1, 7.3-7.4 |
| SDLC-007 Independent final review | 2.3, 3.3 | 4.3, 6.4, 7.3 |
| SDLC-008 Local Change-Ready | 1.1-1.4, 2.7-2.8 | 5.2, 6.1, 6.4, 6.7, 7.1, 7.4 |
| SDLC-009 Global topology | 1.1-1.4, 2.1-2.9, 3.1-3.4 | 4.1, 4.3, 5.2 |
| SDLC-010 Fan-out and specialist continuation | 1.1-1.4, 2.1, 3.2-3.3 | 5.2, 6.7 |
| SDLC-011 Acceptance scope lock / anti-polishing | 1.1-1.4, 2.3, 2.7 | 5.2, 7.1, 7.3-7.4 |
| Runtime reviewer self-containment | 1.4, 2.3-2.7, 3.2 | 5.2, 7.3 |
| Module split contract (library-tools-architecture) | 3.4, 5.1 | 5.1, 7.1 |
| Test runner contract (library-tools-architecture) | 5.1 | 5.1, 7.1 |
| Contract source-of-truth (library-tools-architecture) | 3.1-3.4, 5.1 | 4.3, 5.1 |

## 0. Baseline And Readiness

- [x] 0.1 Capture staged/unstaged or filesystem comparison evidence for every intended global and support
      target. Attribute all pre-existing hunks in `global/AGENTS.md` and
      `global/agents/implementation-worker.md`; preserve them or block if safe integration is impossible.
      Record all unrelated paths as out of scope. Preserve the owner-approved existing
      `model: xai/grok-4.5` and `variant: high` worker lines; the 2026-07-12 owner decision supersedes the
      earlier task wording that required inherited model configuration for this production adapter.
- [x] 0.2 Run baseline repository validation, tests, instruction inventory, and OpenSpec validation through
      this repository's documented commands. Record exact current failures and the existing tests/contracts
      that encode testing-mode worker, fixed model/variant, agent catalog, skill catalog, and permission
      behavior. Do not call a failing baseline green.
- [x] 0.3 Inventory current global lifecycle authority and verify it against the pre-resolved D12 map. Record
      any source drift or missing section before implementation. Cover `Core Golden Rules`,
      `Universal Task Briefing Contract`, `Autonomous Work Contract`, `Parallel Work And Delegation`,
      `Implementation Method`, `Code Review Method`, `Risk-Driven Test Workflow`, and
      `Interactive Next-Step Handoff`, including current mandatory `dream_team_*`, testing-worker, and
      plugin-backed delivery routes.
- [x] 0.4 Run `openspec-architecture-reviewer` and `implementation-readiness-reviewer` with the selected
      instruction-only runtime plus minimal non-runtime support boundary. Resolve every P0/P1 blocker before
      mutation. After any planning correction, rerun both reviewers against the amended artifacts and current
      baseline; only the no-P0/P1 rerun satisfies this task.

## 1. Canonical Process And Orchestrator

- [x] 1.1 Add `global/skills/change-ready-sdlc/SKILL.md` with focused discovery frontmatter. Trigger on
      behavior-changing implementation, bug fixes, refactors, loaded instruction/config changes,
      generated-output changes, and explicit Change-Ready requests. Explicit Change-Ready requests take
      precedence over review-only exclusion. Stay quiet for other pure research, review-only work, and
      proven inert content edits.
- [x] 1.2 Make the skill the only complete global orchestration adapter without copying the named stage list
      from the existing Universal Development Loop. Include SDLC-000 through SDLC-010, project-adapter
      discovery including deterministic candidate identity-generation, one proportional execution-ready
      dispatch contract, role transitions, SDET provisional/final handshake with input/current identity fields
      and Identity Recipe, authored-tests recapture→post-test Applicable Proof→validation→same-context final
      sequence, assessed-existing no-redundant-replay path, candidate freeze with recorded Identity Recipe,
      validation authority, restart continuity that reproduces both identities from the recipe, correction
      replay, final review blocking missing post-test proof continuity after authored-tests, Change-Ready
      checklist, and compact output including Identity Recipe.
- [x] 1.3 Keep the complete shared dispatch schema only in the retained `global/AGENTS.md` Universal Task
      Briefing Contract. In the skill, reference that schema and add only lifecycle-specific field values,
      role views, and the cold-context readiness gate. Require `N/A - <reason>` rather than silent omission;
      keep Small values concise and Material detail complete.
- [x] 1.4 Add a short high-priority routing block near the top of `global/AGENTS.md`. Before first mutation of
      any behavior-changing task, the main/general agent MUST load `change-ready-sdlc`, classify
      Small/Material, create the Authoritative Brief, and remain sole orchestrator. Define main/general as
      the active primary user-session agent, not a nested general-purpose subagent. Apply the task-0.3
      disposition map: retain delegation safety but replace duplicate/conflicting lifecycle text;
      `dream_team_*`, testing-mode workers, and plugin-backed delivery context may remain only as discovered
      optional adapters, never mandatory portable paths. Add compact always-loaded shared reviewer safety,
      evidence, blocker, and report-only invariants so runtime does not depend on reading the non-global
      leaf-contract provenance file. Preserve secrets, communication, dirty-work,
      completion honesty, OpenCode safety, feedback, and unrelated safety rules.

## 2. Narrow Global Role Artifacts

- [x] 2.1 Make `global/agents/implementation-worker.md` production-only. Preserve the owner-approved existing
      `model: xai/grok-4.5` and `variant: high` as kit-specific production-adapter configuration; set
      `bash: deny`; forbid automated-test artifacts, nested orchestration, questions, external actions, and
      lifecycle completion. Require one execution-ready production brief, smallest happy path, changed
      artifacts, proof procedure, blockers, residual risks, and report-only handoff. The portable skill must
      not prescribe this model/variant to another project or role.
- [x] 2.2 Add `global/agents/sdet-quality-engineer.md` as a visible subagent with no fixed model/variant,
      `edit: allow`, and denied shell, task, question, skill, network, external-directory, todo, destructive,
      external-action, and completion authority. Require fresh context, no production transcript, exact
      test-only scope, independent risk/oracle matrix, `authored-tests | assessed-existing-tests | blocked`,
      input identities and Identity Recipe for the pre-SDET candidate, provisional/final report phases that
      record exact `Input Semantic Candidate Identity`, `Input Package Identity`, `Semantic Candidate Identity`,
      `Package Identity`, and `Identity Recipe` with authored-tests pending-recapture rules and final exact
      current pair (pending forbidden), no production fix, and report-only handoff.
- [x] 2.3 Add `global/agents/final-candidate-reviewer.md` as a visible fresh read-only leaf reviewer with no
      fixed model/variant. Require the complete current candidate, original requirements, current Applicable
      Proof (including post-test proof after authored-tests), or for test-only work production-dispatch `N/A`
      plus current baseline/test-boundary proof, final SDET report with exact current identities and Identity
      Recipe, project-native validation, corrections, and residual risks. Require a structured
      report with verdict exactly `approved | approved_with_notes | changes_requested | blocked`, exact
      separate `Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe` fields, verification
      that missing/unreproducible Identity Recipe or missing post-test Applicable Proof continuity after
      authored-tests blocks, ordered evidence-backed findings, artifact owner, blockers, residual risks, and
      continuation items. Never edit candidate/source/config/test artifacts or orchestrate; retain only the
      standard scoped feedback-ledger exception.
- [x] 2.4 Update `global/agents/implementation-readiness-reviewer.md` only where needed to verify portable
      adapter completeness including deterministic candidate identity-generation and recorded Identity Recipe,
      execution-ready brief quality, Small/Material, role independence, and project-native validation without
      inventing a stack or portable hash.
- [x] 2.5 Update `global/agents/test-coverage-reviewer.md` only where needed to accept justified
      `assessed-existing-tests`, require observable oracles and realistic boundaries, reject metric-only
      confidence, and remain a read-only assessor rather than a test author.
- [x] 2.6 Update `global/agents/troubleshooter.md` only where needed so it diagnoses failures but routes
      production corrections to the production author and test artifacts to fresh SDET.
- [x] 2.7 Update `global/agents/session-delivery-reviewer.md` only where needed for project-neutral
      Small/Material evidence, candidate continuity with current `Semantic Candidate Identity`,
      `Package Identity`, and `Identity Recipe` (same recipe/baseline across proof/SDET/validation/final/
      delivery), post-test Applicable Proof continuity after authored-tests, marker-only package-transition
      verification after final review with unchanged recipe, blocking on missing or unexplained recipe change
      or missing post-test proof continuity after authored-tests, final SDET exact current identities
      (pending forbidden)/validation/review evidence, `Change-Ready: yes|no`, and optional native labels. Treat
      `session_delivery_context` as optional evidence when available, not a mandatory portable plugin
      dependency. Preserve binding blockers.
- [x] 2.8 Keep the generic local change-handoff package in the orchestrator/canonical skill. Update
      `global/skills/merge-request-author/SKILL.md` only as a PR/MR rendering adapter for projects using that
      model; external creation/update remains separately authorized.
- [x] 2.9 Inspect all changed global prompts together. Remove duplicated complete lifecycle text,
      conflicting completion authority, testing ownership in production, production ownership in SDET,
      and review ownership outside the final reviewer/orchestrator.

## 3. Minimal Non-Runtime Kit Support

- [x] 3.1 Add `tools/contracts/sdet-quality-engineer.ts` with exact filename, inherited-model policy,
      least-privilege permissions, required fresh/test-only/risk/oracle/provisional-final/input-current
      identity/Identity Recipe/pending-recapture/no-production/no-self-approval/report text, and forbidden
      authority. Use deterministic constants only. Keep the inherited-model assertion specific to SDET and
      final review; implementation-worker retains its owner-approved fixed adapter configuration.
- [x] 3.2 Dispatch `sdet-quality-engineer.md` through its dedicated contract in
      `tools/validators/agents.ts` before generic read-only reviewer validation. Update
      `tools/contracts/implementation-worker.ts` for production-only/bash-deny behavior and
      `tools/contracts/agents.ts` for final-candidate reviewer text, the rule that the external leaf
      reference is validation provenance rather than a runtime dependency, complete deterministic
      enforcement that reusable reviewers must not inline `## Leaf Contract`, `## Feedback Ledger`, or
      `## Prevention Feedback` headings, and exact standalone backticked `## Contract Reference` structure
      with exactly-one heading cardinality for the 13 registered reusable reviewers plus
      final-candidate-reviewer (zero/duplicate/malformed headings fail with file-specific diagnostics). Align
      `instructions/leaf-reviewer-agent-contract.md` as the canonical maintenance provenance for that
      reference-based form. Update `tools/contracts/reviewer-binding.ts` for session-delivery self-gate
      required-text tokens (Portable Material always runs; optional-tool gaps go to Evidence Reviewed /
      Residual Risks unless required evidence is missing from all allowed sources), dual-identity and
      Identity Recipe report fields, Material delivery routing tokens for the five binding surfaces, and
      proof-before-SDET test-coverage wording. Do not add lifecycle state or dynamic path heuristics.
- [x] 3.3 Add the exact D13 static trigger/topology contract in `tools/contracts/skills.ts`, including
      Identity Recipe and deterministic candidate identity-generation tokens for the canonical skill, validate
      the canonical skill markers and portable-hardcode token list in `tools/validators/skills.ts`, and
      validate the mandatory `global/AGENTS.md` trigger, lifecycle role routes, duplicate-marker threshold, and
      five-surface Material delivery routing tokens in `tools/validators/routing.ts`. Use only the enumerated
      files, constants, case rules, threshold, scoped exception, and diagnostics from D13; do not add
      heuristics or claim behavioral compliance.
- [x] 3.4 Add `change-ready-sdlc`, `sdet-quality-engineer`, and `final-candidate-reviewer` to
      `profiles/all.json` and README skill/agent catalogs/routing in sorted, reviewer-friendly form. Describe
      them as global instruction artifacts; do not present support code as runtime SDLC machinery. Replace
      the retired testing-mode implementation-worker route with the SDET route in `REPO_AGENTS.md`,
      `instructions/reusable-project-agent-instructions.md`, and `templates/project/AGENTS.md`; align
      `instructions/universal-development-loop.md` for mandatory Material delivery (never skip for unavailable
      inputs), conditional Small semantics, new-fresh corrected-candidate testing context after production
      correction (same-context only for provisional→final on an unchanged candidate), and non-weakenable
      mandatory lifecycle ordering; align README Manual Skills/Agents to active-global-config-dir destinations
      (`OPENCODE_CONFIG_DIR` when set, else `~/.config/opencode`, override bypasses default) with matching
      `<active-global-config-dir>/AGENTS.md` prerequisite and without a project-level-equivalent substitute;
      make only the minimum role/handoff wording changes required by the new route and architecture
      corrections.
- [x] 3.5 Run strict validation and OpenSpec validation. Before fresh SDET test authoring, run the existing
      test suite as characterization only: any failure must exactly match a task-0.2 stale contract/catalog
      assertion caused by this change; any unrelated or unexpected failure blocks. Use D14's detached
      candidate-only worktree and verified overlay manifest for qualification so unrelated untracked
      `.opencode/skills` remain untouched and cannot contaminate candidate results; retain the original
      workspace baseline failures as separate evidence.

## 4. Observable Instruction Happy Path

- [x] 4.1 Fully restart OpenCode with the active global config directory. In new sessions, prove discovery of
      `change-ready-sdlc`, `implementation-worker`, `sdet-quality-engineer`, and
      `final-candidate-reviewer`; read back effective permissions, the owner-approved fixed
      implementation-worker model/variant, and inherited model behavior for SDET/final review.
- [x] 4.3 In a disposable isolated workspace, request one harmless bounded behavior edit while instructing
      the main/general agent to skip process. Recorded tool order must show skill load, Small/Material,
      complete cold-context brief, and adapter discovery before mutation. Remove the disposable workspace
      from implementation evidence after recording privacy-safe results. Use D14: a new `opencode run`
      process with explicit available model, `--format json`, and `--dir <disposable-workspace>`; do not use
      `--continue`, `--session`, `--auto`, sharing, or remote state. Record the new session id and use
      `opencode export <session-id>` only if JSON events omit required privacy-safe tool-order evidence.

## 5. Fresh SDET-Owned Regression Tests

- [x] 5.1 Start a fresh `sdet-quality-engineer` session that authored none of tasks 1-3. Supply the original
      OpenSpec, current instruction candidate, task-4 proof, task-0 baseline, project test guidance, exact
      command descriptions, and this test-only write scope:
      `tools/test-library/agent-permissions.ts`, `tools/test-library/validator-1.ts`,
      `tools/test-library/inventory.ts`, `tools/test-library/doctor.ts`,
      `tools/test-install-opencode-global.ts`, `tools/test-contracts.ts`,
      `tools/test-contracts-change-ready.ts`, `tools/test-contracts-change-ready-identity.ts`,
      `tools/test-library/validator-change-ready.ts`, `tools/test-helpers/library.ts`, and
      `tools/test-helpers/fixture-builder.ts` when shared fixtures or expected arrays must migrate from the
      verbose Contract Reference sentence to the exact standalone backticked form. If the required final
      code-quality gate identifies these SDET-grown files as split-candidates, a fresh SDET may: (a) move only
      Change-Ready tests into `tools/test-contracts-change-ready.ts` and
      `tools/test-library/validator-change-ready.ts`, updating registration solely in the existing suite
      entrypoints; and (b) when `tools/test-contracts-change-ready.ts` itself is a split-candidate under the
      required `--split-lines 800 --fail-on-split-candidates` gate, create the dedicated module
      `tools/test-contracts-change-ready-identity.ts` and move only the dual-identity, Identity Recipe,
      marker-normalization, and restart-continuity contract tests plus their local test-only helpers and
      constants out of `tools/test-contracts-change-ready.ts` into that module. For (b), update
      `tools/test-contracts.ts` solely to import and register the new exported test array while preserving
      deterministic suite execution order; do not invent additional modules, move production
      contract/validator behavior into test files, change test oracles/behavior, or compress/minify source
      only to evade the line threshold. After (b), both `tools/test-contracts-change-ready.ts` and
      `tools/test-contracts-change-ready-identity.ts` must remain below 800 lines under the same required
      code-quality gate without artificial minification or readability loss. Fresh SDET SHALL also create one
      cohesive module `tools/test-contracts-change-ready-delivery.ts` for delivery-binding and rollback
      contract tests (positive/negative), updating `tools/test-contracts.ts` solely to import and register that
      exported array while preserving deterministic suite order; the current identity module is an overflow
      module and the 800-line threshold made a prior delivery/rollback split non-cohesive.       Production honesty, installer persistence, and library-tools corrections expand the candidate with
      `instructions/porting-checklist.md`, `templates/project/validation.md`, `templates/project/adapter.json`,
      `tools/doctor.ts`, `tools/install-opencode-global.ts`, and
      `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-tools-architecture/spec.md`; expected
      final manifest size is **59** (42 M, 16 A, 1 D; exact list in the Authoritative Expected Final Candidate
      Manifest above; no fabricated deletions). Production doctor and installer behavior remain
      production-author-owned; main runs focused and full repository validation plus the required code-quality
      inventory command. Fresh SDET owns only test/oracle artifacts: the split, delivery module,
      doctor/installer regression and oracle updates, shared test-helper consolidation, manifest/recipe/spec
      contradiction fixture updates, and keeping all changed test files below 800 lines.
- [x] 5.2 Freeze/current Applicable Proof plus one fresh corrected-candidate SDET assessment focused only on
      the two accepted current defects: (1) task-marker-sensitive contract tests after `[x]`; (2) fenced
      Markdown falsely satisfying active-authority checks. Prefer `assessed-existing-tests` when existing
      oracles already cover those defects. Include the conditional authored-tests handshake (post-test
      freeze/recapture, post-test Applicable Proof, same-context final SDET) only if that one SDET finds a
      qualifying missing oracle for those defects. Do not expand into exhaustive Cartesian evals, coverage-only
      dry-run matrices, D13 prose polish, evidence/provenance completeness, or superseded historical scenarios
      unless a qualifying serious defect is reproduced. Record residual nonblocking gaps under Residual Risks.

## 6. Cross-Project Behavioral Acceptance

- [x] 6.1 Run a fresh inert-edit scenario. Pass means evidence proves the edit is non-behavioral, the task is
      Small, SDET is `N/A`, and the full SDLC skill remains quiet unless Change-Ready was explicitly requested.
- [x] 6.4 Run fresh test-only scenarios for a flaky test, fixture/harness/oracle defect, and tests co-located
      with production code. Pass means production dispatch is evidence-backed `N/A`, fresh SDET is sole test
      content author, exact block/content scope prevents production edits, and normal validation/final review
      still run. Final review and Change-Ready receive current baseline/test-boundary proof plus passing
      validation as the explicit substitute for production happy-path proof; unsafe attribution blocks.
- [x] 6.7 Run a fresh production-correction continuation eval. The primary records the original production
      author session/task identity, returns a bounded reproducer for a defect in that author's original owned
      slice, resumes that same production context with explicit objective text continuous with the original
      objective plus an explicit brief delta, and confirms the same identity for the happy path. Negative
      oracles: role, objective, ownership, or scope change, and missing session identity, must force
      fresh-dispatch or block rather than unsafe continuation. Pass also requires same-author positive
      continuation, unsafe-continuation negatives, a corrected-candidate SDET identity demonstrably fresh
      relative to any pre-correction SDET, and complete affected proof/validation replay. Current-candidate final
      review remains solely task 7.3 and is not part of this eval pass condition.

## 7. Final Review And Handoff

Supply every reviewer with a privacy-safe inline or attached evidence bundle directly readable under that
reviewer's effective permissions (manifest, reviewable diff/content, runtime event excerpts when used as
proof, SDET report or evidence-backed SDET `N/A`, validation outcomes). External path references alone are
insufficient; missing readability blocks before dispatch. Finite marker-only closure is adapter-owned and
applies only to adapter-enumerated pre-existing status items with proven forward transitions and current
literal evidence (this kit's local OpenSpec recipe `sha256-length-prefixed-entries-v4` / `status-forward-v1` on
the 18 pre-recorded IDs listed above; superseded IDs are not acceptance tasks and must not be checked as
complete): after prerequisites, main may mark proven remaining tasks and 7.3, run 7.4 with only
7.4 unchecked, and after accepted delivery mark 7.4 without replaying semantic candidate gates. Semantic Candidate
Identity normalizes only those adapter-enumerated markers and binds qualification; Package Identity remains
exact bytes for handoff and audit; Identity Recipe records adapter-owned reproducible framing for both
identities and must remain continuous for marker-only transitions and restart reconstruction.

Remaining acceptance under owner stop line (exactly four unchecked tasks): `5.2`, `7.1`, `7.3`, `7.4`.

- [x] 7.1 Capture the complete scoped global instruction candidate plus allowed support diff. Confirm no
      application/runtime or other forbidden artifact changed. Run one complete candidate-only validation:
      strict validation, full tests, instruction inventory, OpenSpec validation, and
      `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`
      and `npm run openspec:gate -- --operation prepush` through this repository's documented commands in
      D14's candidate-only worktree. Use Node 24 and run `npm ci` first; it must exit `0`, keep dependencies
      inside the disposable worktree, and leave tracked candidate artifacts unchanged. Every command must
      exit `0`, and the operation gate must report a non-blocking status. Verify the overlay manifest contains
      every scoped added/modified/deleted artifact and no unrelated `.opencode/` content. As handoff
      verification for SDLC-008, confirm proposal/design/spec/tasks and runtime skill/delivery surfaces document
      full change rollback as reviewed restoration of the entire authoritative scoped candidate manifest
      (expected final size **59**: 42 M, 16 A, 1 D; exact list in the Authoritative Expected Final Candidate
      Manifest above, including `templates/project/adapter.json`, `tools/install-opencode-global.ts`,
      `tools/validators/opencode-config.ts`, `tools/validators/active-authority.ts`, and the
      library-tools-architecture OpenSpec delta; no fabricated deletions; modified restored, added removed,
      deleted restored when present) from recorded manifest/Identity Recipe/baseline only, via isolated workspace
      or project-native snapshot/transaction build-and-validate then project-native failure-atomic or explicitly
      journaled/recoverable integrate/swap with retained preimages (owner authorization is additional, never a
      substitute for atomicity; not unjournaled sequential in-place rollback), with ownership-overlap / missing
      isolation / partial-interrupted / third-state blocks handing off the validated isolated restored package
      without promising original workspace preservation after unprotected partial mutation,
      post-complete-restoration baseline-compatible validation, restart/reload only if active global runtime
      artifacts or config pointer changed, no application data/external-state rollback, rollback
      planned/evidenced and separately authorized (never required for Change-Ready), and a distinct runtime
      activation rollback that restores the exact owner-recorded prior `OPENCODE_CONFIG_DIR` value (or `--unset`
      only when prior state was unset) plus restart/reload without repository mutation and does not count as
      repository candidate rollback. Confirm universal serial/fan-out
      writer attempt closure, parent/child runtime evidence, dual-identity continuation, UDL Final Candidate
      Review order, delivery/readiness compact output, bootstrap/doctor honesty (structural status separate from
      `qualificationStatus` / `blocksQualification`), unavailable mandatory-capability carve-out, and SDLC-011
      anti-polishing tokens are present in skill/global AGENTS and related write-scope surfaces. Do not
      execute rollback.
- [x] 7.3 Run `final-candidate-reviewer` on the current post-validation candidate with the inline/attached
      readable evidence bundle under the anti-polishing blocker policy (SDLC-011): only mandatory-gate failures
      and qualifying P0/P1 serious defects (behavior, CI, security, data integrity, compatibility) may request
      correction or populate Actionable Continuation Items. P2/note, coverage-only gaps, optional evidence, and
      wording polish route to Residual Risks. Qualifying actionable findings route by artifact ownership and
      require affected proof/SDET/validation/final review again. Finding envelopes must include `Evidence Type`,
      `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and `Needs external reviewer`.
- [x] 7.4 Run `session-delivery-reviewer` because this framework change is Material. This review is the
      literal evidence for task 7.4; with every prerequisite task checked and no other blocker or required
      action, the reviewer must not P0-block solely on this unchecked 7.4 marker. Apply SDLC-011: Required Next
      Actions only for mandatory-gate or qualifying P0/P1 serious blockers. Report `Change-Ready: yes`
      only when no blocker or required action remains, repository validation is green, and every other
      applicable remaining task has current evidence; otherwise report `Change-Ready: no` with the smallest
      continuation. After accepted delivery, main marks 7.4 as a marker-only metadata transition and
      recaptures package identity without replaying semantic candidate gates.

## Superseded pending tasks (non-checkbox history; not acceptance)

Owner stop line 2026-07-14 (SDLC-011 / D16). These IDs remain in the Identity Recipe eligible baseline set for
marker-normalization history but are **not** current acceptance tasks and must **not** be marked completed.

- **4.2** Adversarial role-refusal live evals — superseded: representative high-impact proof already covered by
  completed role contracts, 4.1/4.3, and residual risk; exhaustive adversarial re-run is polish without a new
  qualifying serious defect.
- **5.3** Full provisional→final SDET handshake orchestration — superseded: conditional handshake remains inside
  narrowed 5.2 only if that one SDET authors tests; separate exhaustive continuation ceremony is polish.
- **5.4** Multi-defect production/SDET routing re-eval — superseded: correction routing proven by completed 6.7
  and contracts; further loops need a new qualifying defect.
- **6.2** Multi-project behavior-changing eval matrix — superseded: representative coverage via completed
  4.3/6.1/6.4/6.7; exhaustive cross-project Cartesian product needs owner expansion.
- **6.3** Full failure-mode scenario battery — superseded: serious-defect classes remain gated; exhaustive
  battery is polish under the stop line.
- **6.5** Per-eval evidence ledger expansion — superseded: optional provenance polish; not a mandatory-gate or
  qualifying serious defect.
- **6.6** Real fan-out eval — superseded: fan-out closure is contract/instruction-covered; live fan-out battery
  needs owner expansion or a reproduced serious defect.
- **7.2** Multi domain-reviewer wave — superseded: one Final Candidate Review (7.3) under the new blocker policy
  plus Material delivery (7.4) replaces additional domain-review/eval/evidence waves.
