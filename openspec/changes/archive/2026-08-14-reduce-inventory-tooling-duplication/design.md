## Context

The instruction inventory's private Markdown walker is behaviorally equivalent to
`walkMarkdownFiles` in `tools/validators/context.ts`: both sort directory entries,
ignore `.git` and `node_modules`, and collect Markdown files. The focused
code-quality inventory test also owns private temp-file, process-capture, line, and
assertion helpers already provided by `tools/test-helpers/library.ts`.

The inventory CLIs themselves are intentionally separate and have different ignore
and output contracts. This change removes only the two proven duplicates.

## Goals / Non-Goals

**Goals:**

- Reuse the exact existing matching production walker.
- Reuse the shared test harness without removing unique test cases.
- Preserve observable CLI behavior and JSON contracts.
- Reduce local lines/concepts without adding a new abstraction.

**Non-Goals:**

- Merge inventory CLIs or normalize their ignore policies.
- Change loader-visible inventory behavior planned by another change.
- Remove scripts, flags, JSON fields, or focused test scenarios.
- Refactor unrelated large test files.

## Decisions

### 1. Import the validator-owned Markdown walker directly

`instruction-artifacts-inventory.ts` imports `walkMarkdownFiles` from
`tools/validators/context.ts` and deletes its private recursive walker. The shared
function already has the exact required behavior and is import-safe.

Alternative: create a new generic filesystem module. Rejected because it adds an
owner while an exact maintained owner already exists.

### 2. Extend the existing test helper only at the command boundary

`tools/test-code-quality-inventory.ts` imports `newTempDir`, `writeText`, `lines`,
process capture, and assertions from `tools/test-helpers/library.ts`. If readability
requires it, one minimal `invokeCodeQualityInventory` helper is added beside the
existing project/instruction inventory invocation helpers. All four focused cases
remain in the test owner.

Alternative: import another inventory CLI. Rejected because sibling CLIs have
top-level main behavior and do not own reusable test execution.

### 3. Prove behavior before relying on line reduction

Current fidelity rung: source comparison and independent reduction review.

Next real boundary: run the installed instruction inventory before and after the
change over the same repository and run the focused code-quality inventory test
through its package entry point. Compare normalized outputs, exits, and fixture
cleanup before complete validation.

Authorization: local read-only inventory and proof-owned temp files. Safeguards:
no provider, external repo mutation, install, activation, or remote action.
Restoration/cleanup removes temp fixtures and preserves command evidence.

### 4. Serialize before loader-visible inventory work

`measure-loader-visible-instruction-budget` intentionally touches the instruction
inventory after this reduction. Implement and validate this change first, or
rebase its two-concept reduction into that candidate before any proof. Concurrent
writers to the shared file are not allowed.

## Risks / Trade-offs

- [Subtle walker mismatch] -> compare exact ordered artifact output and run existing
  inventory fixtures before accepting the reduction.
- [Shared test helper has side behavior] -> use the existing library helper whose
  agent-profile synchronization applies only to `global/agents/*.md` fixtures and
  verify fixture contents/exits remain unchanged.
- [Concurrent planned change overlaps the file] -> serialize and invalidate later
  proof if the shared production file changes.
- [Line reduction drives behavior change] -> retain all unique oracles and stop on
  any output, ignore, argv, exit, or cleanup drift.

## Migration Plan

1. Capture baseline instruction inventory and focused test results.
2. Replace the walker and prove normalized inventory identity.
3. Replace the private test harness and rerun all focused cases.
4. Run complete validation and optional reduction readback.

Rollback restores only the two private helper blocks. No data or external state is
migrated.

## Open Questions

None.
