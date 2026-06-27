## 1. Universal Development Loop canonicalization

- [ ] 1.1 Replace `docs/universal-development-loop.md` body with a pointer paragraph to `instructions/universal-development-loop.md`.
- [ ] 1.2 Replace the inline loop list in `templates/project/AGENTS.md` with a pointer paragraph to `instructions/universal-development-loop.md`.
- [ ] 1.3 Replace the inline loop list in `instructions/reusable-project-agent-instructions.md` with a pointer paragraph.
- [ ] 1.4 Update `README.md` so the "Universal Development Loop" subsection points to the canonical file.
- [ ] 1.5 Update `docs/quality-gates.md` and `docs/getting-started.md` to reference the canonical file rather than restating steps.

## 2. Reviewer agent contract reference

- [ ] 2.1 Convert `global/agents/code-quality-reviewer.md` to reference form; preserve its role-specific `## Checks` and `## Severity Scale`.
- [ ] 2.2 Convert `global/agents/deployment-config-reviewer.md`.
- [ ] 2.3 Convert `global/agents/implementation-readiness-reviewer.md`.
- [ ] 2.4 Convert `global/agents/instruction-artifact-reviewer.md`.
- [ ] 2.5 Convert `global/agents/legacy-client-compatibility-reviewer.md`.
- [ ] 2.6 Convert `global/agents/legacy-evidence-reviewer.md`.
- [ ] 2.7 Convert `global/agents/openspec-architecture-reviewer.md`.
- [ ] 2.8 Convert `global/agents/performance-reliability-reviewer.md`.
- [ ] 2.9 Convert `global/agents/protocol-api-reviewer.md`.
- [ ] 2.10 Convert `global/agents/rust-concurrency-reviewer.md`.
- [ ] 2.11 Convert `global/agents/test-coverage-reviewer.md`.
- [ ] 2.12 Convert `global/agents/wire-protocol-reviewer.md`.
- [ ] 2.13 Convert `global/agents/session-delivery-reviewer.md` (preserves its Adaptive Control Model and Session Delivery Context Bootstrap sections).
- [ ] 2.14 Convert `global/agents/qwen-local-worker.md` (read-only local worker; preserves its Evidence Contract).
- [ ] 2.15 Confirm `global/agents/implementation-worker.md` is NOT converted (it is a write-capable worker with a distinct contract; it keeps its inline body).

## 3. Feedback README unification

- [ ] 3.1 Update `tools/init-project.ts` so `plannedFiles` reads from `<repoRoot>/docs/feedbacks/README.md` instead of `templates/project/docs/feedbacks/README.md`.
- [ ] 3.2 Delete `templates/project/docs/feedbacks/README.md`.
- [ ] 3.3 If `templates/project/docs/feedbacks/` is empty after deletion, delete the directory.
- [ ] 3.4 Update `tools/test-library.ts` (or its `node --test` successor) so the fixture bootstrap creates the file via the same path the new init-project logic uses.

## 4. Repository-level instructions rename

- [ ] 4.1 Move `AGENTS.md` to `REPO_AGENTS.md` and update the file header to reflect the new name.
- [ ] 4.2 Update every cross-reference to `AGENTS.md` in `README.md`, `docs/`, `tools/`, and `openspec/project.md`.
- [ ] 4.3 Confirm the validator rule `validateAgentsMd` (currently targeting `AGENTS.md`) is updated to target `REPO_AGENTS.md`.
- [ ] 4.4 Run `npm run validate:strict` after the rename; it MUST pass.

## 5. Validator rule additions

- [ ] 5.1 In `tools/validators/devkit-contract.ts` (or current validator location), add a rule that fails when the Universal Development Loop step list appears outside `instructions/universal-development-loop.md`. The rule SHALL scan markdown files and reject any file containing the canonical step tokens in a numbered list form.
- [ ] 5.2 In `tools/validators/agents.ts`, add a rule that fails when a reviewer agent contains both `## Leaf Contract` and the shared contract body text. The rule SHALL pass if the agent contains only `## Contract Reference`.
- [ ] 5.3 Add regression tests for both rules.
- [ ] 5.4 Confirm `npm run validate:strict` still passes after the rules ship.

## 6. Validation and archive readiness

- [ ] 6.1 Run `npm run validate:strict`; confirm zero errors and zero warnings.
- [ ] 6.2 Run `npm test`; confirm all suites pass and total test count is >= pre-change total.
- [ ] 6.3 Run `npm run instruction:inventory`; confirm `Repeated Lines` table no longer lists the prevention-feedback block or the loop step list (or lists them only as the canonical source).
- [ ] 6.4 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F10, F11, F12, F24, F25, and D01-D03 as resolved.
- [ ] 6.5 Update `README.md` Routing Map if it referenced any duplicated contract text.