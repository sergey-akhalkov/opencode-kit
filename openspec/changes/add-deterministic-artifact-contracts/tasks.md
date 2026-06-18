# Tasks: Add Deterministic Artifact Contracts

## Tests First: Tool Contract Manifest

- [ ] Add fixture tests for a valid `tool-contracts.json` and matching `package.json` scripts.
- [ ] Add negative tests for missing scripts, wrong commands, missing README anchors, missing required tests, unsupported manifest fields, and unstable output ordering.
- [ ] Add tests proving mutability values are accepted only from `read-only`, `writes-approved`, and `mutating`.

## Tests First: Instruction Manifest And Catalogs

- [ ] Add fixture tests for skill, agent, instruction template, profile, README catalog, and routing map exact-set matching.
- [ ] Add negative tests for missing README catalog entries, stale README references, duplicate artifact names, profile references to missing artifacts, and generated block drift.
- [ ] Add tests for stable JSON and Markdown output ordering.
- [ ] Add exact duplicate block tests with file/line occurrences and no fuzzy matching.

## Tests First: Reviewer Contracts

- [ ] Add fixture tests for a valid reviewer agent matching the leaf contract.
- [ ] Add negative tests for missing denied permissions, `mode` mismatch, missing required output sections, and malformed frontmatter.
- [ ] Add negative tests where required reviewer-contract phrases appear only in examples, disclaimers, or unrelated sections.
- [ ] Add tests proving declared domain-specific output sections are allowed without weakening the common contract.

## Tests First: Porting Anchors

- [ ] Add fixture tests for forbidden substrings and regex matches in reusable artifacts.
- [ ] Add tests for placeholder allowlist handling.
- [ ] Add negative tests for suppressions without `reason`, broad suppressions without `path`, and invalid regex entries.

## Implementation

- [ ] Add `tools/tool-contracts.json` and `tools/tooling-contract.ts`.
- [ ] Replace hardcoded package script contract checks in `tools/validate-library.ts` and `tools/test-library-validation-scripts.ts` with the shared tool contract helper.
- [ ] Add `tools/instruction-manifest.ts` or extend `tools/instruction-artifacts-inventory.ts` with manifest/check modes.
- [ ] Add exact duplicate block reporting to instruction inventory output.
- [ ] Add `tools/reviewer-contract-check.ts` and optional reviewer contract manifest support.
- [ ] Split contract validation/test modules from `tools/validate-library.ts` and `tools/test-library.ts`, or add an explicit split-justify with navigation boundaries.
- [ ] Add `porting-anchors.json` support to validation.
- [ ] Wire new read-only checks into `npm run validate`.
- [ ] Expose new package scripts for contract checks and inventory where needed.

## Documentation And Artifact Updates

- [ ] Update `README.md` Validate, Token Economy, Skill Catalog, Agent Catalog, and Curation Rules sections to reference the new deterministic contracts.
- [ ] Update `instructions/instruction-artifact-audit-runbook.md` to start broad audits from the audit evidence bundle.
- [ ] Update `instructions/leaf-reviewer-agent-contract.md` to describe the verifier as the enforcement source.
- [ ] Update `instructions/porting-checklist.md` to use `porting-anchors.json` instead of only ad hoc `--forbidden-anchor` flags.
- [ ] Update `instruction-artifact-tuning` and `instruction-artifact-reviewer` guidance after validators exist.

## Review Gates

- [ ] Run `instruction-artifact-reviewer` on updated skills, agents, README, and instruction templates.
- [ ] Run `code-quality-reviewer` on new tooling and validator integration.
- [ ] Run `test-coverage-reviewer` for fixture coverage of all contract failure modes.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run openspec:validate`
- [ ] `npm run instruction:inventory -- --format json`
- [ ] Run each new contract/check command in JSON mode.

## Retrospective Before Archive

- [ ] Review the completed change context, validation, reviewer gates, blockers, repeated work, wait time, token-heavy steps, and likely root causes.
- [ ] Write `openspec/changes/add-deterministic-artifact-contracts/retro.md` with evidence, problems, root causes, improvements, follow-up ids, and archive gate decision.
- [ ] Run `npm run openspec:retro-followups -- add-deterministic-artifact-contracts` when available so actionable retrospective findings create or update follow-up OpenSpec changes before archive.
- [ ] If the helper is unavailable, manually create or update project-local OpenSpec follow-up changes for project-local findings; for reusable `opencode-dev-kit` findings, write only when the current repository owns the reusable artifact and current write scope includes it, otherwise record a local handoff and do not write cross-repo without explicit approval.
- [ ] Confirm archive is allowed only after the retro gate passes or an approved skip reason is recorded in `retro.md`.
