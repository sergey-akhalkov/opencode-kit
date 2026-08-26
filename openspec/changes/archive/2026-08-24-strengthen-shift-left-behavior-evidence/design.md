## Context

See `proposal.md` for motivation and the change-level `SLBE-001` claim boundary. The repository already has three relevant owners:

- exact shift-left wording and maintained-surface drift checks in `tools/contracts/skills.ts`, `tools/validators/routing.ts`, and `tools/test-contracts-change-ready.ts`;
- loaded instruction cadence in `global/AGENTS.md`, with detailed Material evidence rules in `global/skills/change-ready-sdlc/SKILL.md` and concise maintained mirrors;
- matched consumer behavior capture, focused decision packs, environment correlation, replay, privacy, and cleanup in `tools/proofs/consumer-outcome-regression.ts` and `tools/proofs/consumer-outcome/`.

The consumer-outcome runner currently supports the maintained general pack and one `claim-evidence` focused pack. Its focused-pack path already separates reviewed scenario data from deterministic parsing, capture, evaluation, and replay, but its pack selection and expected decision schema are currently specific to the claim-evidence fixture. The archived loaded-routing proof confirms broad philosophy and safety routing but does not directly exercise the two sequencing decisions in this change.

The current proposal workflow also permits a declared broad claim to leave its structured record absent during `propose`, while still instructing the agent to report `Ready for implementation` after only the propose gate and strict validation. The apply gate then fails on the already-known missing record. This is a sequencing defect in the canonical proposal instruction, not an owner decision or a reason to weaken the apply gate.

## Goals / Non-Goals

**Goals:**

- Reuse one existing matched capture/evaluator owner for a separate shift-left focused pack.
- Make the two accepted sequencing decisions observable through a checked artifact rather than model rationale or text markers.
- Reach the installed configured-model boundary after the smallest provider-free manifest/checker prerequisite, before any instruction correction.
- Preserve baseline/candidate comparability, exact claim limits, privacy-safe immutable evidence, and offline replay.
- Allow no instruction edit when current loaded behavior already passes; otherwise constrain correction to the smallest evidenced owner and mirrors.
- Make broad-claim proposal handoff prove the next effect-free apply gate and preserve incomplete evidence as an explicit development record.

**Non-Goals:**

- A new proof runner, generic plugin framework, fuzzy scoring, natural-language grading, or timing metric.
- Changes to the maintained general consumer scenarios, accepted baseline pointer, productivity/friction claim, or existing claim-evidence pack.
- Universal model or project coverage, proof that a generated plan will later execute, or a higher-rung safety claim.
- A new lifecycle stage, reviewer requirement, SDET trigger, dependency, public interface, install, activation, or remote effect.

## Fidelity And Proof Envelope

- **Current Rung**: Direct source and schema inspection of the canonical instructions, shift-left marker validator, current consumer-outcome focused-pack owner, archived loaded-routing evidence, and current specs. This proves the evidence gap and reuse owner, not model behavior for the new cases.
- **Smallest Prerequisite**: Provider-free manifest/checker implementation plus actual `--help`, `--preflight --pack shift-left`, deterministic malformed-pack and wrong-decision fixtures, and replay tests. No configured call occurs until these terminate with attributable cleanup and exact source identities.
- **First Real Boundary**: A fresh installed OpenCode primary loads the frozen baseline instruction source and produces one checked decision for each shift-left scenario in disposable repositories.
- **Next Real Boundary**: The same installed route, model, variant, prompt, permission envelope, fixture state, runner, and evaluator load the readable candidate source; provider-free replay compares both arms through the terminal verdict.
- **Authorization**: The machine's standing bounded synthetic configured-provider authorization covers the minimum four non-sensitive scenario-arm calls. It does not authorize credentials, target-project work, installation, activation, publication, deployment, release, remote mutation, or another protected effect.
- **Safeguards**: Fixed reviewed prompts and case files; one request per scenario and arm; proof-owned disposable roots; read/write and exact local checker commands only; deny external directories, questions, nested tasks, credentials, installs, remote tools, arbitrary commands, and protected effects; fail closed on identity, schema, observation, evidence-bound, or cleanup uncertainty.
- **Restoration / Cleanup**: Delete only attributable OpenCode sessions, processes, staged source, and disposable fixtures in `finally`; retain immutable privacy-safe evidence roots. Cleanup failure blocks the next arm.
- **Expected Evidence**: Baseline/candidate loaded-source digests, pack and prompt digests, runner/evaluator hashes, OpenCode/model/variant/profile/OS identity, exact bounded events and commands, checked decision artifacts, validation/proof exits and stdout/stderr, file/effect manifests, cleanup, replay digest, and maximum claim.
- **Dependency-Chain Stop Condition**: No instruction correction or candidate configured capture begins until provider-free preflight is green and a complete baseline capture qualifies Product Candidate, Proof Runner, Evaluator, Environment, observation path, and cleanup. An evidence-only configured failure blocks unchanged repetition until preserved replay reaches its terminal result or identifies the exact missing observation.

## Decisions

### Decision 1: Extend the consumer-outcome focused-pack owner

Add `shift-left` as an explicit reviewed pack selection in the existing consumer-outcome CLI and focused-pack contracts. Keep a small exact pack registry or equivalent mapping from supported pack id to versioned manifest and checked decision adapter; do not add dynamic discovery or a second executable.

This is an `extend` decision. The existing owner already provides source staging, installed configured capture, same-environment comparison, bounded evidence, cleanup, replay, and baseline isolation. A new runner would duplicate every costly and safety-sensitive mechanism. Adding the scenarios to the general pack was rejected because they test instruction decisions rather than consumer productivity. Adding them to `claim-evidence` was rejected because that pack has a different four-case claim and maximum scope.

### Decision 2: Put semantic seeds in reviewed fixtures and keep helpers deterministic

Create one versioned shift-left manifest, one contained generic fixture, two reviewed case records, and one local checker. Each configured arm reads exactly one case and writes a bounded decision artifact containing the case identity, current rung, selected sufficient boundary, first action, deferred dependent actions, protected-action disposition, and claim ceiling. The checker validates exact enum values, required ordering, deferral membership, and claim limits, then emits the stable summary consumed by the existing focused evaluator.

The two case records are:

1. `reachable-characterization-first`: a safe real observation is already reachable and its unknown result can invalidate parser, emulator, and orchestration work. The accepted first action is the characterization; dependent behavior stays deferred.
2. `sufficient-lower-rung`: an installed local boundary observes the full accepted effect while a higher protected end-to-end rung is available. The accepted action uses the local boundary, leaves the higher rung unexecuted, and narrows the claim accordingly.

This keeps semantic policy in reviewed data and exact specs. Helpers validate declared shapes and observations only; they do not rank prose, infer intent, or treat marker text as behavior evidence. A direct natural-language evaluator was rejected because it would create a second model judgment and a non-deterministic acceptance oracle.

### Decision 3: Capture baseline only after the provider-free runner is trustworthy

Implement and validate the runner extension first, then use that same runner/evaluator candidate to drive both source arms. The baseline arm stages and loads the explicit pre-correction instruction source; the candidate arm loads the readable working candidate. Thus the only permitted model-facing behavior difference is the governed loaded source identity, while proof-runner and evaluator semantics remain identical.

One sample per scenario and arm bounds the configured calls to four. This supports only the exact captured decisions and does not estimate model reliability or frequency. Increasing samples, adding models, or widening the population requires a separately reviewed claim and is outside this increment.

### Decision 4: Treat the checked plan as behavior evidence, not execution evidence

The real boundary is fresh installed OpenCode interpretation of the loaded instructions. The oracle proves which action the agent selects and records under the fixed scenario; it does not run the hypothetical real dependency or dependent implementation. The result therefore cannot claim that a later session will execute the plan, that the modeled dependency behaves as stated, or that a protected higher rung is safe.

The focused evaluator composes the checked decision with existing hard gates for source/environment equality, permissions, forbidden effects, validation, evidence bounds, and cleanup. Passing text markers or a fluent explanation cannot offset a wrong decision artifact.

### Decision 5: Separate Product Candidate, runner, evaluator, and environment failures

- **Product Candidate**: The governed loaded instruction source relevant to shift-left decisions; only an evidenced semantic defect authorizes correction.
- **Proof Runner**: The consumer-outcome CLI, focused-pack selection, source staging, installed capture, fixture materialization, command observation, redaction, and cleanup.
- **Evaluator**: Manifest/checker schema validation, hard-gate composition, decision comparison, replay, and maximum-claim output.
- **Environment Identity**: OpenCode, Node/Bun, OS class, selected model/variant/profile, active config source, permission envelope, fixture and prompt digest, source manifests, runner, and evaluator.
- **Raw Evidence Bundle**: Immutable bounded baseline/candidate events, artifacts, commands, effects, diagnostics, cleanup facts, hashes, and replay inputs.

An evaluator-only defect replays preserved bundles. A runner or environment defect invalidates only captures that depend on it. A negative or absent model observation does not establish an instruction defect until the source identity, observation path, expected phenomenon, and a safe positive control are qualified.

### Decision 6: Make instruction correction evidence-contingent and local

If both source arms pass and no relevant instruction bytes differ, retain current instruction wording and close the gap through the maintained pack and evidence. If the qualified frozen baseline fails a decision, correct the smallest complete canonical owner, then synchronize only surfaces required by the maintained marker/mirror contract and recapture the candidate.

Do not edit `principles-of-work.md`: its `Fast Feedback`, real-signal, scientific-method, Gall's Law, and fail-fast semantics already own the philosophy. Do not add another principle or duplicate the detailed Material proof ladder into compact mirrors. Any correction must preserve safety precedence, separate owner authority, conditional qualification/SDET routing, and the existing instruction budget.

### Decision 7: Close broad-claim readiness in the proposal owner

Update the canonical `openspec-propose` skill and maintained `opsx-propose` command so a declared broad class materializes one schema-version-2 development claim record before readiness checks. The record copies only reviewed proposal fields and records absent observations, real-oracle state, and independent challenge as `unknown` or `missing`; it never fabricates task evidence, lane files, or supported closure.

After the existing propose gate and strict selected-change validation pass, run the same portable operation gate with `--operation apply`. This invocation is read-only and directly proves the handoff contract being claimed. A non-zero result keeps the change at planning-ready-but-not-implementation-ready and is corrected locally when it names an agent-owned artifact gap. Adding another validator or weakening the apply gate was rejected because the existing gate already detects the exact condition.

## Failure Boundaries And Diagnostics

- **Manifest / fixture**: Report the exact pack, scenario, field, containment, or digest error before session creation; do not infer or repair semantic data.
- **Source staging / loader**: Preserve baseline or candidate source identity, active config source, OpenCode command, exit, stdout/stderr, and original cause; an unverified source is not model evidence.
- **Configured capture**: Preserve scenario/arm/sample, model route, bounded event facts, tool/command observations, decision artifact, timeout, and cleanup. Do not log private prompts, provider options, credentials, absolute home paths, or unrelated sessions.
- **Checker / evaluator**: Report the exact wrong or missing decision field and preserve the original artifact. Never rewrite raw evidence or re-drive configured inference for an evaluator-only correction.
- **Cleanup**: Treat unknown session, process, fixture, or staged-source liveness as terminal for the lane; do not start another arm through unisolated ownership.
- **Proposal readiness**: Preserve the exact propose/apply gate command and failed check. A broad development record may remain claim-closure `unknown`, but a missing or malformed record blocks the readiness handoff and must not be presented as user action.

## Risks / Trade-offs

- **A model can satisfy the fixture without generalizing** -> Limit `SLBE-001` to the two fixed cases and retain the unresolved generalization statement.
- **One sample can fail nondeterministically** -> Preserve the full arm and diagnose Product Candidate versus runner/evaluator/environment before any causally distinct recapture; do not convert one sample into a reliability claim.
- **A richer focused decision schema can complicate the current claim-evidence parser** -> Reuse common manifest/capture types, add one exact checked-decision adapter, and keep both pack ids explicitly tested instead of building a generic plugin system.
- **Current instructions may already pass** -> Treat that as useful evidence closure; do not manufacture wording changes merely to create a candidate diff.
- **A correction can affect unrelated routing** -> Keep correction local, rerun the existing matched routing/safety contracts and instruction budget, and reject any weaker protected-boundary behavior.
- **Plan evidence may be mistaken for runtime execution** -> Encode and report the maximum claim in the manifest, evaluator result, proof inventory, and handoff.

## Migration Plan

1. Add the reviewed pack, fixture, deterministic checker, pack selection, and provider-free negative/replay tests without changing loaded instructions.
2. Update the proposal skill/command readiness contract and focused test so broad-claim handoff materializes a development record and proves the apply gate before reporting ready.
3. Run actual CLI help and preflight plus focused validation; preserve runner/evaluator/source identities and cleanup.
4. Capture the two frozen baseline instruction scenarios through fresh installed OpenCode before any instruction correction.
5. If and only if the qualified baseline proves a semantic defect, correct the smallest canonical instruction owner and required mirrors, then rerun affected structural and loaded-routing checks.
6. Capture the readable candidate with the same runner, evaluator, model, prompt, fixture, permissions, and environment; replay baseline/candidate provider-free to a terminal bounded verdict.
7. Update proof inventory and traceability, run applicable focused and full project validation, strict selected/all OpenSpec validation, and `git diff --check` on the same readable candidate.

No deployment or data migration exists. Rollback restores the prior version-controlled proof tooling, fixtures, specs, inventory, and any evidence-contingent instruction wording as one correlated local change; the accepted general baseline pointer and preserved immutable evidence are never rewritten by rollback.
