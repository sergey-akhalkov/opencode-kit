## Why

The Universal Development Loop, the reviewer agent contract, the `complain` skill feedback template, and the project bootstrap feedback README are duplicated across 3-4 surfaces in the kit. `instruction:inventory --format markdown` shows the prevention-feedback block appearing 14 times identically across reviewer agents, and the Universal Development Loop is restated in `docs/universal-development-loop.md`, `instructions/universal-development-loop.md`, `instructions/reusable-project-agent-instructions.md`, and `templates/project/AGENTS.md`. Edits to the contract drift silently because the validator only checks token presence, not canonical source.

## What Changes

- Reduce the Universal Development Loop to one canonical file: `instructions/universal-development-loop.md`. Replace every other copy with a one-line `## Universal Development Loop` heading that points to the canonical file plus a short "what changes here" note.
- Reduce the reviewer agent contract (Leaf Contract, Feedback Ledger, Prevention Feedback, Output Schema, Severity Scale) to a `## Contract Reference` heading that points to `instructions/leaf-reviewer-agent-contract.md`. Replace the inline blocks in each `global/agents/*.md`.
- Make `templates/project/docs/feedbacks/README.md` a generated artifact: `init-project.ts` reads `docs/feedbacks/README.md` (kit-level) and copies it into the target project. Delete the divergent abbreviated template version.
- Tighten `tools/validate-library.ts` to:
  - Reject any other instruction artifact that restates the loop step list outside the canonical file.
  - Reject any reviewer agent that contains the full Leaf Contract / Feedback Ledger / Prevention Feedback block instead of a reference.
- Rename the kit's repository-level `AGENTS.md` to `REPO_AGENTS.md` (or move its unique content to `docs/curation.md` and keep `AGENTS.md` only for the runtime instructions shipped through `global/`).
- Update `README.md` Routing Map to mention "see canonical UDL" instead of restating steps.

## Capabilities

### New Capabilities

- `library-instruction-artifacts`: defines canonical sources for the Universal Development Loop, the reviewer agent contract, the complain feedback template, and the project feedback README, plus the validator rules that enforce reference-only duplication.

## Impact

- `docs/universal-development-loop.md` becomes a 5-line pointer to `instructions/universal-development-loop.md`.
- `templates/project/AGENTS.md` becomes a 10-15 line template that references the canonical UDL.
- `instructions/reusable-project-agent-instructions.md` keeps its full text but drops the inline restatement of the loop (replace with reference).
- Each `global/agents/*.md` loses the 14-30 line inline contract block and gains a `## Contract Reference` section.
- `templates/project/docs/feedbacks/README.md` is removed; `tools/init-project.ts` copies the kit-level README instead.
- `tools/validate-library.ts` gains two new error rules and corresponding tests in `tools/test-library.ts`.
- README, `instructions/porting-checklist.md`, and `openspec/project.md` need minor wording updates to point at the canonical source.