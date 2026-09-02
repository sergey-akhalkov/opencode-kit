## Why

Ordinary Small OpenSpec authoring currently represents artifact shape, risk classification, and non-applicable workflow mechanisms through one bundle of proposal prose. That coupling makes compact authoring fail open when a model selects its own risk path, forces explicit `none` or `exempt` records for absent mechanisms, and lets exact sentence mirrors turn human wording into a parser boundary. The change needs two independent reviewed facts: the artifact contract to validate and the risk disposition that can authorize that contract.

### Outcome Capsule

- **Outcome**: New OpenSpec changes use an explicit artifact contract independently from an explicit risk disposition. A compact contract is valid only with current `ordinary-small-exact` disposition; `material`, `unknown`, stale, missing, or invalid risk evidence cannot enter the compact path. Full and legacy changes retain the complete current contract, while a valid compact change may omit genuinely non-applicable horizon, dividend, falsification, separate claim-scope, and no-event history records.
- **Operating Envelope**: The installed kit's loaded OpenSpec authoring instructions, `.openspec.yaml` metadata reader, propose/apply/archive operation gates, strict OpenSpec validation, focused instruction validators, and disposable configured OpenSpec repositories. Existing active and archived changes remain readable under their recorded legacy contract.
- **Non-Goals**: Team-advice routing; specialist catalog behavior; Practice Owner trigger changes; campaign, audit-ledger, evidence-retention, or general CI policy; deterministic semantic risk inference; migration of existing change bytes; implementation or archival disposition of another active change.
- **Non-Deferrable Invariants**: Artifact shape never proves risk class. No task is downgraded from Material based on size, prose, path, file count, task count, or model assertion alone. Material or unknown risk requires the full contract and blocks compact mutation. A newly discovered Material trigger makes compact selection stale before mutation. Existing protected boundaries, exact Practice Owner routes, runtime proof, task-completeness archive checks, worktree preservation, diagnostics, cleanup, and legacy compatibility remain unchanged.
- **Observable Proof**: Through the production OpenSpec gates, disposable fixtures accept compact plus current `ordinary-small-exact`, accept full plus any valid disposition, retain legacy-strict behavior when both fields are absent, and reject partial, malformed, compact-plus-material, compact-plus-unknown, and stale compact combinations. Through the actual installed OpenCode entry point, one exact local Ordinary Small request creates only the compact required artifacts, passes propose/apply checks, and leaves no no-op horizon, dividend, falsification, claim-scope, or history artifact. Deliberate prose-only edits pass when behavior is unchanged, while parser-token and route defects fail focused controls.
- **Material Residual Risks**: Main can still misclassify risk; stale evidence can be overlooked; mixed legacy and structured records increase parser branches; human-readable policy can drift despite structural checks; finite installed scenarios do not prove every model or OpenSpec repository; active changes overlap loaded instruction, proof, and validator roots.
- **Stop Line**: Finish one two-axis metadata contract, fail-closed combination rules, compact/full/legacy artifact checks, Material override and stale-profile handling, optional no-event horizon/dividend/falsification/history semantics, syntax-versus-prose validation, one installed compact happy path, and current ownership ordering. Stop before advisor routing, semantic scoring, broad OpenSpec redesign, rewriting existing records, consumer-project behavior, installation, activation, publication, or remote effects.
- **Delivery Horizon:** none - this is a universal kit authoring-contract correction and is not part of a declared product delivery horizon.

## Claim And Evidence Scope

- **Claim ID**: `SOSC-001`
- **Claim Class**: Finite-population OpenSpec artifact-contract and installed authoring behavior.
- **Population**: Compact plus current Ordinary Small exact, full plus Ordinary Small exact, full plus Material, full plus unknown, missing legacy metadata, one-field-only metadata, malformed values, compact plus Material, compact plus unknown, stale compact after a Material trigger, explicit optional mechanisms under compact, and human-prose versus parser-token mutation controls.
- **Coverage Basis**: Provider-free parser and operation-gate fixtures plus bounded same-model installed sessions in disposable repositories with identical request, permissions, source/model/profile/environment identities, artifact/effect oracles, and cleanup boundaries.
- **Production Path**: Loaded OpenSpec propose/apply/archive instructions, structured metadata reader, operation gates, strict validation, and current consumer-outcome capture/evaluation path for configured authoring.
- **Comparison Paths**: Current legacy-strict authoring, the earlier single `profile` design, compact/full structured candidates, malformed combinations, and representative active and archived legacy changes.
- **Environment**: Current supported OpenCode runtime and configured kit source on local Windows, provider-free fixtures, bounded synthetic configured sessions in proof-owned disposable repositories, and no consumer-project remote or protected effect.
- **Real Oracle**: Parsed normalized metadata, operation-gate status and diagnostics, exact created artifacts, ordered assistant/skill/tool events, runtime output, changed-file and forbidden-effect observations, current source/model/environment identity, provider-call bounds, terminal liveness, and cleanup.
- **Unresolved Observations**: Classification quality outside the reviewed population, untested OpenCode/model/OpenSpec versions, future upstream schema ownership, and unrelated workflow costs.
- **Maximum Claim**: In the reviewed installed environment and finite SOSC-001 population, artifact shape is validated separately from explicit risk disposition; compact authoring is accepted only for current Ordinary Small exact controls, while exercised Material, unknown, malformed, stale, full, and legacy controls remain fail-closed. This does not prove universal semantic classification, all repositories, or overall delivery speed.

- **Automation Dividend**: required - extend the existing OpenSpec metadata, operation-gate, and configured consumer-outcome owners with one reviewed SOSC-001 seed, stable explicit facts, and deliberate red controls without deterministic risk inference or a retained replay corpus.
- **Bounded Falsification Review**: required - challenge artifact/risk conflation, silent Material downgrade, stale compact selection, partial metadata fallback, legacy breakage, optional-mechanism ambiguity, weak prose replacement oracles, ownership collisions, and unnecessary scope.

## What Changes

- Add explicit `artifactProfile` and `riskDisposition.kind` inputs for new structured changes. The normalized artifact profile is `compact`, `full`, or internal `legacy`; the risk kind is `ordinary-small-exact`, `material`, or `unknown`.
- Treat both metadata fields absent as legacy-strict, exactly one field present as invalid, and malformed values as blocking errors.
- Permit `compact` only with current `ordinary-small-exact`; require `full` for `material` or `unknown`; allow full authoring for Ordinary Small when a richer record is useful.
- Make a later Material trigger invalidate compact readiness and require full artifacts before implementation mutation.
- Let valid compact exact changes omit unlinked horizon, absent dividend, absent falsification episode, separate exact-case claim record, and no-event history. Explicitly present mechanisms retain existing validation and correlation.
- Replace complete-sentence validation only on the touched OpenSpec route with parser-token checks, structural ownership checks, and focused behavior fixtures.
- Keep production mutation disabled until OPDC, LFTD, and CCO archive in the selected order and every exact overlapping owner transfers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-spec-workflow-integrity`: Separate artifact contract from risk disposition and define compact/full/legacy proposal, apply, and archive behavior.
- `library-bounded-falsification-review`: Treat valid compact exact omission as not applicable rather than an explicit exemption record.
- `agent-workflow-automation`: Permit a valid compact Ordinary Small exact change to omit a non-applicable automation dividend while retaining required full/Material behavior.
- `library-instruction-artifacts`: Keep workflow improvement non-blocking and validate parser-facing syntax separately from human-readable policy.

## Impact

- Planned loaded owners: the OpenSpec authoring sections of `global/AGENTS.md`, maintained project mirrors, and propose/apply/archive skills.
- Planned deterministic owners: exact OpenSpec metadata/operation-gate readers, focused validators/tests, and current configured authoring fixtures.
- This change is Material because later implementation alters loaded OpenSpec lifecycle policy. Planning grants no implementation, install, restart, configured-provider expansion, commit, push, archive, release, deployment, or protected-action authority.
- No public product API, persisted consumer data, dependency installation, remote mutation, or deployment is introduced.
