## Context

See `proposal.md` for motivation and the three capability deltas for normative behavior. The kit already has `simplicity-and-reuse` owned by `code-quality-reviewer`, a lazy `reuse-discovery` skill, and a compact always-loaded reuse paragraph. Those assets optimize for new mechanisms and after-the-fact reduction. They do not default an accepted new case of a live owner to reshape, and production roles can read "smallest happy path" plus "avoid unrelated refactors" as permission to add a sibling file.

The committed startup ceiling for `global/principles-of-work.md` plus `global/AGENTS.md` is 13,279 token proxy. New always-loaded words must replace the current reuse paragraph. The existing `tools/proofs/reuse-discovery.ts` owner already captures `local-owner` and `trivial-fix` through the installed OpenCode entry point. That is the proof owner to extend. Collapsing cloned proof harnesses into `tools/proofs/lib` is out of scope.

This increment changes loaded instruction routing, so it is Material. `EXT-001` owns the claim ceiling. Instruction-governance reviews the practice-surface edit; `simplicity-and-reuse` reviews its own trigger/body change in maintenance mode. Neither owner decides or mutates.

### Fidelity Ladder

`reviewed requirement deltas -> provider-free proof-runner/schema/budget preflight -> preserved baseline captures on the unchanged global source for local-owner, trivial-fix, and extend-existing-owner -> candidate instruction and role deltas that replace overlapping text -> provider-free candidate preflight and instruction-budget readback -> matched candidate captures -> provider-free evaluate/replay -> focused contracts and complete repository validation`.

The first real boundary is the installed OpenCode authoring path in disposable synthetic workspaces used by the current reuse-discovery proof runner. Baseline and candidate use the standing bounded synthetic provider-call envelope, non-sensitive prompts, isolated local roots, no external services, and deterministic cleanup. Evidence retains exact redacted invocations, source/model/profile/permission identity, raw events, assistant text, tool calls, fixture hashes, evaluator facts, and cleanup.

## Goals / Non-Goals

**Goals:**

- Make naming the current same-responsibility owner and defaulting to `extend` the always-loaded move.
- Define `extend` as reshape-the-owner, not add-a-sibling.
- Keep `reuse-discovery` lazy when the owner is already named; load it for a new mechanism, an explicit sibling, or same-versus-new uncertainty.
- Keep `code-quality-reviewer` as the only Practice Owner and silent on zero-trigger work.
- Stop production roles from classifying current-owner reshape as unrelated refactor.
- Prove the new default with one added scenario on the existing proof owner without growing startup budget.

**Non-Goals:**

- A new practice, agent, or proof runner.
- Reviewer launch on every feature, written dispositions for glue, or always-extract.
- Merging architecture and reuse, or changing `architecture-and-change-locality` triggers.
- Absorbing `tools/proofs` clones into `lib/`.
- Raising token-proxy maxima or editing unrelated instruction surfaces.

## Decisions

### Decision 1: Main applies; the existing owner only challenges sibling or uncertainty

Main names the current owner or `no-current-owner` and selects `reuse | extend | build-minimal`. `code-quality-reviewer` stays the `simplicity-and-reuse` owner. It launches only when the author is about to add a second implementation of a live owner, or when same-versus-new responsibility is decision-changing and uncertain. It remains read-only and non-authorizing.

Alternative rejected: a new Practice Owner or production agent. That violates one-owner-per-practice and adds ceremony. Alternative rejected: launch the reviewer on every feature. That would make Ordinary Small pay for a practice it already has an always-loaded default for.

### Decision 2: Known-owner extend does not load the skill

If local evidence already names the current same-responsibility owner, always-loaded authority selects `extend` and does not load `reuse-discovery` solely for compliance. The skill still owns search order, cross-project gates, and the `extend` reshape definition when a trigger matches.

Alternative rejected: load the skill on every new function. That recreates the ceremony the current trivial-fix control exists to prevent. Alternative rejected: put the full reshape protocol only in the skill. Main would keep writing siblings because the skill would stay unloaded.

### Decision 3: Replace the always-loaded reuse paragraph; do not append

Rewrite the existing Outcome-first simplicity / reuse-discovery paragraph in `global/AGENTS.md` so it includes name-current-owner, default `extend`, lazy skill trigger, and the compact disposition. Keep `principles-of-work.md` unchanged unless a removed marker would break an existing exact contract; AHA, YAGNI, and Rule of Three already forbid the opposite extreme.

Pay for any added words by deleting overlap in that same paragraph. Combined startup token proxy must stay at or below 13,279. Role files get only deltas: `implementation-worker` reshape-versus-unrelated-refactor; `code-quality-reviewer` and the compact Practice Owner roster get the sibling/uncertainty launch-when text.

Alternative rejected: add a new always-loaded bullet. The ceiling is already the binding constraint. Alternative rejected: change the philosophy file to restate extend. That would duplicate policy and spend the most expensive budget.

### Decision 4: Keep architecture and reuse mutually exclusive

Same-responsibility new case → `extend`. New responsibility, mixed file, or named change axis → `architecture-and-change-locality`. Do not launch both for the same primary question. Do not force `extend` onto a mixed owner.

Alternative rejected: merge the practices. They answer different questions and already exclude each other. Alternative rejected: tell architecture to prefer sibling extract whenever a file is busy. That is the failure mode this change exists to stop when the responsibility is the same.

### Decision 5: Extend the existing reuse-discovery proof owner

Add one `extend-existing-owner` fixture and prompt to `tools/proofs/reuse-discovery.ts`. Keep preflight, capture, evaluate, permissions, cleanup, and evidence schema on that owner. Scenario prompts, fixture files, and evaluator facts stay data or narrow helpers, not a second runner.

Before editing the runner, map its responsibilities. The accepted `split-or-justify` is to keep one capture/evaluate owner because the new scenario uses the same installed actor, permission set, evidence schema, and cleanup. If inspection shows the file cannot absorb another scenario without a new responsibility, extract only scenario-data and keep capture/evaluate intact.

This is `extend` of the current proof owner. Cross-project discovery is `not-applicable`. Do not collapse other proof files into `lib/` here.

Alternative rejected: a new proof CLI. That would be the sibling this change forbids. Alternative rejected: reuse `agent-tooling-ergonomics` or consumer-outcome. Those owners have different permissions, turns, and oracles.

Evaluator facts for the new scenario: source unchanged, disposition contains `extend`, named current owner appears, no sibling-module proposal, and reuse-discovery skill load is not required. Keep existing facts for `local-owner` and `trivial-fix`.

### Decision 6: Structural markers stay non-semantic

Add or replace exact markers for name-current-owner / default-`extend`, reshape-versus-unrelated-refactor, and sibling/uncertainty owner routing. Validators MUST NOT infer whether a responsibility is the same, score reuse quality, or rank `extend` versus `build-minimal`.

### Decision 7: Claim and process controls stay narrow

`EXT-001` is the only claim. Three synthetic scenarios plus deterministic budget/marker checks. No universal reuse claim. No SDET unless a reachable named critical consequence appears; none is in the accepted envelope. Attempt limits and the stop line are revisable process controls. Protected actions remain unauthorized: no install, activation, commit, push, release, or remote mutation.

## Risks / Trade-offs

- **[Risk] Main calls every new function a new responsibility** → keep the always-loaded "name the current owner or `no-current-owner`" step; prove the extend scenario against a fixture whose owner is obvious.
- **[Risk] Main forces unrelated behavior into a live owner** → keep the architecture exclusion and the `no-current-owner` / new-responsibility path to `build-minimal`.
- **[Risk] Owner trigger wording becomes "any new file"** → use the exact sibling and uncertainty phrases; keep the punctuation-fix negative control.
- **[Risk] Replacing the AGENTS paragraph drops a protected reuse or safety marker** → targeted readback of existing markers before capture; budget and contract fixtures fail closed on missing markers.
- **[Risk] Extending the proof runner worsens ownership** → map responsibilities first; extract only scenario data if cohesion fails.
- **[Risk] Baseline already says `extend` by chance** → require naming the current owner and forbidding a sibling module, not merely the word `extend`.

## Migration Plan

1. Materialize reviewed `ownership.json` and `evidence-index.json` for `EXT-001` with mutation disabled. Run the apply operation gate. Capture the unchanged-source baseline for all three reuse-discovery scenarios, including the new fixture on the current runner.
2. Replace the always-loaded reuse paragraph and add role/roster/skill deltas without a new agent or budget raise.
3. Update exact contract markers and the proof runner's scenario list, help text, and evaluator facts.
4. Run provider-free preflight and instruction-budget readback. Capture matched candidate scenarios. Replay/evaluate. Reject wording that adds siblings, loads the skill on the known-owner case, launches an owner on trivial-fix, or grows startup budget.
5. Run focused contracts, `validate:strict`, complete tests, and strict OpenSpec validation. Hand off `Outcome` with `EXT-001` still limited to the three scenarios.

Rollback removes only candidate-owned instruction, contract, fixture, and proof-runner edits. Baseline evidence stays immutable. Running sessions need a restart before they load changed instructions.

## Open Questions

None for this increment.
