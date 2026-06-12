# Proposal: Add Autopilot Continuous Validation Gates

## Why

Current Autopilot safety is strong at explicit tool boundaries and final repository gates, but it is not yet frequent enough for long-running work. A task can drift for several turns before `npm run prepush:validate`, archive freshness checks, or manual `npm run autopilot:validate -- <task-ledger.json>` reveal that a phase gate, evidence item, reviewer gate, MR gate, or report freshness invariant was missed.

The current pre-push gate runs repository validation, tests, and OpenSpec validation. It does not explicitly discover and validate every active Autopilot task ledger, does not produce a cheap Autopilot checkpoint suitable after each phase transition, and does not deduplicate evidence-pack validation with already planned repository gates.

Autopilot needs a layered validation workflow that can run cheaply and often during local work, then run stricter checks before push, MR handoff, and archive readiness.

## What Changes

- Add a deterministic Autopilot validation planner/checker that can run at multiple levels: `cheap`, `standard`, `prepush`, and `final`.
- Validate discovered active Autopilot ledgers automatically when they are present, instead of relying on the agent to remember `npm run autopilot:validate -- <task-ledger.json>`.
- Extend the pre-push validation plan to include Autopilot-specific ledger checks and active-change evidence checks without duplicating expensive commands already covered by `npm run validate`, `npm test`, or `openspec validate --all`.
- Provide a cheap local checkpoint for after task selection, after phase transitions, after `autopilot_collect`, before MR/PR handoff, and before archive-ready claims.
- Keep machine-readable output stable enough for agents, hooks, and future plugin tools to distinguish passed, warning, error, unknown, unavailable, and blocked evidence.
- Update README and Autopilot instructions so users and agents know which validation level to run and when.

## Goals

- Catch skipped Autopilot phases, stale evidence, invalid ledgers, missing reviewer gates, and MR/archive readiness mismatches earlier than push time.
- Make the common check path executable and deterministic, not a prose reminder.
- Keep frequent checks fast enough to run repeatedly during work.
- Preserve fail-fast behavior for blocking pre-push gates while still reporting enough context for the agent to fix the right artifact.
- Reuse existing TypeScript helpers and validation scripts rather than adding PowerShell, Python, or JavaScript tooling.

## Non-Goals

- Do not implement worker dispatch, protected ledger mutation, or full autonomous runtime advancement.
- Do not auto-merge MRs, push protected branches, deploy, read secrets, or bypass user-owned decisions.
- Do not run the full test suite after every small edit by default.
- Do not replace reviewer judgment; require reviewers or explicit skip reasons by deterministic signal.
- Do not make `autopilot:evidence --mode validate` blindly rerun commands already executed by the same pre-push plan.

## Proposed Validation Levels

| Level | Intended Trigger | Blocking Scope | Typical Checks |
| --- | --- | --- | --- |
| `cheap` | After ledger edits, phase transitions, status/collect calls, or before a long pause. | Invalid ledgers and obvious evidence conflicts. | Discover active ledgers, run `autopilot:validate` for affected ledgers, summarize `autopilot_status`/known actionability when available, detect missing ledgers as non-blocking. |
| `standard` | Before MR/PR description, reviewer handoff, or claiming a work slice is complete. | Ledger errors, stale report/checklist contradictions, missing reviewer plan signals. | `cheap` plus evidence-pack collect/freshness checks for affected active changes. |
| `prepush` | Git pre-push hook or manual `npm run prepush:validate`. | Repository validation, tests, OpenSpec validation, active ledger validation, and blocking freshness conflicts. | Existing pre-push gates plus discovered active ledger validation and deduplicated active-change evidence checks. |
| `final` | Archive, release, or ready-to-land evidence. | All blocking gates plus retrospective/archive requirements. | `prepush` plus report freshness strict mode, retro follow-up generation, retro gate, and final reviewer/validation reconciliation. |

## Impact

- Developers and agents get a clear command path for frequent Autopilot safety checks.
- Invalid ledgers and stale report claims are found before late push/archive gates.
- Pre-push becomes a stronger last line of defense for Autopilot work without losing its deterministic order or clear gate labels.
- Existing runtime-deferred behavior remains honest: checks may report that no worker dispatch occurred, but they must not pretend progress was made.

## Validation

- Add failing tests for the validation planner and pre-push Autopilot gate expansion before implementation.
- Run `npm run validate`.
- Run `npm test`.
- Run `npm run openspec:validate` or `openspec validate --all`.
- Run `npm run autopilot:validate -- <task-ledger.json>` for any new or modified ledger fixtures.
- Run the new Autopilot check command at `cheap`, `standard`, and `prepush` levels once implemented.
