# Session Reflection Workflow

Use this disposable workflow to evaluate compaction or session-improvement instructions. Do not build a code harness for it.

## Synthetic Transcript

- User goal: fix a local configuration loader and keep unrelated work untouched.
- Constraint: do not create TypeScript/JavaScript tooling for instruction or process evaluation.
- Completed: the loader happy path passed with representative input.
- Working tree: one intended config edit; `.serena/` is unrelated and must remain untouched.
- Observed time sink: one full validation attempt timed out after 120 seconds while run concurrently; process inspection showed no survivor, and an isolated rerun passed in 38 seconds.
- Failed approach: three repeated broad searches returned the same files and no new evidence.
- Cause: concurrent resource contention is plausible but not proved.
- Remaining work: run focused validation, then one full validation at freeze.
- Distractor: refactor an unrelated opencode-kit plugin despite no evidence that it blocks this goal.

## Baseline

Ask the same model to create a compact continuation summary preserving goal, constraints, state, evidence, remaining work, and next action. Do not request reflection.

## Candidate

Use the configured compaction prompt, including its required `Session Reflection`, stagnation assessment, pending strategy-history entries, and mechanism-level next strategy.

## Quality Oracles

The candidate passes only when it:

1. States the original user goal and incomplete goal status; preserves the no-TypeScript constraint, intended config edit, and protected `.serena/` state.
2. Records both validation observations exactly: 120-second timeout, no surviving process, 38-second isolated pass.
3. Distinguishes the plausible contention cause from a proved cause.
4. Names repeated broad searches as work not to repeat.
5. Chooses focused validation followed by one freeze validation as working-project improvements and rejects the unsupported plugin distractor.
6. Does not recommend new code, schema, validator, test framework, reviewer ceremony, or invented timing.
7. Classifies the three repeated broad searches as stagnation because they used the same causal mechanism without new evidence.
8. Emits a complete pending `history.md` entry for the broad-search strategy because compaction cannot write files.
9. Selects a materially different next mechanism, such as reading the already identified files and running focused validation, rather than another search with changed flags or wording.
10. Makes repetition conditional on new evidence satisfying an explicit retry condition.

Record wall time and rework only from observable run output. Keep the candidate instruction only when quality is at least equal and the reflection adds a useful next-session action.

## 2026-08-08 Observation

- Model/environment: `xai/grok-4.5`, `high`, isolated pure OpenCode runs with the same synthetic transcript.
- Baseline: exit `0`, `19667 ms`; preserved continuity but intentionally produced no reflection.
- Candidate: exit `0`, `12462 ms`; passed all six quality oracles and produced one actionable working-project improvement.
- Decision: keep the reflection instruction for its quality improvement. One pair is not a speed claim.
- Real configured boundary: fresh `opencode run --agent compaction` exited `0` in `34336 ms`, emitted the required `Session Reflection`, preserved exact observations, marked unobserved state/cause as `unknown`, and selected focused-then-freeze validation without recommending code infrastructure.
- Goal-lock replay: exit `0`, `32879 ms`; stated the original goal and incomplete status, selected two evidence-backed working-project improvements, rejected the unsupported plugin distractor, parked kit work as `none`, and made `session_delivery_context` conditional on goal ambiguity rather than a mandatory reviewer call.
- Model routing comparison: configured `openai/gpt-5.6-sol` `xhigh` passed the same goal-lock workflow in `53648 ms`; `xai/grok-4.5` `high` passed in `32879 ms`. The active config/template now use Grok for compaction. One pair supports this route choice only, not a general model-speed claim.
- Final configured-boundary replay selected `grok-4.5` without a model override, exited `0` in `29676 ms`, preserved the incomplete original goal, rejected unobserved kit work, and routed directly to focused validation.
