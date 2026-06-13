# Design: OpenSpec Autopilot Contract Gates

## Retro Status Command

Add `tools/openspec-retro-status.ts` or extend existing retro helpers with a read-only status command.

Command:

```sh
npm run openspec:retro-status -- <change-id> --format json
```

Stable output:

```json
{
  "schemaVersion": 1,
  "changeId": "<change-id>",
  "state": "archive-ready",
  "blockers": [],
  "warnings": [],
  "nextActions": [],
  "requiredMutations": [],
  "followUps": []
}
```

Allowed states:

- `missing-tasks`
- `missing-retro`
- `retro-invalid`
- `followups-required`
- `followups-stale`
- `approved-skip`
- `archive-ready`
- `blocked`

The command reuses `openspec-retro-gate` parsing and `openspec-retro-followups` follow-up id logic. It does not write files.

## Legacy Retrospective Markdown Handling

Validation should distinguish canonical OpenSpec Markdown from automation-wrapper Markdown:

- Allowed canonical docs: `proposal.md`, `design.md`, `tasks.md`, `traceability.md`, `specs/**/spec.md`, and explicitly human-facing reports when not used as automation gate source.
- Disallowed automation wrappers: active `openspec/changes/<change-id>/retrospective.md` once JSON retro policy is available for that change.
- Migration path: parse legacy retrospective where supported, write `automation/retro.json` only through explicit migration mode, then update task evidence references and gate status.

Initial implementation may warn for archived legacy files and fail for active/new legacy wrappers, but the policy must be explicit and fixture-tested before enforcement.

## Autopilot Docs Check

Add `tools/autopilot-docs-check.ts` or extend `tools/test-autopilot-instruction-drift.ts` to check marked contract fragments.

Source contracts:

- Public Autopilot tool names.
- `reasonCode` values.
- Task statuses.
- Task types.
- Trigger modes.
- Protected path patterns.
- Output schema keys that are finite and stable.

Generated fragments use stable sorted tables between markers such as:

```md
<!-- autopilot-contract:reason-codes:start -->
...
<!-- autopilot-contract:reason-codes:end -->
```

The check compares exact generated text. It does not inspect or rewrite surrounding human prose unless `--write` is explicitly supplied and tested.

## Skill And README Simplification

After helpers exist:

- `openspec-archive-change`, `openspec-apply-change`, `openspec-autopilot`, and README retro sections should reference `openspec:retro-status`, `openspec:retro-followups`, and `openspec:retro-gate` rather than repeating every state condition.
- `openspec-autopilot` should keep routing and interpretation guidance but rely on checked compact contract fragments for finite enums.

## Risks

- Archived legacy retros may block validation unexpectedly. Mitigation: define active vs archive enforcement before hard fail.
- Generated Autopilot fragments may bloat skill context. Mitigation: generate compact tables only.
- Retro-status may duplicate retro-gate logic. Mitigation: factor shared parser/status helpers.
