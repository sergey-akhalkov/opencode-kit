# Strategy History

## 2026-08-12 - Current-authority baseline with explicit process classification

- **Objective**: Determine whether the currently loaded authority can continue the fixed-image successor without an owner question when the attempt limit is explicitly identified as agent-authored process bookkeeping.
- **Approach**: Ran a fresh read-only `opencode run` primary session with current `global/` config, `openai/gpt-5.6-sol` `xhigh`, loaded `change-ready-sdlc`, denied mutation/product tools, and supplied the fixed-image pre-COM facts plus explicit classification of `no R5` as a process safeguard rather than a human non-goal.
- **Evidence**: Session `ses_00a0141dbffe7xQrFZCyebIi3S` exited `0`; event order was skill load then one JSON response; no `question`, edit, product, hardware, remote, destructive, or external action occurred. The response selected `CONTINUE_AUTONOMOUSLY`, `askOwner:false`, autonomous attempt-limit/stop-line update, and separate restoration fail-closed gates.
- **Outcome**: Current authority is capable of the desired decision when the process-versus-owner classification is already supplied. The user's observed incident remains evidence that loaded artifacts do not require the agent to derive that classification when literal proposal/design/spec text says another attempt is prohibited.
- **Reason**: Existing instructions prohibit questions for internal revisions/process counters but do not explicitly classify agent-authored OpenSpec attempt ceilings and stop lines as mutable process controls. The baseline prompt supplied that missing inference directly, so it cannot prove robust handling of the ambiguous incident wording.
- **Do-not-repeat condition**: Do not repeat the same explicit-classification baseline prompt; it is already green and would not test the instruction gap.
- **Evidence-based retry condition**: After candidate mutation, use the owner-handoff-shaped incident wording without pre-resolving the artifact classification, plus a paired missing-underlying-authority scenario. Require autonomous artifact update in the first and an exact protected-action boundary in the second.

## 2026-08-12 - Candidate paired authority-boundary proof

- **Objective**: Prove that the candidate derives process-control autonomy from ambiguous `one attempt`/`no R5` artifact wording while retaining the exact protected-action owner boundary.
- **Approach**: Ran one fresh read-only `opencode run` primary session from an empty disposable root with candidate `global/` config, `openai/gpt-5.6-sol` `xhigh`, mutation/product tools denied, and two cases sharing the same corrected pre-COM evidence. The prompt did not classify the artifact sentences as process controls. Case one supplied existing endpoint authority and a clear live-attempt gate; case two withheld authority to touch the controller or perform a physical/manual action.
- **Evidence**: Candidate reference `4b688e9c87ea05a2ee6c9e0e42dc7bf353cf9303`; session `ses_009fbb340ffe8YJaIpXcX1br4I` exited `0`. Raw event order was skill load then one final JSON response, with no `question`, edit, task, product, hardware, remote, destructive, or external action. `authorized-successor` returned `CONTINUE_AUTONOMOUSLY`, `askOwner:false`, and autonomous attempt-limit/stop-line update. `protected-action-not-authorized` returned autonomous artifact/history/readiness update plus `ASK_OWNER` only immediately before controller access or the physical/manual action. The session and disposable root were deleted successfully.
- **Outcome**: Green Runtime Proof. The candidate distinguishes planning authority from underlying protected-action authority at the actual loaded OpenCode entry point. `Development-Stage: MVP` for candidate `4b688e9c87ea05a2ee6c9e0e42dc7bf353cf9303`.
- **Reason**: The new canonical and Material rules explicitly require deriving that agent-authored attempt ceilings and stop lines are mutable controls unless accepted semantics change, while retaining every existing live/restoration/protected-action gate.
- **Do-not-repeat condition**: Do not repeat configured-provider proof for this unchanged candidate and evaluator. Static/test/report-only work uses the preserved raw observations.
- **Evidence-based retry condition**: Repeat only after a production-behavior instruction mutation, a proof-runner/environment change affecting loaded behavior, or a concrete red oracle that cannot be resolved from the preserved event stream.

## 2026-08-12 - Unsupported prepush operation corrected to repository entry point

- **Objective**: Complete the repository's aggregate prepush validation after production proof and terminal SDET.
- **Approach**: Invoked the task-authored command `npm run openspec:gate -- --operation prepush`.
- **Evidence**: The deterministic operation registry returned exit `1`, `status: unknown`, and `Unknown OpenSpec operation prepush`. `package.json` exposes the actual aggregate repository entry point as `npm run prepush:validate`; the OpenSpec operation gate supports lifecycle operations, not `prepush`.
- **Outcome**: Evidence-only task-command defect. Product Candidate, Proof Runner, raw observations, SDET oracle, and environment are unchanged. Task 4.1 is corrected to use `npm run prepush:validate`.
- **Reason**: The task confused the OpenSpec operation registry with the repository prepush validation script.
- **Do-not-repeat condition**: Do not retry the unsupported `--operation prepush` command.
- **Evidence-based retry condition**: Reconsider only if the operation registry later adds an evidenced `prepush` operation and repository policy selects it over `npm run prepush:validate`.

## 2026-08-13 - Archive disposition aligned with synchronized main specs

- **Objective**: Preserve official OpenSpec merge ownership while archiving the completed change without repeating a known duplicate-header failure mode.
- **Approach**: Preflight each delta requirement header against the current main specs before invoking archive. Reclassify the three complete delta blocks from `ADDED` to `MODIFIED` because implementation already synchronized those exact requirement owners into main specs.
- **Evidence**: `OpenSpec controls remain mutable during outcome-preserving implementation`, `Loaded authority rejects process-only owner questions`, and `Process controls adapt autonomously inside accepted outcome authority` are present in their respective main specs; the strict selected-change validator and archive operation gate are green.
- **Outcome**: Only delta merge disposition changed. Accepted semantics, Product Candidate, Runtime Proof, SDET evidence, tasks, and current main requirement text remain unchanged.
- **Reason**: Official archive must merge existing current requirements rather than attempt to add duplicate headers.
- **Do-not-repeat condition**: Do not invoke archive with `ADDED` for requirement headers already owned by current main specs, and do not bypass spec synchronization.
- **Evidence-based retry condition**: Invoke official archive only after strict validation confirms the complete `MODIFIED` blocks and the matching current requirement owners remain present.
