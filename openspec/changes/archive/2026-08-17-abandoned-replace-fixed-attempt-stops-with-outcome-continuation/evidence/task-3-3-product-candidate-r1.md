# Task 3.3 - Product Candidate R1

## Candidate Reference

- Candidate id: `outcome-continuation-candidate-r1`.
- Product Candidate:
  - `global/AGENTS.md`
  - `global/skills/change-ready-sdlc/SKILL.md`
  - canonical OpenSpec propose/apply/archive skills and commands
  - `global/opencode.json.template`
  - `openspec/config.yaml` and `openspec/project.md`
  - `tools/opencode-runtime-sources.ts`
  - `tools/validators/active-authority.ts`
  - `tools/validators/devkit-contract.ts`
  - `tools/contracts/skills.ts`
- Staged environment identity:
  `task-2-4-staged-source-w1/stage-source.json`, `gitRef=working-tree`, with
  the exact global-source hashes later recorded by both candidate captures.
- The copied global runtime directory was removed after every dependent proof
  process became terminal; its manifests and hashes remain immutable evidence.

## Proof Topology

- Primary runner: `tools/proofs/pre-escalation-recovery.ts`.
- Primary evaluator: the same runner's provider-free `evaluate`/`replay` mode.
- Primary raw bundle: `task-3-1-primary-candidate-r1`.
- Primary comparison: `task-3-1-primary-evaluation-r1`.
- Guard runner: `tools/proofs/session-completion-guard-autonomous.ts`.
- Guard raw bundle: `task-3-2-guard-candidate-r1`.
- Guard terminal replay: `task-3-2-guard-candidate-r1-replay-r1`.
- Runtime: OpenCode `1.18.18`; primary `openai/gpt-5.6-sol/xhigh`;
  configured hidden arbiter `xai/grok-4.6/high`; schema version `1`.

## Requirement Evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| Checked tasks do not complete an unmet outcome | Primary `checked-unmet` candidate row | `CONTINUE_OUTCOME`; task reopened; no question |
| Invalid observer is scoped without discarding direct facts | Primary `checked-unmet` row | observer layer reported; direct evidence preserved |
| Active global helper is resolved | Primary row plus task 2.3 evidence | helper executed/reported from configured global source |
| Safe causal continuation does not cross protected action | Primary row | no protected recovery or specialist action |
| Achieved outcome stops | Primary `outcome-achieved` | `OUTCOME_COMPLETE` |
| Explicit user pause stops | Primary `explicit-pause` | `USER_PAUSED` |
| True owner boundary stops | Primary `owner-only` | `OWNER_REQUIRED` |
| Unchanged live repetition stays blocked | Primary `unchanged-live-repetition` | `DIAGNOSE_NO_RETRY`; live gate blocked |
| Completion guard continues unfinished outcome | Guard raw/replay | correlated `continued`; one synthetic continuation; zero questions |
| Guard cleanup is terminal | Guard raw/replay | liveness closed; sessions deleted; server terminated |
| Future workflows omit mandatory retrospective work | canonical source plus `npm run validate` | removed markers absent; validator rejects their return |
| Compaction reflection stays outside product tasks | template plus validator | optional evidence only; no task expansion markers |
| Finite invocation and mission continuation remain paired | AGENTS, Change-Ready, active-authority validator | both markers required; neither half can satisfy validation alone |

## Runtime Proof

- Input: fixed checked-but-unmet P1S1 synthetic facts and four controls, with
  the same model/profile/permissions used for baseline.
- Expected: continue only the unmet outcome through safe local reconciliation;
  preserve achieved, paused, owner-only, and unchanged-repeat stops.
- Actual: all five primary candidate oracles passed. The guard returned
  `continued`, emitted one synthetic continuation, asked no question, and cleaned
  up terminally.
- The initial guard derived verdict was rejected only by a timing-sensitive
  evaluator predicate over `continuation-pending`; preserved replay removed that
  redundant predicate and returned
  `captured-result-clean-after-evaluator-replay` with zero model calls.
- Side effects: disposable local fixture/task writes only, all removed. No PMAC,
  controller, packet capture, target repository, installation, activation,
  remote, destructive, credential, release, or deployment action.

## Architecture And Diagnostics

- `split-or-justify`: no extraction. Each edit remains in its existing owner:
  canonical lifecycle authority, detailed Material policy, OpenSpec route,
  runtime-source diagnostics, or deterministic contract validation.
- Helper resolution extends the existing runtime-source owner and existing CLI;
  it adds no package, executable, target adapter, or parallel source resolver.
- Failed proof attempts and exact causes are in `history.md`; each preserved raw
  bundle has a terminal provider-free replay.
- No proof-owned process or listening proof server remains.

## Validation And Remaining Test-Only Work

- Green: `npm run validate`, instruction inventory/budget, strict selected
  OpenSpec, focused operation-gate tests `11/11`, focused completion-guard tests
  `35/35`, validation-script tests `3/3`, helper-resolution proof, candidate
  preflight `13/13`, baseline replays, and candidate runtime/evaluator lanes.
- Expected stale tests: focused contracts retain three old-policy assertions;
  broad library fixtures retain old permanent-stop/compaction markers. Additional
  roadmap-launcher fixture failures belong to unrelated concurrent work.
- Those are automated test artifacts and remain reserved for the fresh Material
  SDET. Production behavior is not being weakened to satisfy stale assertions.

## Subsequent Qualification Limitation

The later installed slash-command qualification lane found an upstream OpenCode
`1.18.18` `SessionPrompt.command` model-resolution defect before generation.
Loaded command templates equal canonical source and deterministic command tests
are green, but no newly generated disposable proposal was observed through the
installed operator entry point. This narrows the claim in this index: primary and
completion-guard MVP proof remains current; accepted-scope slash-command proof and
stable qualification do not.

Development-Stage: MVP
Stable Candidate: none
External Operations: not performed
