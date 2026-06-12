# Traceability: Add Autopilot Prompt Intake Routing

## Source Evidence

| Evidence | Finding |
| --- | --- |
| `.opencode/skills/openspec-autopilot/SKILL.md` First Action | Documents only `changeId` and `taskId` scope arguments before `autopilot_run_next`. |
| `opencode.json` `command.autopilot.template` | Embeds `$ARGUMENTS` and asks the agent to map non-empty arguments to scope, but does not define the free-form prompt fallback. |
| `.opencode/plugins/openspec-autopilot.ts` | Public `autopilot_run_next` schema accepts `changeId` and `taskId`, not prompt-intake fields. |
| `tools/openspec-autopilot-active-change-queue.ts` | Active-change fallback is exact `changeId` plus checklist state; it intentionally does not infer task intent from prompt text. |
| `tools/autopilot-contract.ts` | Task families exist for ledger-backed gates, but no deterministic prompt-to-ledger intake flow exists. |

## Requirement To Task Map

| Requirement | Primary Tasks | Test Evidence | Validation |
| --- | --- | --- | --- |
| Command Arguments Are Resolved Before Autopilot Advancement | Tests First 1-3; Implementation 1-3 | Scope resolver and no-unrelated-advance tests | `npm test`, `npm run validate` |
| Free-Form Autopilot Prompts Have Safe Handoffs | Tests First 3-4; Implementation 3-5; Documentation 1-3 | Prompt family and queue-separation tests | `npm test`, instruction reviewer |
| Prompt Type Classification Is Conservative | Tests First 4; Implementation 4, 6 | Task-family routing tests | `npm test`, test-coverage reviewer |
| Prompt Intake Surfaces Stay Synchronized | Tests First 5; Documentation 1-4 | Instruction drift tests | `npm run validate`, `npm test` |

## Scenario Coverage Inventory

| Scenario Family | Covered Today | Change Coverage |
| --- | --- | --- |
| Empty explicit `/autopilot` | Yes | Preserve existing behavior |
| Existing ledger by exact scope | Yes | Preserve exact `taskId`/`changeId` behavior |
| Existing active change by exact scope | Yes | Preserve `active_change_handoff` |
| No ledgers and no active changes with no prompt | Yes | Preserve `no_ledgers` escape hatch |
| No ledgers and no active changes with bug/feature/research prompt | No | Add prompt handoff to explore/propose/direct workflow |
| Existing unrelated queue plus free-form prompt | No | Separate queue state from unscheduled prompt |
| Ambiguous scope text | Partial/no | Add explicit blocker/options flow |
| Active-context `работай` | Yes when context exists | Preserve eligibility boundary |

## Out Of Scope

- Plugin-owned ledger bootstrap from free-form prompts.
- Protected Autopilot file mutation.
- Fuzzy matching between prompts and changes.
- Remote MR/provider actions, commits, pushes, merges, deploys, or secret inspection.
