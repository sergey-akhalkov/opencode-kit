## Context

See `proposal.md` for motivation. The current canonical authority already says not to ask while safe local work remains, changes strategy after materially similar no-progress attempts, and requires a self-contained owner handoff. The existing `troubleshooter` is a diagnosis-only escalation role with the necessary read, research, and bounded diagnostic capabilities, but its trigger and case-file contract place it after ordinary paths fail without connecting it to the moment immediately before a user question.

The opt-in session completion guard separately requires troubleshooting after a repeated continuation strategy, while direct grind-off sessions rely only on prose authority. Any change must therefore improve the always-loaded path without turning an optional runtime guard or specialist availability into a lifecycle dependency.

Current fidelity rung: direct-source review of canonical instructions, role contracts, mirrors, specifications, validators, and guard routing. The next real boundary is a disposable OpenCode process that loads candidate instructions and executes fixed same-model blocker scenarios through the actual main, task, and question paths.

Authorization and safety: bounded non-sensitive configured-provider calls are authorized for kit validation. Candidate scenarios must deny credentials, external directories, remote state, destructive commands, installation, publication, and protected effects. Disposable projects and sessions are removed after capture; immutable redacted evidence bundles remain.

## Goals / Non-Goals

**Goals:**

- Make the first blocker-related owner question pass one explicit, bounded recovery filter.
- Preserve exact owner boundaries while defaulting uncertain classifications to further safe diagnosis rather than user interruption.
- Reuse the current `troubleshooter` as an independent diagnosis-only consultant and keep main responsible for corrections and proof.
- Qualify semantic behavior through the actual loaded OpenCode entry point, not marker presence alone.
- Keep complete policy in one canonical runtime artifact and pay for any added always-loaded text by removing superseded overlap.

**Non-Goals:**

- General autonomous answering of user decisions or protected actions.
- Unlimited retries, broad brainstorming, architecture redesign, or speculative tooling added only to appear thorough.
- Production or automated-test authorship by `troubleshooter`.
- A new skill, plugin, lifecycle stage, mandatory reviewer, or general blocker-classification helper.
- Completion-guard source mutation without a reproduced distinct-chain bypass.

## Decisions

### 1. Extend the existing autonomy and handoff contract instead of adding a new process

The canonical rule will be placed adjacent to the existing Autonomous Work Contract and Self-Contained Owner Handoff in `global/AGENTS.md`. It will replace or consolidate overlapping wording so the complete policy has one retrieval location and does not create a fourth recovery mechanism beside stagnation, owner handoff, and completion-guard continuation.

Alternative considered: add a standalone `Pre-Escalation Gate` section. Rejected because it duplicates existing attempt-control and owner-handoff authority, increases always-loaded context, and creates ambiguous ordering.

### 2. Use a hybrid filter rather than invoking a specialist for every blocker

Immediately before the first blocker question, main uses three outcomes:

1. A safe causally distinct local mechanism remains: execute it.
2. An exact owner action is proven and no safe substitute exists: issue the existing self-contained owner handoff without specialist delay.
3. The blocker is technical or uncertain and no unused local mechanism remains: invoke one bounded diagnosis-only consultation.

Owner-only is fail-closed: it requires the exact protected action and evidence that no safe local substitute can advance the affected chain. Unknown cause is not owner-only evidence.

Alternative considered: mandatory `troubleshooter` for every blocker. Rejected because credentials, UAC, cost, deployment, destructive action, and protected product decisions cannot be delegated or diagnosed away; the serial call would add latency while weakening authority clarity.

### 3. Bound recovery by failure chain and decision-changing evidence

A failure chain is the current accepted requirement, causal mechanism, observed blocker, and preserved evidence. One equivalent consultation is permitted per chain. A later consultation requires new evidence that can change the decision, a causally distinct mechanism, or a different requirement/blocker chain.

The bounded stop line is not an immutable owner decision. Main may revise process controls when new evidence changes the causal route without changing accepted semantics or crossing a protected boundary.

Alternative considered: a fixed number of total attempts. Rejected because attempt count does not distinguish repeated noise from a new falsifiable mechanism and can stop too early or loop too long.

### 4. Keep troubleshooter diagnosis-only and make its output decision-ready for main

The role receives a complete case file and returns one selected goal-preserving route, missing decision-changing evidence, rejected realistic alternatives, owner routing, and exact validation. It may perform safe diagnosis and allowed instrumentation but cannot author production or test corrections, ask the user, dispatch agents, or claim lifecycle completion.

Main verifies the report, applies any authorized production correction itself or through the already valid production-author route, reacquires invalidated proof, and suppresses the question if progress resumes.

Alternative considered: allow `troubleshooter` to implement its recommendation. Rejected because it would mix diagnosis, production authorship, and test ownership and conflict with existing correction continuity and proof rules.

### 5. Do not add a new skill

The always-loaded filter is short policy, while independent diagnosis needs a fresh child context. A skill would add routing and context but would not provide independence. Existing `root-cause-analysis` remains available for tasks that specifically need causal records but is not a mandatory pre-question stage.

Alternative considered: a `blocker-recovery` skill. Rejected as duplicate behavior and a weaker independence boundary.

### 6. Keep mirrors concise and validation layered

`global/AGENTS.md` owns the full rule. `global/agents/troubleshooter.md` owns role-specific preconditions and output. Project templates and reusable instructions carry only a pointer or one-line delta; README carries routing/catalog text.

Deterministic contracts protect exact markers and permission boundaries. They are followed by same-model behavioral comparison in a disposable loaded environment. A focused proof runner may reuse existing process, profile, event-capture, redaction, and cleanup primitives, but existing specialized proof runners will not acquire this unrelated responsibility.

Alternative considered: copy the full flow into every command and template. Rejected because it increases context, drift, and contradictory trigger risk.

### 7. Treat completion-guard runtime changes as evidence-triggered scope

The current guard correctly bypasses troubleshooting for `owner_required` and requests it after a repeated technical continuation. Its completed-agent check is coarse and may skip a later distinct chain, but that is a residual hypothesis rather than a reproduced current defect.

The behavior proof reproduced the bypass: a completed troubleshooter from another chain caused a later distinct repeated-technical continuation to omit the required consultation. The continuation therefore carries the computed failure-chain fingerprint and instructs main to echo an exact `Failure Chain: <fingerprint>` line in the task case file. Runtime inspection records only that bounded marker, and a completed child suppresses another consultation only on exact current-chain match. Missing or foreign markers fail closed and require the current-chain route.

Alternative considered: immediately key guard detection by failure-chain fingerprint. Rejected because it would expand runtime state and correlation semantics without current failure evidence.

## Fidelity And Evidence Plan

1. **R0 - Source review**: current direct-source evidence establishes the authority split and missing pre-question route.
2. **R1 - Structural candidate**: OpenSpec strict validation, instruction contracts, permission validation, inventory, and budget checks establish coherent artifacts but not model behavior.
3. **R2 - Disposable loaded baseline/candidate**: identical synthetic scenarios, model, variant, permissions, and environment capture task/question calls, assistant output, command evidence, source hashes, cleanup, and verdicts.
4. **R3 - Installed fresh session**: after candidate R2 passes, install or activate the proven kit source, start a fresh session because config-time artifacts do not hot-reload, and replay representative owner-only and recoverable technical scenarios through the intended operator entry point.

The earliest safely reachable real boundary is R2. There is no owner blocker: standing authorization permits bounded non-sensitive model calls and local activation. Safeguards are disposable roots, no credentials or protected effects, explicit source/model identity, and deterministic cleanup. R3 is blocked until R2 is green; R2 evidence is the unblocker. Raw bundles are immutable; evaluator-only changes replay preserved bundles without new model calls.

## Risks / Trade-offs

- [Broad technical-or-uncertain classification invokes the specialist too often] -> Require no unused distinct local mechanism, one consultation per chain, and behavior scenarios covering first-failure and owner-only skips.
- [Owner-only classification becomes an escape hatch for premature questions] -> Require the exact protected action, no safe substitute, and a self-contained evidence statement; uncertain cases route to recovery.
- [Troubleshooter advice is treated as mutation authority] -> Preserve diagnosis-only text and permissions, require main verification, and test that the child does not author production or test artifacts.
- [Instruction growth worsens context cost] -> Consolidate existing overlapping sentences, keep mirrors pointer-only, and enforce before/after instruction budget evidence.
- [Static tests overclaim semantic success] -> Label markers as drift tripwires and require same-model loaded behavior before retention.
- [The specialist is unavailable in a target installation] -> Main performs the bounded pass itself and records the capability gap; absence alone does not block a lifecycle stage.
- [A prior completed troubleshooter child hides a later distinct guard chain] -> Exercise the hypothesis in grind-on proof; mutate guard correlation only after reproduction.
- [Provider/model variation changes adherence] -> Preserve exact effective model and bound claims to the captured candidate; do not claim universal compliance.

## Migration Plan

1. Update repository source, contracts, mirrors, specs, proof inventory, and focused tests without activating the candidate globally.
2. Run deterministic validation and capture the instruction inventory/budget baseline and candidate evidence.
3. Run disposable same-model baseline/candidate scenarios through the actual loader and replay the evaluator from preserved bundles.
4. If candidate behavior preserves owner boundaries and improves technical recovery, install the proven global source and restart OpenCode.
5. Replay representative scenarios in a fresh installed session and verify runtime source identity.
6. If installed proof fails, restore the previous installed source from the reproducible installer/input identity and keep the repository candidate at `development` with evidence preserved.
