# Runtime Proof

## Product Candidate

- Loaded global policy, compaction prompt, canonical propose/apply/archive workflows, workflow documentation, and current normative specs listed in task 2.1.
- Candidate source object hashes in task-file order:
  - `global/AGENTS.md`: `99388032b38d2cf9340f3b1c2e25fecd5655c060`
  - `global/opencode.json.template`: `d08f19898e9a102f59f260c3a9476fcda7463124`
  - `global/skills/change-ready-sdlc/SKILL.md`: `3c76ad113d60d00dac3dadc1827e0d41370cb940`
  - `global/skills/openspec-apply-change/SKILL.md`: `01e6c188546d0623e96900282e85e6d9b1a1bc4a`
  - `global/commands/opsx-apply.md`: `b8d46cddeb1546824b46481ebc2299ea150499cd`
  - `global/skills/openspec-archive-change/SKILL.md`: `8ca45f6336cc272bd27282576917cbabf4d30602`
  - `global/commands/opsx-archive.md`: `f5cd70c1cfbbd212ca7a05f13834a1eded816f49`
  - `global/skills/openspec-propose/SKILL.md`: `7b71ce718bc5c10526b12a363979e9b8b9a23808`
  - `global/commands/opsx-propose.md`: `d79f76bdb08dfacd51dc7bd48b91fd1cb763f3ae`
  - `docs/workflows/session-reflection.md`: `eb8f99f20280dc29cf83a5ef9fc16f04c37584bd`
  - `openspec/project.md`: `f1835d238b5678f0e8f8cba1c7ba5b0b30b92669`
  - current normative instruction/workflow/SDLC specs: `c112af2224625090de273350e06af4e597497ce2`, `8ad80008e91e11ec660aca141ead6ffbe93e5f88`, `044aa1c5c089c8ca54bf55f35f0a2e422eb92115`
- Active machine-local `global/opencode.json` SHA-256: `544d4aa9617b429b507bfe265dc72e5c68de6b8e75b0c4f9c0c34a6161f81b6d`.

## Environment Identity

- Repository: `D:\sa-gh\opencode-kit`.
- OpenCode: `1.18.18`.
- Loaded route: `compaction · grok-4.6`, variant `high`.
- `opencode debug agent compaction` read back the candidate prompt with all six classification fields, `Pending Improvement Tasks`, `Deferred Improvement Candidates`, safety-first ordering, and non-blocking deferred semantics.
- Runtime-source diagnostics resolved canonical propose/apply/archive skills and commands under `global/`; unrelated config-source collisions remain visible and were not edited.

## Baseline Lane

- Invocation: `opencode run --agent compaction --format default <synthetic alpha continuation>`.
- Representative input: incomplete alpha tasks 4.2/5.1/6.1; three repeated manual failed-command extractions; an existing validation JSON/helper consumed by alpha 4.2/5.1, beta 3.2, and pre-push; an unsupported generic dashboard; clear live-attempt gate and no owner blocker.
- Exit: `0`.
- Observation: baseline preserved one parser improvement, placed it before 4.2, named the additional consumers without mutating them, and rejected the dashboard. It did not provide a required stable record for all six classification fields.
- Side effects: one configured non-sensitive model inference; no tool call, file mutation, remote action, credential use, or protected effect.

## Candidate Current-Consumer Lane

- Invocation and representative input: identical to the baseline lane in a fresh process after the active prompt changed.
- Exit: `0`.
- Observation:
  - Emitted all six fields: `Impact Horizon`, `Concrete Consumers`, `Execution Class`, `Earliest Safe Point`, `Invalidated Evidence`, and `Observable Payback`.
  - Classified the parser as `Impact Horizon: Working Repository` and `Execution Class: before-task-4.2`.
  - Named alpha 4.2/5.1 as current consumers and beta 3.2/pre-push as exact additional consumers that alpha must not implement.
  - Required persistence before substantial work and execution before task 4.2, then 5.1, then freeze 6.1.
  - Emitted no deferred record for the unsupported dashboard and did not allow it to block alpha.
- Side effects: one configured non-sensitive model inference; no tool call, file mutation, remote action, credential use, or protected effect.

## Candidate Deferred Lane

- Invocation: `opencode run --agent compaction --format default <synthetic gamma continuation>`.
- Representative input: incomplete gamma parser correction/proof/freeze; two observed manual reconstructions of a compact handoff report; a local formatter extension with no remaining gamma or repository-workflow consumer; an unsupported generic telemetry dashboard; clear live-attempt gate and no owner blocker.
- Exit: `0`.
- Observation:
  - Emitted no admitted checkbox task.
  - Emitted the formatter as a non-checkbox `Deferred Improvement Candidate` with `Impact Horizon: Working Repository`, `Execution Class: separate-change`, no current consumers, a re-evaluation condition, and non-blocking completion semantics.
  - Rejected the unsupported telemetry dashboard with neither task nor deferred record.
  - Kept gamma completion dependent only on original tasks 2.2, 3.1, and 4.1.
- Side effects: one configured non-sensitive model inference; no tool call, file mutation, remote action, credential use, or protected effect.

## Current Candidate Refresh - 2026-08-14

`add-unattended-roadmap-orchestration` archived after completing its test and fixture migration. Its integrated policy/spec synchronization changed `global/AGENTS.md`, `library-instruction-artifacts`, and `library-spec-workflow-integrity` after the original proof. The active/template compaction prompt, canonical apply/archive/propose surfaces, workflow documentation, SDLC skill/spec, and active machine-local prompt retained their recorded identities. The affected loaded-compaction lanes were therefore replayed before qualification.

### Current-Consumer Input And Output

- Invocation: `opencode run --agent compaction --format default <input below>`.
- Exact input:

```text
Compact this synthetic continuation into the required durable continuation summary. Do not use tools or mutate files. Original User Goal: finish OpenSpec change alpha safely. Goal Status: incomplete. Live-Attempt Gate: clear. Owner blocker: none. Remaining alpha tasks: 4.2 consumes normalized validation facts; 5.1 reuses those facts; 6.1 freezes the candidate. Observed session evidence: the same failed-command status, stdout, stderr, and artifact paths were manually extracted three times. An existing validation JSON/helper owner can be extended once and is consumed by alpha tasks 4.2 and 5.1; exact additional working-repository consumers are beta task 3.2 and prepush:validate, but alpha must not mutate those consumers. The smallest cheap improvement is to extend the existing parser before alpha task 4.2. A generic dashboard was suggested without observed evidence or a current consumer. Produce the mandatory Session Reflection, Live-Attempt Gate, six-cell Quality/Cycle Speed/Token Economy by Working Repository/opencode-kit matrix, complete classification fields for every evidence-backed candidate, Pending Improvement Tasks and Deferred Improvement Candidates as applicable, and Next-Session Action. Preserve all valid candidates, schedule current work before its first consumer, do not invent consumers, timing, savings, recurrence, or root cause, and do not admit the unsupported dashboard.
```

- Environment: fresh installed OpenCode 1.18.18 process; `compaction · grok-4.6`.
- Exit: `0`; stderr: none observed.
- Stdout facts: emitted the six-cell matrix and all six classification fields; classified the existing parser extension as `Impact Horizon: Working Repository`, `Execution Class: before-task-4.2`; named alpha 4.2/5.1 plus beta 3.2 and `prepush:validate`; explicitly prohibited mutation of the additional consumers; rejected the unsupported dashboard; kept the live-attempt gate first and clear.
- Side effects: one configured non-sensitive inference; no tool call, repository mutation, remote action, credential use, or protected effect.

### Deferred Input And Output

- Invocation: `opencode run --agent compaction --format default <input below>`.
- Exact input:

```text
Compact this synthetic continuation into the required durable continuation summary. Do not use tools or mutate files. Original User Goal: finish OpenSpec change gamma safely. Goal Status: incomplete. Live-Attempt Gate: clear. Owner blocker: none. Remaining gamma tasks: 2.2 correct the existing parser; 3.1 prove parser behavior; 4.1 freeze the candidate. Observed session evidence: a compact handoff report was manually reconstructed twice. An existing local formatter could remove that repeated reconstruction, but no remaining gamma task and no evidenced repository workflow consumes the formatter. The formatter is local, reversible, and low-cost, but has no exact current consumer. A generic telemetry dashboard was suggested without observed evidence. Produce the mandatory Session Reflection, Live-Attempt Gate, six-cell Quality/Cycle Speed/Token Economy by Working Repository/opencode-kit matrix, complete classification fields for every evidence-backed candidate, Pending Improvement Tasks and Deferred Improvement Candidates as applicable, and Next-Session Action. Preserve the no-current-consumer formatter as non-blocking deferred evidence with an exact re-evaluation condition, create no admitted checkbox task for it, do not invent consumers, timing, savings, recurrence, or root cause, and do not record the unsupported dashboard.
```

- Environment: fresh installed OpenCode 1.18.18 process; `compaction · grok-4.6`.
- Exit: `0`; stderr: none observed.
- Stdout facts: emitted the six-cell matrix and all six classification fields; emitted no pending improvement task; preserved the formatter as a non-checkbox deferred record with `Impact Horizon: Working Repository`, `Concrete Consumers: none evidenced`, `Execution Class: separate-change`, and an exact re-evaluation condition; kept gamma task 2.2 as the next product action; rejected the unsupported telemetry dashboard.
- Side effects: one configured non-sensitive inference; no tool call, repository mutation, remote action, credential use, or protected effect.

## Evaluator Verdict

- Original goal and safety ordering preserved in both candidate lanes.
- Current-consumer work executes before its first consumer.
- Same-repository multiplier requires and names concrete current/additional consumers without expanding mutation scope.
- Evidence-backed no-current-consumer work is durable but non-blocking.
- Unsupported generic work creates no record.
- Candidate Runtime Proof: green; `Development-Stage: MVP` pending accepted-scope completion and Material qualification.

## Static Diagnostics

- Both active/template config files parsed as JSON and contained every required prompt marker.
- `openspec validate prioritize-session-improvements --strict`: exit `0`.
- Apply operation gate: exit `0`.
- Existing focused contracts reached three known `ENOENT` failures for removed `.opencode/skills/openspec-*` paths. This exact blocker predates this change and is owned by `add-unattended-roadmap-orchestration` task I1; this change did not edit tests or claim that lane green.
