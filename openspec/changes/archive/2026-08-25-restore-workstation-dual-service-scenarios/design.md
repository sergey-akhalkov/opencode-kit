## Context

See `proposal.md` for motivation. The official archive of `fix-workstation-restart-reliability` merged complete parent SHALL clauses but several scenario rows came from an older single-server delta. OpenSpec `MODIFIED` replaces the complete requirement block, so the correction must use another full delta and the official archive path rather than a direct base-spec edit.

The current fidelity rung is the post-archive base-spec diff. The next real boundary is strict validation of a complete corrective delta, followed by deterministic archive with project validation. This is local documentation mutation only: no runtime authorization, process control, credential access, restoration, or cleanup is needed.

## Goals / Non-Goals

**Goals:**

- Make every affected scenario use the dual-service boundary already required by its parent SHALL.
- Preserve all scenarios added by the archived reliability change.
- Merge through the canonical OpenSpec helper with green pre/post validation.

**Non-Goals:**

- Change production or installed behavior.
- Add a new workstation requirement or proof obligation.
- Rerun lifecycle proof, SDET, or installed validation.

## Decisions

### Decision 1: Use complete MODIFIED requirement blocks

Copy each affected current requirement in full and edit only the inconsistent scenario rows. This prevents another official merge from dropping scenarios or accepted Graphify semantics.

Alternative rejected: add isolated duplicate scenarios. Duplicate names would leave the contradictory originals active. Alternative rejected: edit the main spec directly. That bypasses the deterministic archive contract and loses traceability.

### Decision 2: Reuse existing proof and validation

This correction changes no executable behavior. Strict OpenSpec validation, project-native `npm test`, and exact post-merge source inspection are sufficient; prior runtime and SDET evidence remain attributed only to the archived candidate.

## Risks / Trade-offs

- **[Risk] A partial delta repeats semantic loss** → Include all three complete requirement blocks and validate before archive.
- **[Risk] Wording accidentally expands behavior** → Restrict edits to dual-service terms already present in parent SHALL clauses and previously accepted base scenarios.
- **[Risk] Direct repair loses traceability** → Use one dedicated corrective change and canonical archive helper.

## Migration Plan

1. Strictly validate proposal, complete delta, design, and one task.
2. Mark the spec-only task complete after exact comparison and project validation.
3. Archive through `global/bin/openspec-archive.ts` with `npm test` before and after merge.
4. Confirm no active corrective change remains and strict validation of all specs passes.

Rollback is the reviewable uncommitted OpenSpec archive/base-spec diff; no runtime rollback applies.
