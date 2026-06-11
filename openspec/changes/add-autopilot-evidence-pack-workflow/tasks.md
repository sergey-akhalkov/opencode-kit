# Tasks: Add Autopilot Evidence Pack Workflow

## Tests First

- [ ] Add fixture tests for evidence-pack JSON shape and stable ordering.
- [ ] Add tests for collect mode proving no protected-path writes occur.
- [ ] Add tests for validation planning without command execution.
- [ ] Add tests for validation result summarization with fake command outputs.
- [ ] Add tests for reviewer planning across task types and changed-file signals.
- [ ] Add tests for deterministic Markdown report rendering.
- [ ] Add redaction tests for absolute paths and secret-like inputs.

## Implementation

- [ ] Add a TypeScript evidence-pack library module.
- [ ] Add a CLI entrypoint and `package.json` script after tests define the contract.
- [ ] Implement ledger discovery and validator summary collection.
- [ ] Implement validation plan generation.
- [ ] Implement optional validation execution with compact summaries.
- [ ] Implement reviewer plan generation from deterministic signals.
- [ ] Implement report rendering to an explicit approved path.
- [ ] Keep raw output storage outside protected Autopilot paths unless plugin-owned.

## Documentation And Review

- [ ] Document command shape in README only after implementation is stable.
- [ ] Update Autopilot regression prompt/report workflow if this replaces manual steps.
- [ ] Run `test-coverage-reviewer` for evidence-pack tests.
- [ ] Run `code-quality-reviewer` for non-trivial automation code.
- [ ] Run `instruction-artifact-reviewer` if skills, commands, README, or prompts change.

## Validation

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run autopilot:validate -- <task-ledger.json>`
- [ ] `openspec validate --all`
