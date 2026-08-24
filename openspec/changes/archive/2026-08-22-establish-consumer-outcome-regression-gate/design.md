## Context

See `proposal.md` for motivation and `specs/library-consumer-outcome-regression/spec.md` for behavior. The repository already has installed OpenCode proof clients, model-profile loading, privacy-safe evidence conventions, portable process execution, source-hash manifests, and capture/replay/evaluate patterns. It does not have one canonical consumer outcome comparison or a gate that binds loaded model-facing source bytes to current evidence.

The current worktree contains overlapping active changes in package scripts, proof inventory, validators, and model-facing source. Implementation must serialize writes to those shared owners and cannot treat any existing completed checkbox or archived evaluation as the baseline identity. The first accepted baseline is an explicit staged source identity, not an implicit dirty checkout.

## Goals / Non-Goals

**Goals:**

- Extend existing proof infrastructure rather than create another workflow or dependency.
- Produce comparable installed baseline/candidate observations with bounded model use and complete cleanup.
- Keep scenario semantics and expectation selection in reviewed data outside helper code.
- Make evaluation and the current-candidate gate deterministic, provider-free, privacy-safe, and suitable for CI.
- Keep retained evidence bounded enough that the gate does not recreate the evidence-sprawl problem it is intended to expose.

**Non-Goals:**

- Statistical proof across arbitrary models, platforms, languages, or project classes.
- Automatic instruction optimization, risk ranking, semantic scoring, or threshold inference.
- Automatic baseline promotion, active-change repair, install/activation, or consumer migration.
- Replacing project-native runtime proof, tests, OpenSpec validation, or protected-action gates.

## Decisions

### 1. Extend the maintained proof architecture

Use one public CLI, `tools/proofs/consumer-outcome-regression.ts`, with effect-free `--help`, `preflight`, `baseline`, `capture`, `replay`, `evaluate`, and `gate` modes. Keep cohesive internals under `tools/proofs/consumer-outcome/`:

- `contracts.ts` owns schemas, stable serialization, digests, and cause-preserving parse errors.
- `capture.ts` owns fixture/session/process lifecycle and installed OpenCode observations.
- `evaluate.ts` is filesystem-bounded and pure after explicit evidence reads.

Reuse `tools/proofs/lib/opencode-proof-client.ts`, `global/bin/portable-process.ts`, `tools/model-profile.ts`, existing redaction conventions, and the proof inventory contract. Before implementation, inspect the current source-staging logic in `tools/proofs/pre-escalation-recovery.ts`; extract only a genuinely reusable stage-source primitive if direct reuse is not possible. Do not copy another private staging implementation.

Decision: `extend` existing proof infrastructure. Cross-project discovery is not applicable because the selected owners are repository-specific proof/runtime contracts already verified in this checkout.

Alternatives rejected:

- A new package or benchmark framework adds dependency and lifecycle cost without improving the two fixed scenarios.
- Encoding evaluation in Markdown or OpenSpec tasks makes replay non-deterministic and hard to validate.
- One monolithic proof file repeats the current large-file/navigation problem.

### 2. Keep semantics in a reviewed manifest

Add `config/consumer-outcome-regression.json` with schema version, governed source paths, evidence limits, profile selection, exact two scenario records, three samples per arm, fixture paths, requests, permissions, expected outcomes, validation argv, proof and cleanup oracles, and friction fields. Use the existing `quality-independent` profile. Controlled fixtures default to `no-regression`; a real comparison receives a separate exact candidate-request record containing `candidateId`, source root, and `no-regression | improvement` expectation.

Add `config/consumer-outcome-baseline.json` as the only active baseline pointer. It stores baseline version, accepted source/environment/scenario/evaluator digests, bounded bundle path, prior baseline reference, and reviewed reason.

The current governed source list is explicit and stable: `global/principles-of-work.md`, `global/AGENTS.md`, `global/opencode.json.template`, `profiles/all.json`, planned `profiles/core.json`, the runtime-surface profile generator and generated effective manifest/config identities, `global/model-profiles/quality-independent.json`, and maintained files under `global/skills/`, `global/agents/`, `global/commands/`, `global/plugin/`, `global/plugins/`, and `global/extensions/`. The manifest caps one sample bundle at 524288 bytes and one complete baseline or matched capture at 8388608 bytes.

Fixture seed files live under `tools/proofs/fixtures/consumer-outcome/` and are copied into create-new temporary roots. The Ordinary Small fixture is a Node 24 TypeScript greeting CLI with a focused test and no OpenSpec directory; its request adds one explicit output option and must finish with runtime proof plus the focused test. The OpenSpec-backed fixture is a separate Node 24 CLI with one active `add-json-output` change, concrete local validation argv, and one request to continue the single change through accepted local proof without commit or remote action. Neither fixture refers to this repository by name or path after materialization.

The CLI validates exact keys and stable ordering. It never discovers scenario semantics from files, scores prose, or changes expectation based on observed results.

Alternative rejected: generating scenarios from current repository content would make evidence drift with the implementation and allow the evaluator to approve its own assumptions.

### 3. Pair three samples while controlling environment drift

Each scenario uses three fresh baseline samples and three fresh candidate samples. Pair order alternates to reduce simple temporal ordering bias: `B1,C1`, `C2,B2`, `B3,C3`. Every sample gets a new fixture root and parentless OpenCode root, identical prompt bytes, the same explicit profile route, one primary request maximum, exact permission envelope, and the same validation/proof commands.

Capture records model, variant, OpenCode/runtime/dependency identity, OS class, scenario and initial-manifest digests, permission digest, and source manifest. Any mismatch blocks evaluation. It does not silently normalize environment differences.

Three samples are the smallest current increment that supports a stable median and one repeated observation without open-ended provider cost. Later sample-count changes require a reviewed manifest/spec change; retry counts are process controls but do not authorize extra provider calls beyond the accepted capture envelope.

Alternative rejected: one sample per arm is cheaper but too sensitive to model variability for a maintained gate. Statistical significance testing is future scope and would add cost and inference not justified by two scenarios.

### 4. Separate hard invariants from friction measurements

The evaluator first checks every sample's exact outcome, state manifest, validation, representative proof, permissions, forbidden effects, diagnostics, and cleanup. Any regression or acceptance-critical unknown returns `failed` or `blocked` before friction comparison.

For each friction field, retain three raw values and calculate the middle value after numeric sorting. The evaluator then applies the explicit expectation:

- `no-regression`: every candidate median is no greater than baseline for its scenario.
- `improvement`: all no-regression checks pass and at least one median is strictly lower across the scenario set.

Elapsed time and token observations are emitted as diagnostics only. They are not stable enough to gate this increment. The evaluator never combines fields into a score or weighted rank.

Alternative rejected: a weighted productivity score would hide which behavior changed and violate the deterministic-helper boundary.

### 5. Bootstrap an immutable accepted baseline without claiming improvement

The first `baseline` capture targets an explicit accepted staged source and current environment. It must pass all non-friction oracles and produces `baseline-established`; it cannot produce an improvement verdict. The maintained baseline pointer stores schema version, source/environment/scenario/evaluator digests, bundle path, prior baseline reference, and reviewed reason.

Capture and evaluation never update that pointer. Baseline replacement is a direct reviewed seed edit after a candidate is accepted, preserving the prior reference and reason. Old raw bundles need not remain in the active gate after the new baseline is independently verified; archive/history may retain their immutable references.

Alternative rejected: automatic promotion after `passed-improvement` lets a helper change the comparison owner and can hide regressions.

### 6. Bind the gate to explicit governed source paths

The manifest explicitly lists model-facing/runtime paths whose bytes can affect the two scenarios. `gate` computes their stable manifest and compares it with the accepted baseline:

- unchanged governed source returns `baseline-current` after baseline replay succeeds;
- changed governed source requires a matching current candidate bundle and evaluation;
- any source, evaluator, scenario, environment, or evidence identity mismatch returns `stale-evidence` or `blocked`.

The governed list is reviewed data. The tool does not infer whether a change is important. A later change explicitly selects `no-regression` or `improvement` in its candidate evidence request.

### 7. Retain one bounded active evidence set

Maintain only the active baseline bundle, optional current candidate bundle, normalized evaluation, and a small baseline-reference history under `tools/proofs/fixtures/consumer-outcome/evidence/`. Each arm has a manifest-declared byte cap and stable file inventory. Raw event data is reduced to the exact redacted facts needed for replay; unrelated session content, full prompts, provider config, credentials, and absolute private paths are excluded.

Evidence overflow is explicit. If an acceptance field is truncated, evaluation blocks. Capture cleanup completes before the next sample; unknown liveness stops the lane. Replay never mutates evidence.

Alternative rejected: placing every attempt under the active OpenSpec change would repeat the 200-plus-file evidence topology observed in the audit.

### 8. Make the existing Ubuntu validation workflow provider-free

Add package scripts for the focused tests and provider-free gate. The current `.github/workflows/validate.yml` Ubuntu job runs schemas, controlled negative fixtures, replay determinism, privacy, freshness, and the current-candidate gate. It never starts configured-provider capture. Do not add a Windows job or modify `templates/ci/` in this increment.

Fresh capture remains an explicit maintainer command with the exact source roots, profile, expectation, candidate id, and create-new evidence root. The current change's first implementation proof establishes only the baseline: two scenarios x three samples, at most six configured-primary requests. A later model-facing candidate comparison uses two scenarios x two arms x three samples, at most twelve requests, under its own explicit candidate request and authorization. No provider call is repeated until the affected preserved bundle has a terminal provider-free evaluation and any failure's retry condition is met.

## Failure Boundaries And Diagnostics

- Manifest/source/schema failure: fail before fixture or session creation and name the redacted field/path identity.
- Environment mismatch: preserve both identities, return `blocked`, and skip semantic evaluation.
- Model/session/tool failure: retain status, bounded stdout/stderr/events, original cause, sample identity, and cleanup.
- Outcome/safety regression: return `failed` with exact scenario/sample/invariant.
- Evidence overflow or missing critical fact: return `blocked`, never zero.
- Cleanup/liveness uncertainty: stop all later samples and report the owned resource refs and unlock condition.
- Evaluator defect: replay preserved bundles; do not repeat capture.

## Fidelity And Authorization

- **Current Rung**: audited source, green provider-free proof infrastructure, and no maintained consumer comparison.
- **Next Real Boundary**: provider-free manifest/evaluator fixtures, then one installed baseline capture against the explicit accepted source.
- **Configured-Provider Boundary**: at most six non-sensitive primary requests for baseline establishment in this change; a later complete matched comparison has a separately declared maximum of twelve. Neither permits remote repository, install, deployment, credential, or consumer effects.
- **Safeguards**: disposable roots, exact tool permissions, no external directories, one sample writer at a time, bounded outputs and waits, immutable create-new evidence, source/environment correlation.
- **Restoration/Cleanup**: delete proof sessions and fixture/process roots in `finally`; preserve only bounded evidence; cleanup uncertainty blocks the next sample.

## Risks / Trade-offs

- [Model variability can move exact call medians] -> use three paired samples, alternating arm order, exact environment correlation, and no elapsed-time gate.
- [Scenario overfitting] -> keep outcome and safety primary, expose every raw count, use two different workflow shapes, and make universal-productivity claims a non-goal.
- [Provider cost or availability blocks refresh] -> keep CI replay provider-free and report stale evidence honestly; never substitute archived results for a current candidate.
- [The gate adds evidence and maintenance cost] -> one active baseline/candidate set, strict byte/file bounds, no per-attempt tree, and baseline-reference history only.
- [Governed path list misses a behavior source] -> review it as seed data during relevant changes; unknown source coverage blocks claims rather than expanding automatically.
- [Existing active changes overlap package/proof files] -> serialize implementation after exact writer/status reconciliation and preserve their bytes.

## Migration Plan

1. Add schemas, manifest, fixtures, pure evaluator, and negative tests without configured-provider calls.
2. Add installed capture using existing proof/session/source-staging owners and prove cleanup at the smallest local boundary.
3. Capture the first accepted baseline, replay it provider-free, and review retained evidence for privacy and bounds.
4. Enable the package/CI current-candidate gate only after baseline readback is green.
5. Prove controlled no-regression and improvement fixtures plus stale/regression failures, then run project validation.

Rollback removes the new CI/package gate first, then the proof tool, manifest, and active evidence set. It does not modify the accepted baseline source, installed global config, consumer projects, or unrelated OpenSpec changes.
