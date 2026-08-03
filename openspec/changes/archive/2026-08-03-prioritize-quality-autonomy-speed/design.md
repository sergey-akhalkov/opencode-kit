## Context

The active global runtime is loaded directly from `D:/sa-gh/opencode-kit/global`. Quality and autonomy are already strongly represented in the runtime instructions, while speed guidance is distributed across automation, token-efficiency, parallelism, and anti-polishing sections. The current instruction inventory is 53 artifacts, 4,205 lines, and a token proxy of 84,513; `global/AGENTS.md` contributes 13,279. Adding repeated priority prose would therefore work against the requested speed outcome.

The committed `global/opencode.json.template` and active gitignored `global/opencode.json` intentionally use `permission: "allow"`, but README still describes the template as `ask`. Repository validation reports the active machine-local file as informational and the committed template as a warning, so `npm run validate:strict` is currently red. The owner selected global `allow` while retaining the repo-root workspace config's separate `ask` policy.

The completed but active `add-lightweight-sdet-pr-ready-sdlc` change contained superseded lifecycle wording. It was archived without syncing its stale delta specs before this change. The unchecked `integrate-continuous-sdlc-learning` change will later capture a runtime instruction baseline; this change must complete before that capture.

## Goals / Non-Goals

**Goals:**

- Make the priority order unambiguous: quality and safety, then autonomy, then speed.
- Define speed through observable delivery outcomes without adding routine telemetry or ceremony to every task.
- Keep one complete runtime authority and use concise pointers or role-specific deltas elsewhere.
- Preserve blocker-only questions, safe reversible defaults, real-boundary proof, and the non-critical stop line.
- Align intentional global `allow` documentation, specs, and exact-path validator severity while keeping unrelated broad permission configs visible as warnings.
- Preserve or reduce current instruction context cost.

**Non-Goals:**

- Rewriting every skill or agent with the same priority block.
- Adding a fourth peer priority, a workflow engine, automatic self-editing, hidden scoring, per-task timing reports, or a new telemetry system.
- Weakening protected boundaries, proof, validation, dirty-worktree preservation, or external-operation authorization.
- Changing the repo-root workspace permission from `ask`, active provider/model routes, deployment state, installation, or the current OpenCode process.
- Implementing the broader continuous-learning adapter or its future runtime budget helper.

## Decisions

### 1. One ordered contract, not three independent slogans

`global/AGENTS.md` will contain the only complete normative priority block near the top-level routing. Quality includes accepted-outcome correctness, safety, empirical proof, and validation. Autonomy means end-to-end progress on evidence and safe reversible defaults with owner questions only for protected decisions or unavailable capability. Speed means time to a verified result, fewer owner interruptions, fewer tokens/tool calls/manual repetitions, and more safe parallelism and deterministic automation.

Alternative rejected: treat all three as equal. Equal priorities do not resolve the exact trade-offs the owner asked to make deterministic.

### 2. Existing speed sections are consolidated to pay for the new contract

The separate automation, deterministic-helper, and token-efficiency guidance in `global/AGENTS.md` will be consolidated into the priority block. The old `caution over speed` wording will be replaced with a prohibition on unverified speed, skipped proof, and ceremony without decision value. Mirrors will receive a pointer or role-specific delta, never a copied full block.

Alternative rejected: append a new section while retaining all old sections. That would increase always-loaded cost and create future override drift.

### 3. Static validation is a drift tripwire, not semantic proof

Required markers and duplicate-block labels will live in `tools/contracts/skills.ts` and be consumed by `tools/validators/routing.ts`. The validator will require operative, non-fenced canonical markers in `global/AGENTS.md` and reject a copied complete block on enumerated runtime/maintenance surfaces. Semantic direction remains the responsibility of runtime proof and independent instruction review.

The doctor active-authority contract will not require these convenience markers from unrelated structurally compatible global configs.

### 4. Global permission allow is intentional but narrowly classified

`global/opencode.json.template` and exact root-relative `global/opencode.json` will receive informational broad-permission diagnostics. Broad allow in repo-root, nested, near-miss, or other config paths remains a warning and fails strict validation. README and canonical config specs will call the global template autonomy-first, explicitly state that instructions are not an OS sandbox, and retain the repo-root workspace `ask` policy.

Alternative rejected: changing the global template or active config to `ask`; the owner explicitly selected `allow` for global operation.

### 5. Continuous learning remains a mechanism under the three priorities

The continuous-learning change will record an explicit dependency on this change before its baseline task. Its later return-loop metrics and instruction-budget automation serve quality, autonomy, and speed; they do not become a fourth lifecycle stage or peer priority.

### 6. Material proof follows evidence-role separation

- Product Candidate: runtime instructions, maintained pointers, config-policy documentation/specs, and production contracts/validators.
- Proof Runner: repository validation CLIs plus one fresh OpenCode run in a disposable local workspace.
- Evaluator: deterministic marker/config outcomes, fresh test-only SDET, and a fresh instruction-artifact reviewer.
- Environment Identity: current Git candidate, Node 24+, OpenCode 1.18.11, explicit model, and active `OPENCODE_CONFIG_DIR`.
- Raw Evidence Bundle: exact commands, exit status, stdout/stderr, runtime event output, observed side effects, and instruction inventory before/after.

Production changes and real-boundary proof precede fresh SDET test authorship. A production mutation after proof invalidates the affected proof. Report-only or evaluator-only changes replay only their derived checks.

## Risks / Trade-offs

- **[Risk] Static tokens reward wording rather than behavior.** Mitigation: treat them as drift tripwires and require a fresh runtime scenario plus semantic instruction review.
- **[Risk] Global `allow` relies heavily on instruction compliance.** Mitigation: document this honestly, preserve protected-boundary rules, and keep broad allow warnings for every unrelated config path.
- **[Risk] Priority prose increases context cost.** Mitigation: consolidate existing sections and require no growth in `global/AGENTS.md` or the current complete instruction inventory.
- **[Risk] Speed metrics become reporting overhead.** Mitigation: define optimization targets but require explicit measurement only for audits, benchmarks, or diagnosed regressions.
- **[Risk] Concurrent continuous-learning work captures the wrong baseline.** Mitigation: record a hard ordering dependency before its baseline task and keep writers serial across overlapping runtime files.
- **[Risk] A fresh cloud-model runtime proof is billable.** Mitigation: request one bounded authorization at the proof checkpoint unless a non-billable conforming local model is available.

## Migration Plan

1. Record current inventory and validation baselines.
2. Update the canonical priority block, pointers, config docs/specs, and production validators without test mutation.
3. Prove the permission CLI branch and one fresh instruction happy path.
4. Let fresh SDET add only the smallest regression fixtures, then run full validation and independent instruction review.
5. Restart OpenCode after handoff to activate changed config-time instructions for ordinary future sessions.

Rollback restores only this change's exact modified paths from their recorded preimages, reruns validation, and restarts OpenCode only if runtime instruction activation must be reversed. It never uses a broad workspace reset and never restores the separately archived historical change to active status.

## Open Questions

None. Priority order, question policy, non-critical stop line, global permission default, and historical-change archive disposition were resolved by the owner before implementation.
