# Task 1.1 Ownership And Source Baseline

- Result: `complete`
- Candidate: `grind-task-scoped-ownership-r1`
- Environment: Windows, Node `v24.18.1`, OpenCode `1.18.25`, provider-free source inspection
- Recorded: `2026-08-29T20:21:07.3436535+03:00`
- Effects: OpenSpec ownership, history, task, and evidence records only; no production, instruction, managed-config, install, activation, restart, provider, network, project-runtime, or remote effect
- External operations: none

## Evidence Identities

- Baseline: `current-global-verdict-owner-required-and-process-handoff`.
- Candidate: `grind-task-scoped-ownership-r1`.
- Proof boundary: `provider-free-ownership-source-inspection-r1`.
- Evaluator: `openspec-change-inventory` at `tools/openspec-change-inventory.ts` blob `a4a9848b57ca0a7ab1cc7d038e0466c9ed326310`, inventory owner blob `674ca96ee701d9f9f8811bf195bc40c9a706bb2c`, ownership owner blob `e066d26f0dd7d05b35f0205407b591d9123e04c3`, and evidence-schema owner blob `be6e0d467714e2cac6e28b158d436906ceb07824`.
- Environment: `windows-node-24.18.1-opencode-1.18.25-ownership-r1`.

## Decision

- Reuse disposition: `extend`.
- Current lifecycle owner: `global/extensions/session-completion-guard.ts` and `global/extensions/session-completion-guard/**`.
- Durable mission and campaign owners remain `global/bin/roadmap-mission/**` and `global/bin/work-campaign/**`; grind may extend their projections and scheduling but must not add a second scheduler or replace either ledger.
- Semantic product, dependency, and authorization classification remains model-owned through the completion arbiter. Deterministic code may validate explicit schema fields and derive runnable dependency sets; it must not score or infer semantic ownership.
- No-current-owner seams are limited to the plugin-owned `grind_frontier` tool, bounded `workFrontier` metadata, verdict-v2 question deferral, new guard reconciliation states, projection adapters, and one reviewed frontier fixture family. Each seam extends an existing owner rather than creating an independent runner.

## Serial Ownership

- The owner selected serial grind-first execution before Kaizen task 2.1 resumes.
- `add-cross-project-kaizen-loop` is paused with `mutationEnabled=false` and has an `archive-before-acquire` dependency on this change for `global/AGENTS.md`, `global/opencode.json.template`, `package.json`, and `tools/proofs/README.md`.
- Grind transfers those shared roots back to Kaizen only after grind is archived.
- Existing dirty Kaizen files remain intentional. Task 1.1 does not modify production, instruction, profile, proof-runner, package, or Kaizen implementation content.
- The selected first fixture/proof slice is exact non-overlap: the completion-guard fixture family, a completion-guard frontier proof CLI, focused completion-guard tests, and the package script. `tools/proofs/README.md` remains deferred until the maintained runner exists.

## Worktree Disposition

- Kaizen-owned dirty paths are preserved: `README.md`, `docs/feedbacks/README.md`, `global/plugin/project-memory/store.ts`, `global/plugin/session-env.ts`, `global/skills/complain/**`, `global/skills/openspec-archive-change/**`, `profiles/core.json`, `profiles/all.json`, `tools/contracts/complain.ts`, `tools/proofs/README.md`, `tools/runtime-surface-profile.ts`, `tools/test-consumer-outcome.ts`, `tools/test-contracts-change-ready-delivery.ts`, `tools/test-library/runtime-surface-profiles.ts`, `tools/validators/devkit-contract.ts`, and Kaizen-specific untracked docs, commands, plugin, fixtures, proofs, and evidence.
- Pre-existing consumer-outcome and delivery-trajectory paths remain unrelated work and are not adopted by grind.
- `global/AGENTS.md`, `global/opencode.json.template`, and `package.json` were clean at the baseline identity. They are serially assigned to grind but remain unmodified by task 1.1.
- `tools/proofs/README.md` is both Kaizen-dirty and serially assigned to grind. Grind must preserve its current content and defer any minimal inventory edit until the frontier proof runner exists.
- No staged or conflicted path was introduced by this inspection.

## Existing Owners

| Responsibility | Existing owner | Disposition |
| --- | --- | --- |
| Plugin composition and guard lifecycle | `global/extensions/session-completion-guard.ts`; `SessionCompletionController.start` in `global/extensions/session-completion-guard/controller.ts` | Extend the completion-guard plugin with `tool.grind_frontier`; do not add the tool to Kaizen-dirty `global/plugin/session-env.ts`. |
| Root metadata and restart | `GuardStatusReporter.persist` / `persistConverged` in `status.ts`; `initialRootState` in `runtime-support.ts` | Extend schema-v1 metadata with bounded frontier state and conservative restoration. |
| Frontier correlation | `inspectRootEvidence` in `inspection.ts` | Reuse `humanRef` and `todoDigest`; do not use full `revisionDigest` because it includes assistant churn. |
| Arbiter evidence | `arbiter-evidence.ts`; `global/plugin/session-delivery-context/projection.ts` | Extend normalized completion evidence without moving tool registration. |
| Verdict validation | `CompletionVerdict` in `types.ts`; `parseCompletionVerdict` in `verdict.ts` | Extend the sole deterministic parser to schema version 2. |
| Verdict application and cycle handling | `applyVerdict`, `injectOwnerRequired`, and `injectCycleBudgetHandoff` in `controller.ts` | Replace global process handoff with scoped frontier transitions and bounded epoch rollover. |
| Pending question lifecycle | `applyQuestionVerdict`, `onQuestionAsked`, `onQuestionReplied` in `controller.ts`; `validateQuestionAnswers` in `question.ts` | Reuse reply for `answer`; add official `client.question.reject` for `defer`; preserve reply/reject exclusivity. |
| Loaded main and arbiter contracts | `global/AGENTS.md`; `global/agents/session-completion-arbiter.md`; `tools/validators/agents.ts` | Extend together only in task 3.1. |
| Roadmap mission | `global/bin/roadmap-mission/contracts.ts`, `controller.ts`, `session-executor.ts` | Extend dependency-valid sibling scheduling and result projection; retain the mission ledger. |
| Campaign | `global/bin/work-campaign/contracts.ts`, `controller.ts` | Extend wave/result projection only; retain the campaign ledger and do not add a dependency graph. |
| Focused proof family | `tools/test-session-completion-guard.ts`; maintained guard, roadmap, campaign, and pre-escalation proof CLIs | Extend; add one reviewed `grind-frontier-v1` seed family beside the existing guard proof owner. |

## Current Source Facts

- `verdict.ts` accepts schema-v1 verdict values `allow_stop`, `continue`, `owner_required`, and `user_paused`.
- `controller.ts` routes `owner_required` to a root pause and routes finite `maxCycles` exhaustion through `injectCycleBudgetHandoff`, which synthesizes an owner handoff.
- The guard's autonomous question path calls `question.reply`; `question.reject` is asserted as a client capability but is not used by the guard.
- `inspection.ts` already exposes `humanRef` and `todoDigest`. Its broader `revisionDigest` also incorporates assistant identity and therefore is not a legal frontier-correlation key.
- `runtime-support.ts` defaults `maxCycles` to `100`; `global/opencode.json.template` also keeps the finite bound at `100`.
- Session-delivery projection has no frontier field; roadmap and campaign result contracts still expose global `owner-required` state.
- Roadmap missions already own explicit slice dependencies. Campaign items use durable waves and do not own a second dependency graph.

## Source Identity

Ordered `git hash-object` identities captured before grind production mutation:

| Path | Git blob |
| --- | --- |
| `global/extensions/session-completion-guard.ts` | `773f00ef9dffd60d18c219d1ba2dd3ac703bc683` |
| `global/extensions/session-completion-guard/controller.ts` | `6c10f648f673f6f06a75a27a2a6e8a90c6e397d8` |
| `global/extensions/session-completion-guard/types.ts` | `5ef28c07b6ff27fd7af1ad301a39804e05ad882b` |
| `global/extensions/session-completion-guard/verdict.ts` | `5eeb94b6035806a7ed6cc3a2739098f3aecd6cd3` |
| `global/extensions/session-completion-guard/question.ts` | `a296b2eb8592f0bd280cac4fe722cda8a2330ab4` |
| `global/extensions/session-completion-guard/status.ts` | `349ddc7a37e46827dec3bc56eaca76b8ac567c21` |
| `global/extensions/session-completion-guard/runtime-support.ts` | `af49bf51de367eb2c0035654982abee873f87e1b` |
| `global/extensions/session-completion-guard/inspection.ts` | `5d521ec1db0b1ecea4f2bf16f6b7c73124024035` |
| `global/extensions/session-completion-guard/arbiter-evidence.ts` | `9de53f0f4450353e61f3bf99e3de6c22d97339b4` |
| `global/plugin/session-delivery-context/projection.ts` | `a3660c0eae7b0dd624cc5f8a358d82ca1080025e` |
| `global/agents/session-completion-arbiter.md` | `839f66aefe972ee133d98941bb430fce6aff4a08` |
| `global/AGENTS.md` | `35e0ad29f8b3d396ecdbb027a9b2d36ded1b804e` |
| `global/opencode.json.template` | `716e0415fa0c409cf0173f68770567179827a135` |
| `global/bin/roadmap-mission/contracts.ts` | `78674f6196b291b96db712d775c5ff8d999e8f01` |
| `global/bin/roadmap-mission/controller.ts` | `c775bd647f6f0ffcdd19e6db1c6a476fe6001267` |
| `global/bin/roadmap-mission/session-executor.ts` | `da4a2b42d36e685d00b18310d10a91f3c5dc41b5` |
| `global/bin/work-campaign/contracts.ts` | `369fedb3c4ccbb4183e01a4ef9a30d2731bab415` |
| `global/bin/work-campaign/controller.ts` | `625426341e6fb6a67285160c9be6021735f631ee` |
| `tools/test-session-completion-guard.ts` | `a3cddf706e91022514c27b20d4cd4aecacd814ae` |
| `package.json` | `e139fb896bdfc6aadbd949847096565b2fd88924` |

## Specialist Topology

- Configured advisor capability `specialist-team-advisor` was not exposed by the current specialist adapter. Team-advice topology remains `unknown`; unavailable material capability: `specialist-team-advisor`.
- Read-only owner mapping used explorer task `ses_fb17cf69fffed9usEdZ6H33wHZ`. It supplied source navigation only and did not authorize decisions, mutate files, or provide readiness/lifecycle evidence.
- Reconsultation condition: the specialist catalog or adapter materially changes, or implementation reveals a new decision-material owner/topology boundary not resolved by the accepted design.

## Claim Ceiling

- `GRIND-TSB-001`: `unknown`, supported members `0/20`, real oracle `unknown`, independent challenge `missing`.
- This evidence supports only task 1.1 ownership, current-source identity, overlap serialization, and selection of the first provider-free fixture owner.
- It does not support frontier legality, verdict-v2 behavior, question deferral, bounded execution, roadmap/campaign scheduling, loaded instruction behavior, installed OpenCode behavior, any population member, critical SDET, independent claim challenge, archive, or activation.

## Stop Line

- Task 1.2 may create only reviewed provider-free frontier seeds, their maintained materializer/replay entrypoint, focused guard tests, and its package script.
- Stop before production or instruction mutation if the fixture reveals a protected product-policy decision, requires semantic inference in deterministic code, or cannot preserve current dirty Kaizen work.
- No pinned OpenCode, installation, activation, restart, official archive, provider call, credential, remote action, or mutation of gitignored `global/opencode.json` is authorized by this checkpoint.
