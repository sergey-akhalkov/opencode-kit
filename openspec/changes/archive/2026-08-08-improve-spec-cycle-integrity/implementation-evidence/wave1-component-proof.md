# Wave 1 Component Proof

## Candidate Reference

- Product Candidate: current working-tree content of `openspec/config.yaml`, `.opencode/commands/opsx-{propose,apply,archive}.md`, `.opencode/skills/openspec-{propose,apply-change,archive-change}/SKILL.md`, and `tools/openspec-operation-gate.ts`.
- Change: `improve-spec-cycle-integrity`.
- Session identity: unknown; `OPENCODE_SESSION_ID` was not available to the shell.
- Development stage for the prompt-path outcome: `development`.

## Environment Identity

- OS: Windows.
- Node: `24.18.0`.
- OpenSpec: `1.6.0`.
- Repository root: redacted by command helpers in shared output.
- External model/provider calls: not performed.

## Proof Runner And Observations

### Spec Capsule injection

- Invocation: `npx openspec instructions proposal --change improve-spec-cycle-integrity --json`
- Exit: `0`.
- Representative observation: output contained the configured project `context` with all seven Spec Capsule fields and the three proposal-specific `rules`.
- Side effects: none.

### Propose operation gate

- Invocation: `npm run openspec:gate -- --operation propose --change improve-spec-cycle-integrity`
- Exit: `0`.
- Representative observation: `artifact:proposal-capsule` passed and reported every required current-increment field present.
- Side effects: none.

### Apply operation gate

- Invocation: `npm run openspec:gate -- --operation apply --change improve-spec-cycle-integrity`
- Exit: `0`.
- Representative observation: proposal, capsule, spec delta, tasks, and change-scope checks passed; task summary reported `30/32` unchecked tasks without treating incompleteness as an apply blocker.
- Side effects: none.

### Complete archive fail-closed boundary

- Invocation: `npm run openspec:gate -- --operation archive --change improve-spec-cycle-integrity`
- Exit: `1` (expected).
- Representative observation: blocking check `archive:tasks-incomplete` reported `Complete archive is blocked by 30 unchecked task(s).`
- Side effects: no archive move and no spec synchronization.

## Validation

- `npx openspec validate improve-spec-cycle-integrity --strict`: exit `0`.
- `npx openspec validate --all`: exit `0`, eight items passed.
- `npm run validate:strict`: exit `0`, `warnings=0`, `infos=2`.
- `node tools/test-openspec-operation-gate.ts`: exit `1`; six cases passed and two legacy ready-proposal fixtures failed because they omit the newly required Outcome Capsule. The production gate behaved according to the new requirement. Test fixtures remain unchanged because Material production authorship does not own automated test artifacts.

## Evidence Limits

- Structural prompt mirror presence was confirmed by targeted search, but a model did not execute `/opsx-propose`, `/opsx-apply`, or `/opsx-archive` on the candidate.
- Prompt-behavior equivalence and benefit require an owner-authorized same-model disposable baseline/candidate workflow because the available preferred models are remote and may incur external cost.
- The distinct incomplete/abandoned preservation flow, required sync evidence, and applicable validation evidence are not implemented yet.

These limits describe the initial Wave 1 capture. Later same-model and localhost evidence is recorded in the other files under `implementation-evidence/`; it supersedes the resolved limits without changing the raw observations above.
