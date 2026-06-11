# Proposal: Tighten Autopilot Routing And Escape Hatch

## Why

Autopilot is intentionally a control plane for ready OpenSpec work, but that creates a routing risk: if it is invoked for casual exploration, one obvious small edit, or a single accepted change that can be handled directly, the model can follow Autopilot ceremony instead of solving the task. Existing skill prose discourages over-triggering, and live regression covered the scenario, but the behavior is not yet expressed as a dedicated OpenSpec contract with tests.

Autopilot also needs an explicit escape hatch. When the plugin reports no ledgers, runtime-deferred Ready work, no actionable tasks, stale evidence, or a mismatch between local evidence and plugin output, the agent should stop, report the mismatch, or hand off to the safer workflow rather than continuing the ritual.

## What Changes

- Define explicit Autopilot eligibility rules for `/autopilot`, active Autopilot context, ready OpenSpec ledgers/queues, strict task-type phase enforcement, and safe parallel OpenSpec work.
- Define explicit non-eligibility cases: casual codebase questions, one obvious small edit, OpenSpec discovery with no ready work, a single accepted change that `openspec-apply-change` can finish directly, and non-OpenSpec fan-out where prompt-only `orchestrator` is enough.
- Add an escape-hatch contract for `ready_runtime_deferred`, `no_ledgers`, `no_actionable_tasks`, stale report evidence, and evidence conflicts.
- Add instruction/routing drift tests for the skill, README routing, and `/autopilot` command wording.
- Add or prepare a structured handoff target in Autopilot guidance so the model can route to `next-step`, `openspec-apply-change`, direct manual work, or `orchestrator` without guessing.

## Non-Goals

- Do not implement worker dispatch, ledger mutation, blocker persistence, MR sync, or parallel implementation. Runtime behavior remains owned by `improve-autopilot-runtime-e2e-harness`.
- Do not replace the public output contract or contract-drift checks owned by `harden-autopilot-contract-validation`.
- Do not disable explicit `/autopilot`; an explicit command still starts the control-plane check.
- Do not add fuzzy model scoring for task suitability. Routing must be based on explicit user intent, ledger state, and documented workflow boundaries.

## Impact

- Reduces the risk that Autopilot forces the model through an inappropriate flow.
- Makes safe exit behavior explicit when runtime capability is deferred or evidence conflicts.
- Keeps Autopilot useful for large OpenSpec queues and strict phase gates without making it the default for ordinary work.

## Validation

- Add focused instruction/routing tests before changing skill or README wording.
- Run `npm run validate`, `npm test`, and `openspec validate --all`.
- Run `instruction-artifact-reviewer` after skill, README, command, or routing wording changes.
