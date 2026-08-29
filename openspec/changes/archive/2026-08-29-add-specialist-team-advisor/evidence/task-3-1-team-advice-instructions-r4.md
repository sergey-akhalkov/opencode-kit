# Task 3.1 Team Advice Instructions R4

## Candidate

- Canonical runtime owner: `global/AGENTS.md`
- Practice Owner boundary mirror: `instructions/practice-owner-agent-contract.md`
- Runtime compaction mirror: `global/opencode.json.template`
- Renderer: `tools/runtime-surface-profile.ts`
- Structural validator: `tools/validators/devkit-contract.ts`
- Activation: none; the gitignored active config was not edited or restarted.

The candidate adds one compact parentless-root team-advice rule, retains main as final selector/dispatcher/integrator/proof owner, keeps the advisor non-authorizing and non-dispatching, narrows zero-trigger language to Practice Owners, and defines the exact conditional `Team Advice State` compaction fields. It adds no routing skill, static roster, lifecycle phase, or size ceiling.

## Disposable Loader Proof

```text
npm.cmd run proof:runtime-surface-loader -- --profile core --candidate-id add-specialist-team-advisor-task-3-1-core-r4 --evidence-root openspec/changes/add-specialist-team-advisor/evidence/task-3-1-runtime-surface-core-r4
```

Result: `status=passed`, `cleanup=complete`; OpenCode config, advisor, selected agent list, and skill readbacks exited `0`.

Every recorded authority marker is true: `teamAdviceRoutingTrigger`, `teamAdviceStateContract`, `practiceOwnerBoundary`, `compactionTeamAdviceMirror`, `debugConfigExposesCompactionPrompt`, and the pre-existing evidence, claim, complexity, and foundation markers. Catalog-plugin cardinality remains one, excluded core domain agents remain absent, and permission/path/plugin failures remain empty.

Preserved raw evidence: `evidence/task-3-1-runtime-surface-core-r4/raw.json`.

## Diagnostic Chain

- R1 showed that generated configs discarded the template `agent.compaction` block. The renderer was narrowed to preserve only `agent.compaction`, and both profile materialization tests gained exact prompt assertions.
- R2 remained false on the combined compaction marker, so the next run was bounded evidence capture rather than an unchanged proof retry.
- R3 falsified the interim debug-projection hypothesis with `debugConfigExposesCompactionPrompt=true` and isolated the missing explicit `does not reconsult solely because compaction occurred` marker.
- R4 followed the exact mirror correction and passed. Strategy and retry dispositions are preserved in `history.md` Strategy 12. R1-R3 remain diagnostic and are not completion evidence.

## Active Config Non-Mutation

The active gitignored `global/opencode.json` SHA-256 remained byte-identical before and after task 3.1: `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`. Exact readback contains no `specialist-team-advisor`, `specialist_catalog`, `specialist-catalog`, or `Team Advice State` marker. No install, activation, restart, provider call, commit, push, release, deployment, or remote effect occurred.

## Validation

```text
node --check tools/runtime-surface-profile.ts
node --check tools/proofs/runtime-surface-loader.ts
node --check tools/validators/devkit-contract.ts
node --check tools/test-library/validator-2.ts
npm.cmd run test:focused:library
npm.cmd run test:focused:contracts
npm.cmd run test:focused:model-routing
npm.cmd run test:focused:practice-owners
npm.cmd run test:focused:instruction-context
npm.cmd run instruction:inventory -- --format markdown
npm.cmd run instruction:canonicalize -- --check .
npm.cmd run validate:strict
git diff --check
```

Results: syntax and JSON parsing exited `0`; library tests `186`, contracts `71`, model-profile tests `16`, Practice Owner tests `7`, and instruction-context tests `15` passed; inventory reported `76` artifacts, `5303` lines, and diagnostic token proxy `104200`; context quality passed with zero changes or deterministic errors; strict validation reported `skills=33 agents=22 markdown=954 warnings=0`; diff checking reported no errors.

## Claim Ceiling

This proves structural canonical ownership and actual disposable core loading of the compact team-advice rule, Practice Owner distinction, exact compaction mirror, existing authority kernels, and profile/permission/plugin boundaries for the recorded source and OpenCode `1.18.25`. It does not prove semantic advisor engagement, compaction output behavior, active-host behavior, or any `STA-001` candidate member.
