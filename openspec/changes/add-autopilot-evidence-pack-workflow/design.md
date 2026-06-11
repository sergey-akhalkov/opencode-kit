# Design: Add Autopilot Evidence Pack Workflow

## Command Shape

Start with a TypeScript CLI because repository automation is TypeScript-first:

```sh
npm run autopilot:evidence -- --change <change-id> --mode collect
npm run autopilot:evidence -- --change <change-id> --mode validate
npm run autopilot:evidence -- --change <change-id> --mode report --report openspec/changes/<change-id>/live-regression-report.md
```

The exact script name can change during implementation, but the behavior should remain deterministic and machine-checkable. A future plugin tool can wrap the same library once the CLI contract is stable.

## Modes

| Mode | Behavior | Writes |
| --- | --- | --- |
| `collect` | Read ledgers, gather safe status, build validation plan, build reviewer plan, produce scenario skeleton. | None by default. |
| `validate` | Run approved validation commands and summarize exit status and key result lines. | Optional evidence files outside protected `automation/**`. |
| `report` | Render report-ready Markdown from an evidence pack. | Only to an explicit approved report path. |

Default mode should be `collect` so agents can inspect a cheap evidence pack before running heavier commands.

## Evidence Pack Schema

```ts
type AutopilotEvidencePack = {
  schemaVersion: 1;
  changeId: string;
  generatedAt: string;
  gitStatus: { clean: boolean; entries: string[]; truncated: boolean };
  ledgers: LedgerEvidence[];
  toolSmoke: ToolSmokeEvidence[];
  validationPlan: ValidationPlanItem[];
  validationResults: ValidationResultItem[];
  reviewerPlan: ReviewerPlanItem[];
  scenarios: ScenarioEvidence[];
  findings: FindingEvidence[];
  residualRisks: string[];
};
```

All arrays should use stable ordering. Every evidence item should have an id, source, status, and short summary. Unknown or unavailable data should be reported as `unknown`, `unavailable`, or `blocked`, not guessed.

## Tool Smoke Collection

The evidence pack may call safe Autopilot tools only when requested or when the calling context already permits Autopilot tool use. It should record the exact structured output summary and reason code. It should not simulate plugin-owned transitions.

## Validation Planning

The workflow should distinguish planned validation from executed validation:

- `validationPlan` lists commands that should be run and why.
- `validationResults` records commands actually run, exit status, duration if available, and compact summary.
- Long raw output should be stored only when an explicit evidence output directory is provided.

This reduces repeated validation during exploration while preserving a clear final gate.

## Reviewer Planning

Reviewer planning should be rule-based and evidence-backed. It should inspect task type, changed files, scope, and OpenSpec artifacts, then output reviewers as `required`, `skip-reason-needed`, or `not-applicable`.

Reviewer planning must not claim a review passed. It only prepares the gate list for the main agent.

## Report Rendering

Markdown rendering should be deterministic and section-based:

- Turn/tool smoke evidence.
- Scenario matrix.
- Findings with evidence id, impact, recommendation, confidence, and validation path.
- Follow-up changes.
- Validation results.
- Reviewer gates.
- Residual risks.
- Ready-to-land status.

The renderer should preserve user-authored sections when possible or write to a separate generated block with stable markers.

## Privacy And Safety

- Redact absolute paths by default unless `--show-paths` is explicitly provided.
- Never read `.env`, secret files, credential stores, or provider tokens.
- Never write `.autopilot/**` or `openspec/changes/*/automation/**` from the CLI unless it is executing as plugin-owned code with explicit ownership.
- Do not run remote-state commands.

## Test Strategy

- Test stable JSON output for fixture repositories.
- Test redaction and no-secret-file traversal.
- Test validation planning without executing commands.
- Test validation result summarization with fake command outputs.
- Test reviewer routing for feature, bugfix, docs/typo, research, tooling/config, performance, and protocol tasks.
- Test Markdown renderer with snapshot-like deterministic fixtures.
