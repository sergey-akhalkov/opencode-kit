# Design: Tighten Autopilot Routing And Escape Hatch

## Routing Model

Autopilot should be selected by explicit control-plane signals, not by a broad preference for process. The routing decision is:

1. If the user explicitly says `/autopilot` or `autopilot`, run the Autopilot control-plane check.
2. If the user says `работай` inside an active Autopilot context, continue through Autopilot until blocker, MR wait, idle/deferred state, or limit.
3. If ready OpenSpec task ledgers or queues are already known and strict phase enforcement matters, route to Autopilot.
4. If there is no ready ledger and the user is asking what to do next, route to `next-step` instead.
5. If there is one accepted OpenSpec change that can be completed directly without queue/runtime orchestration, route to `openspec-apply-change`.
6. If the request is a casual codebase question or one obvious small edit, stay direct.
7. If the work is non-OpenSpec fan-out where prompt-only coordination is enough, route to `orchestrator` only when the scope justifies it.

## Escape Hatch

The agent should not keep Autopilot alive just because Autopilot was loaded. The escape hatch triggers when Autopilot output or local evidence shows that the control plane is not the safest next step.

| Signal | Required Behavior |
| --- | --- |
| `ready_runtime_deferred` | Report valid Ready work exists but runtime cannot claim/dispatch; do not repeat equivalent `autopilot_run_next`; hand off to a named manual workflow or OpenSpec follow-up. |
| `no_ledgers` | Report no plugin-owned task ledger; route to `next-step` or OpenSpec proposal/discovery instead of retrying Autopilot. |
| `no_actionable_tasks` | Explain terminal/blocked/invalid/waiting states from `taskSummaries[]`; stop or hand off to the specific blocker workflow. |
| stale report evidence | Stop before archive/release claims and run freshness/contract validation. |
| evidence conflict | Prefer source/tests/plugin output over stale prose; stop with a conflict summary and do not advance ledgers manually. |

If the public output later adds a structured `handoffTarget`, it should use a small enum such as `next-step`, `openspec-apply-change`, `manual-direct`, `orchestrator`, or `follow-up-openspec`. Until then, skill/README wording should name the expected handoff explicitly.

## Evidence Conflict Rule

Evidence conflicts include:

- Plugin output and ledger status disagree.
- Tests/source prove behavior that `tasks.md` or reports still mark as pending.
- A report uses an older output contract shape as current evidence.
- A tool returns no-progress/deferred state while prose claims advancement.

The agent should report the conflict and use `harden-autopilot-contract-validation` freshness checks when available. It must not manually mutate protected Autopilot state to make the flow look complete.

## Test Strategy

- Add deterministic instruction/routing checks over `openspec-autopilot`, README routing, and `/autopilot` command text.
- Add fixture text snippets for eligible and ineligible requests so routing wording stays explicit.
- Add tests or validation rules that no-progress reason codes document a stop or handoff path and do not recommend repeated equivalent calls.
- Keep tests structural and deterministic; do not ask a model to classify free-form prompts.

## Rollout

1. Add tests and OpenSpec contract first.
2. Update skill/README/command wording after tests define the expected routing terms.
3. Run `instruction-artifact-reviewer` because this changes model-facing instructions.
4. Re-run Autopilot live regression after runtime and contract-validation changes land.

## Risks

- Overly strict routing wording could make explicit `/autopilot` less useful. Keep the explicit command as an allowed control-plane check.
- Structural wording tests can become brittle. Test critical phrases and enumerated boundaries, not full prose snapshots.
- A handoff target enum can drift from runtime output. Put public values under `harden-autopilot-contract-validation` if it is added.
