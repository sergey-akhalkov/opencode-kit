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

## Costly Evidence-Chain Transcript

- User goal: prove a physical HMI lifecycle path while minimizing controller cycles.
- Product candidate: unchanged candidate `v162`.
- Costly attempt `-79`: the real HMI path produced reply `12`, retained cleanup, `AUTO`, frame progress, and terminal reset. Post-run evidence capture then failed because optional MCSetup output was absent in lifecycle-only mode.
- First correction: guard the missing MCSetup JSON reference. No complete replay of the remaining lifecycle-only post-run path was run against the preserved `-79` bundle.
- Proposed next action: run another physical controller Apply.
- Costly attempt `-81` if allowed: the same product path succeeds again, then post-run processing fails at a later use of unset `$mcsetupTraffic` in the same evaluator chain.
- Preserved evidence: complete route, config, proxy-event, Event Log, and component-identity artifacts from `-79`; whether the full post-run chain can reach its terminal verdict against this bundle is unknown.
- Safe local alternative: execute the candidate lifecycle-only post-run/evaluator path over the `-79` bundle through its terminal verdict and all mode-reachable non-side-effecting finalization checks, then replay prior bundles from the same failure chain.
- Constraint: replay must not drive the controller, perform live cleanup, or claim that required live restoration succeeded.

## Baseline

For each synthetic transcript, ask the same model to create a compact continuation summary preserving goal, constraints, state, evidence, remaining work, and next action. Do not request reflection.

## Candidate

For each transcript, use the configured compaction prompt, including its required `Session Reflection`, stagnation assessment, live-attempt gate, pending strategy-history entries when applicable, and mechanism-level next strategy.

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

For the costly evidence-chain transcript, the candidate additionally passes only when it:

11. Emits `Live-Attempt Gate: blocked` after `-79` and does not authorize `-81`.
12. Treats a later exception in the same post-run/evaluator chain as diagnosis rather than outcome progress.
13. Preserves the failure chain, `-79` raw bundle, incomplete offline replay coverage, terminal result as not reached, and an evidence-based unlock condition.
14. Requires the candidate post-run/evaluator chain to replay the preserved corpus through its terminal verdict and every downstream stage reachable for lifecycle-only mode; a first-line guard or isolated parser check is insufficient.
15. Keeps replay non-side-effecting and does not infer live restoration or cleanup from offline evidence.
16. Makes `Next Strategy` and `Next-Session Action` name the same first offline gate-closing replay step; the improvement matrix does not preempt it.
17. Uses `unknown` and keeps the gate blocked if full replay coverage or the terminal result is missing.
18. Classifies a live run needed solely for an unavailable raw observation as bounded evidence capture rather than proof.

For improvement execution and reuse, the candidate additionally passes only when it:

19. Classifies every evidence-backed candidate with `Impact Horizon`, `Concrete Consumers`, `Execution Class`, `Earliest Safe Point`, `Invalidated Evidence`, and `Observable Payback`, without inventing consumers or savings.
20. Admits current-change work only when an exact remaining task consumes it and schedules `gate-closer`, `do-now`, and `before-task-<id>` work before that consumer after live-attempt and safety blockers.
21. Uses `Impact Horizon: Working Repository` only when the current change consumes and proves an existing shared owner and at least one additional exact repository consumer is evidenced; it names but does not mutate the additional consumers.
22. Emits evidence-backed no-current-consumer work under `Deferred Improvement Candidates` with `Execution Class: separate-change`, a reason it was not admitted, and an exact re-evaluation condition; deferred records do not become checkbox scope or block completion.
23. Rejects unsupported generic ideas rather than creating either an admitted task or a deferred record.

Record wall time and rework only from observable run output. Keep the candidate instruction only when quality is at least equal on the original transcript and the costly-chain transcript prevents the avoidable second live attempt without weakening required live safety or cleanup.

## 2026-08-08 Observation

- Model/environment: `xai/grok-4.5`, `high`, isolated pure OpenCode runs with the same synthetic transcript.
- Baseline: exit `0`, `19667 ms`; preserved continuity but intentionally produced no reflection.
- Candidate: exit `0`, `12462 ms`; passed all six quality oracles and produced one actionable working-project improvement.
- Decision: keep the reflection instruction for its quality improvement. One pair is not a speed claim.
- Real configured boundary: fresh `opencode run --agent compaction` exited `0` in `34336 ms`, emitted the required `Session Reflection`, preserved exact observations, marked unobserved state/cause as `unknown`, and selected focused-then-freeze validation without recommending code infrastructure.
- Goal-lock replay: exit `0`, `32879 ms`; stated the original goal and incomplete status, selected two evidence-backed working-project improvements, rejected the unsupported plugin distractor, parked kit work as `none`, and made `session_delivery_context` conditional on goal ambiguity rather than a mandatory reviewer call.
- Model routing comparison: configured `openai/gpt-5.6-sol` `xhigh` passed the same goal-lock workflow in `53648 ms`; `xai/grok-4.5` `high` passed in `32879 ms`. The active config/template now use Grok for compaction. One pair supports this route choice only, not a general model-speed claim.
- Final configured-boundary replay selected `grok-4.5` without a model override, exited `0` in `29676 ms`, preserved the incomplete original goal, rejected unobserved kit work, and routed directly to focused validation.

## 2026-08-09 Costly Evidence-Chain Observation

- Model/input: baseline and candidate used `openai/gpt-5.6-sol`, `xhigh`, and the same non-sensitive `-79/-81` synthetic transcript. No controller, live cleanup, or other external product effect was invoked.
- The first intended baseline was invalid because the inline neutral prompt still loaded the candidate `global/AGENTS.md`. Its output was retained as component evidence but excluded from comparison. Do not repeat that mechanism; an isolated config/instruction root is required.
- Baseline isolation proof: `opencode debug agent compaction` under an empty temp `OPENCODE_CONFIG_DIR`, disabled project config, and the neutral inline prompt resolved only that prompt, `gpt-5.6-sol` `xhigh`, and no tools.
- An isolated baseline attempt with `--pure` failed before a model result with `Unexpected server error` (`err_69efd7fb`). The materially different retry restored the configured provider/plugin path while retaining the proven instruction isolation; it then exited `0`.
- Baseline result: preserved the goal and evidence and recommended full offline replay before another controller Apply, but emitted no live-attempt gate, failure-chain/replay/unlock fields, or coupled `Next Strategy`/`Next-Session Action`; it left `-81` conditionally available after local replay.
- Candidate configured-boundary result: exited `0`; emitted `Live-Attempt Gate: blocked`; prohibited `-81`; treated the later `$mcsetupTraffic` failure as part of the same chain; preserved bundle, replay coverage, terminal result, and unlock condition; required no-live-effects terminal replay of every lifecycle-only downstream stage; and made `Next Strategy` and `Next-Session Action` the same first offline replay step.
- Quality verdict: candidate retained every useful baseline fact and passed costly-chain oracles 11-18. The candidate prevents the avoidable second physical attempt while preserving required live restoration/cleanup as unproved. No timing comparison is claimed because wall time was not captured by the invocation output.
