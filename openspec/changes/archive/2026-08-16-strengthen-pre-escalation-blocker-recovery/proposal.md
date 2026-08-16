## Why

The current autonomy and owner-handoff rules prohibit premature questions while safe local work remains, but they do not require a final independent diagnostic pass before a technical or uncertain blocker is escalated. This leaves a reachable gap where the main session can ask the user to resolve a blocker that a distinct, goal-preserving troubleshooting route could have removed autonomously.

## What Changes

- Add a bounded pre-escalation recovery contract that preserves the original accepted outcome and distinguishes proven owner-only actions from technical or uncertain blockers.
- Require main to execute an unused, safe, causally distinct local mechanism before asking the user, and to use at most one diagnosis-only `troubleshooter` consultation per failure chain when no such mechanism remains and owner-only status is not proven.
- Require main to verify and execute any authorized goal-preserving recovery returned by `troubleshooter`, suppressing the user question when that route advances the original task.
- Tighten the `troubleshooter` case-file and report contracts around missing decision-changing evidence, the best bounded recovery route, rejected alternatives, and the exact unavoidable owner action when no autonomous route exists.
- Add deterministic drift checks and bounded same-model baseline/candidate scenarios that distinguish autonomous recovery, exact owner handoff, repeated-strategy suppression, and role-boundary preservation.
- Correlate opt-in completion-guard troubleshooting to the current failure-chain fingerprint after provider-free controller evidence reproduced a distinct-chain bypass that canonical instruction tuning cannot resolve.

## Outcome Capsule

- **Outcome**: Before escalating a blocker, the main session either advances the original task through the cheapest safe, causally distinct recovery route or presents a self-contained handoff proving the exact owner action that remains unavoidable.
- **Operating Envelope**: Loaded OpenCode main sessions using the kit's canonical global instructions and installed `troubleshooter`; local, reversible, non-secret diagnostic work only; existing protected owner boundaries remain controlling.
- **Non-Goals**: Do not authorize credentials, elevation, destructive or remote effects, deployment, release, purchases, protected semantic decisions, or other owner actions; do not make `troubleshooter` a production or test author; do not require unlimited retries, create a new skill, or redesign completion lifecycle stages.
- **Non-Deferrable Invariants**: Preserve the original accepted outcome and operating envelope; never cross an owner boundary by substitution; do not ask while a safe distinct local route remains; one equivalent consultation per failure chain unless new evidence or a distinct mechanism exists; specialist advice never authorizes mutation; missing specialist capability never becomes an RC/stable gate.
- **Observable Proof**: Deterministic contracts retain owner boundaries and role permissions, while same-model loaded-entry-point scenarios show zero troubleshooting calls for proven owner-only actions, no question when a safe local route remains, exactly one consultation for an exhausted technical blocker, main-owned execution of an authorized recovery, and suppression of equivalent repeated consultations.
- **Material Residual Risks**: Prose instructions remain model-sensitive; serial consultation adds latency when classification is too broad; the completion guard currently recognizes any completed `troubleshooter` child rather than a failure-chain identity; installed-source drift can hide repository behavior.
- **Stop Line**: Stop when the bounded loaded-runtime scenarios and project validation pass with no known premature-escalation or protected-boundary regression. Do not expand into completion-guard runtime mutation without a reproduced current-scope bypass, and do not pursue general autonomous decision making or unrelated instruction cleanup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Define the canonical pre-escalation recovery behavior, bounded troubleshooter routing, mirror discipline, and semantic evaluation requirements for loaded instruction artifacts.

## Impact

- Canonical runtime authority in `global/AGENTS.md` and the role contract in `global/agents/troubleshooter.md`.
- Concise routing and pointer surfaces in `README.md`, `instructions/reusable-project-agent-instructions.md`, and `templates/project/AGENTS.md`.
- Instruction and agent contracts, validators, focused tests, proof inventory, and a bounded loaded-behavior proof runner under `tools/`.
- Existing `library-instruction-artifacts` specification requirements.
- No public application API, persisted-data format, external dependency, release process, or remote system behavior changes.
