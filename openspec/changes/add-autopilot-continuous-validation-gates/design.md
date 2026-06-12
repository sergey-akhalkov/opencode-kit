# Design: Add Autopilot Continuous Validation Gates

## Summary

Introduce a deterministic validation planner and checker that converts the current manual Autopilot safety checklist into executable gates. The checker should be cheap by default, stricter at pre-push, and strictest before archive or ready-to-land claims.

The design reuses existing helpers where possible:

- `tools/autopilot-ledger.ts` for ledger validation.
- `tools/autopilot-evidence.ts` for evidence-pack planning, collect mode, validation summaries, reviewer plan, and report rendering.
- `tools/autopilot-report-freshness.ts` for report freshness and archive-strict checks.
- `tools/openspec-retro-followups.ts` and `tools/openspec-retro-gate.ts` for retrospective archive gates.
- `tools/pre-push-validate.ts` for fail-fast push protection.

## Command Model

Add a TypeScript CLI and package script after tests define the contract:

```sh
npm run autopilot:check -- --level cheap
npm run autopilot:check -- --level standard --change <change-id>
npm run autopilot:check -- --level prepush
npm run autopilot:check -- --level final --change <change-id>
```

The exact script name may change during implementation, but the behavior should remain stable:

- `--level cheap|standard|prepush|final` selects gate strictness.
- `--change <change-id>` scopes checks to one OpenSpec change when provided.
- `--ledger <path>` scopes checks to one or more ledger paths when provided.
- `--format json|markdown` controls output format, defaulting to JSON for automation.
- `--fail-on-warnings` is optional and intended for strict CI or release flows.

## Planner Algorithm

The planner builds a stable list of validation items before anything runs.

1. Discover repository state.
2. Discover active OpenSpec changes under `openspec/changes/*` excluding `archive/`.
3. Discover active Autopilot ledgers under `openspec/changes/*/automation/task.json` and `.autopilot/prototype/tasks/*.json`.
4. If a `--change` scope exists, keep only matching active change artifacts.
5. If `--ledger` scopes exist, keep only those ledgers and fail if a scoped path is missing or outside the repository.
6. Inspect `git status --porcelain=v1 -z` to find changed active changes and changed validation surfaces.
7. Add cheap checks for affected ledgers and changed active changes.
8. Add standard checks for evidence-pack collect and report freshness when report/checklist artifacts exist.
9. Add pre-push checks by composing repository validation, tests, OpenSpec validation, active ledger validation, and blocking freshness checks.
10. Add final checks for retro follow-ups, retro gate, archive-strict freshness, and final reviewer/validation reconciliation.
11. Deduplicate commands by normalized executable, args, working directory, and scope.
12. Sort checks by stable severity and label so output order is deterministic.

If no active Autopilot ledgers exist, the planner should emit a passed or not-applicable item such as `autopilot-ledgers:none` instead of failing. Missing ledgers are blocking only when the caller explicitly scoped one or the change claims Autopilot ledger evidence.

## Gate Levels

### Cheap

Cheap checks must be safe to run frequently:

- Validate scoped or changed active ledgers with `validateTaskLedger` or `npm run autopilot:validate -- <paths>`.
- Verify protected path policy is present in ledger `scope.forbidden`.
- Report task status/actionability summary from discovered ledgers.
- Report missing ledgers as `not-applicable` unless scoped explicitly.
- Do not run `npm test` or `openspec validate --all`.
- Do not mutate protected Autopilot paths.

### Standard

Standard checks are for work-slice completion and reviewer handoff:

- Include all cheap checks.
- Run or simulate `autopilot:evidence --mode collect` for scoped active changes.
- Run advisory report freshness checks for existing Autopilot reports.
- Surface reviewer plan requirements from deterministic signals.
- Treat stale report/checklist contradictions as errors when they conflict with a ready-to-land claim; otherwise report warnings or unknowns.

### Prepush

Pre-push checks are blocking and fail-fast:

- Run existing repository validation gates in the current order: `npm run validate`, `npm test`, and OpenSpec validation when `openspec/` exists.
- Add active ledger validation before or after repository tests according to the fastest useful failure order. Recommended order: repository validation, active ledger validation, tests, OpenSpec validation, blocking freshness checks.
- Validate every discovered active Autopilot ledger, not only ledgers touched in the current diff.
- Run blocking freshness checks only for active changes with changed reports/tasks/ledgers or explicit ready-to-land/archive evidence.
- Do not run duplicate heavy commands if evidence-pack validation already planned the same command.

### Final

Final checks are for archive, release, and ready-to-land claims:

- Include all pre-push checks.
- Run `autopilot-report-freshness.ts <change-id> --mode archive-strict` when Autopilot reports exist.
- Run `npm run openspec:retro-followups -- <change-id>` when available before the retro gate.
- Run `npm run openspec:retro-gate -- <change-id>`.
- Require reviewer gates to be passed or explicitly skipped with reasons.
- Require validation results to be current enough for the final claim.

## Output Contract

The checker should emit stable JSON by default:

```ts
type AutopilotCheckOutput = {
  schemaVersion: 1;
  level: "cheap" | "standard" | "prepush" | "final";
  generatedAt: string;
  scope: {
    changes: string[];
    ledgers: string[];
  };
  status: "passed" | "warning" | "failed" | "blocked";
  exitCode: number;
  checks: Array<{
    id: string;
    label: string;
    status: "passed" | "warning" | "failed" | "blocked" | "unknown" | "not-applicable";
    blocking: boolean;
    command?: string;
    source: string;
    summary: string;
  }>;
  nextActions: Array<{
    label: string;
    reason: string;
    command?: string;
  }>;
};
```

Rules:

- `exitCode` is non-zero when any blocking check is `failed` or `blocked`.
- Warnings do not fail by default unless `--fail-on-warnings` is set.
- Unknown evidence is explicit and never guessed as pass or fail.
- Long command output is summarized and redacted consistently with `autopilot:evidence`.
- Absolute paths are redacted by default unless an explicit `--show-paths` style option is added.

## Pre-Push Integration

Update `tools/pre-push-validate.ts` to use the shared planner instead of hardcoding only three commands.

Required behavior:

- Preserve current labels and fail-fast behavior for repository validation, tests, and OpenSpec validation.
- Add a labeled `Autopilot ledger validation` gate when active ledgers are discovered.
- Add a labeled `Autopilot evidence freshness` gate when changed active Autopilot report/task artifacts need blocking freshness validation.
- Keep missing OpenSpec CLI and command startup failures visible with clear labels.
- Keep tests proving deterministic order and short-circuit behavior.

If no active ledgers are found, pre-push should log a concise not-applicable message and continue.

## Phase-Transition Checkpoints

Autopilot instructions should recommend executable checkpoints instead of prose-only reminders:

- After `autopilot_run_next` returns `advanced`: run cheap status/ledger check before additional collection or dispatch.
- After `autopilot_collect` returns `advanced`: run cheap check for affected task ids and confirm no runtime evidence conflict.
- Before claiming `Implementation -> Review`: run standard check so validation, changed files/no-op reason, secret scan placeholder, and reviewer plan are visible.
- Before MR/PR handoff: run standard or prepush check depending on repo policy.
- Before archive or ready-to-land: run final check.

These checkpoints are guidance for agents and users; plugin-owned state remains authoritative for legal transitions.

## Safety

- The checker must not write `.autopilot/**` or `openspec/changes/*/automation/**`.
- Report writing remains owned by `autopilot:evidence --mode report` and must use approved non-protected paths.
- The checker must not run remote commands, push, merge, deploy, or read secrets.
- The checker must not treat prose reports as stronger evidence than current ledgers, tests, plugin output, or freshness checks.

## Test Strategy

- Unit tests for planner discovery with no ledgers, one active ledger, multiple active ledgers, scoped change, scoped ledger, archived changes, and prototype ledgers.
- Unit tests for gate-level expansion and command deduplication.
- Pre-push tests proving active ledger validation is inserted in deterministic order and short-circuits on failure.
- Tests proving no Autopilot ledger absence failure when no ledgers are present.
- Tests proving missing explicitly scoped ledger fails with a clear message.
- Tests proving changed report/task artifacts trigger freshness checks at `standard`, `prepush`, and `final` levels.
- Tests proving final level plans retro follow-ups before retro gate.
- Tests proving JSON output shape, redaction, warning handling, and `--fail-on-warnings` behavior.
- README/instruction drift tests if command names or routing guidance are documented.

## Risks

- Running too much too often can slow the agent down. Mitigation: cheap/standard/prepush/final levels and deduplication.
- Pre-push may become noisy in repositories with many historical active ledgers. Mitigation: exclude `archive/`, support scoped checks, and report not-applicable cleanly.
- Freshness checks can over-block if they cannot understand an artifact. Mitigation: unsupported evidence becomes `unknown` unless a final/archive claim depends on it.
- New command names could drift from README/skills. Mitigation: existing validation-script and instruction-drift tests should cover documented scripts and wording.
