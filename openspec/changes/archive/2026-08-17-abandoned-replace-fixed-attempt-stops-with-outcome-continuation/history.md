# Strategy History

## 2026-08-17 - Add Another Override Paragraph

- **Objective:** Prevent an agent from treating `zero retries` as a permanent owner boundary.
- **Approach:** Add another high-priority sentence saying attempt counts and stop lines are mutable process controls.
- **Evidence:** `global/AGENTS.md`, Change-Ready, OpenSpec apply/archive, and the completion arbiter already contain that rule; the archived `make-plan-attempt-limits-autonomous` change also captured a same-model proof, yet the reproduced P1S1 workflow still stopped and asked the owner.
- **Outcome:** Rejected during proposal design.
- **Reason:** More override text would increase context competition without removing stronger nearby permanent-stop and immediate-block language or the task/outcome mismatch.
- **Do Not Repeat Condition:** Do not add a new policy paragraph unless evidence proves an uncovered semantic requirement rather than retrieval conflict or contradictory authority.
- **Evidence-Based Retry Condition:** Reconsider only if the candidate with obsolete phrases removed still fails an exact installed scenario because a necessary decision rule is absent.

## 2026-08-17 - Ban Zero-Retry Text Globally

- **Objective:** Remove the phrase that triggered the false permanent stop.
- **Approach:** Reject any active artifact containing `zero retries`, `one attempt`, or equivalent finite-count wording.
- **Evidence:** The same text correctly protects a single authorization/root from automatic replay after a timeout, crash, unknown cleanup, or external effect; transport and completion-guard calls also need bounded technical retries.
- **Outcome:** Rejected during proposal design.
- **Reason:** A bare text ban would weaken legitimate invocation safety and still would not distinguish an unfinished mission from a finalized attempt.
- **Do Not Repeat Condition:** Do not validate retry semantics from one token without its invocation/mission scope and causal continuation contract.
- **Evidence-Based Retry Condition:** Reconsider only for a narrower unsupported phrase whose complete local context is always unsafe and deterministically identifiable.

## 2026-08-17 - Separate Invocation Safety From Mission Continuation

- **Objective:** Preserve live-effect safety while preventing arbitrary process ceilings from abandoning the accepted outcome.
- **Approach:** Keep each invocation finite and non-reusable; require a causal delta, replay, authority, state, safety, restoration, and cleanup for each successor; remove fixed mission-wide counts; make accepted outcome proof dominate task status; remove mandatory retrospective tasks; prove behavior against the exact checked-but-unmet observer scenario and controls.
- **Evidence:** The reproduced attempt had trustworthy direct startup facts, a failed packet-observer canary, a stale component/leg binding, no P1S1 receipt, `Development-Stage: development`, and a safe causal correction, while `23/23` and zero-retry language briefly produced a terminal handoff. After the user restated the goal, six valid successor tasks were added without changing accepted semantics.
- **Outcome:** Selected for this change.
- **Reason:** It addresses the causal semantic conflation, preserves protected boundaries, reduces completion ceremony, and has direct observable baseline/candidate oracles.
- **Do Not Repeat Condition:** Do not revert to numeric mission caps, checkbox-only completion, or mandatory process-reflection work while the accepted outcome remains the same.
- **Evidence-Based Retry Condition:** Replace this strategy only if installed evidence shows it cannot preserve both safe finite invocations and autonomous outcome completion, with the conflicting scenario and safer alternative recorded first.

## 2026-08-17 - Change Upstream OpenSpec Status Semantics

- **Objective:** Prevent `complete` status when every checkbox is checked but the accepted outcome is unmet.
- **Approach:** Modify or replace upstream OpenSpec CLI status computation with semantic outcome evaluation.
- **Evidence:** OpenSpec task counts are structurally correct and useful; arbitrary outcome proof remains model/domain dependent, while current kit apply/archive/arbiter routes already own requirement-to-evidence reconciliation.
- **Outcome:** Rejected during proposal design.
- **Reason:** It would add an out-of-owner dependency and semantic inference mechanism when the existing kit workflow can enforce honest completion without changing the CLI.
- **Do Not Repeat Condition:** Do not fork upstream status or build a deterministic semantic scorer for arbitrary proposal prose.
- **Evidence-Based Retry Condition:** Reconsider only if current upstream exposes an official structured outcome-proof contract that the kit can consume without inference or compatibility ownership.

## 2026-08-17 - Reuse Active Global-Source Resolution

- **Objective:** Prevent a guessed parent `bin` path from becoming a false apply blocker.
- **Approach:** Resolve the helper from `OPENCODE_CONFIG_DIR` first, verify `<source>/bin/<helper>`, then reuse documented runtime-source fallback/collision evidence.
- **Evidence:** The active environment points to `D:/home/sergey-akhalkov/opencode-kit/global`; the operation gate exists and passes there, while the guessed repository-parent path does not exist. Current config-portability and runtime-source owners already model this source identity.
- **Outcome:** Selected as a narrow extension in this change.
- **Reason:** It removes the concrete path ambiguity without a new CLI, PATH installation, target package script, or hard-coded checkout.
- **Do Not Repeat Condition:** Do not derive portable helper paths by stripping directory segments from a loader-visible global source.
- **Evidence-Based Retry Condition:** Reconsider the source order only if current OpenCode docs/source/live loader evidence changes the meaning or precedence of `OPENCODE_CONFIG_DIR`.

## 2026-08-17 - Guard Baseline With Fully Isolated XDG Data

- **Objective:** Capture the installed checked-but-unmet completion-guard disposition before loaded-authority mutation.
- **Approach:** Start a fresh local OpenCode server with isolated XDG data, cache, and state directories, then invoke the checked-outcome runner against the configured `openai/gpt-5.6-sol/xhigh` route.
- **Evidence:** `evidence/task-1-2-guard-baseline-r1/raw.json` records complete root/session cleanup and `Question probe returned an assistant error`; retained server diagnostics identify `AI_LoadAPIKeyError` because isolated XDG data removed access to the existing configured credential store. Provider-free `evidence/task-1-2-guard-baseline-failure-replay-r1/evaluation.json` terminally classifies the preserved bundle as `captured-failure-clean` with zero model calls.
- **Outcome:** Environment setup failure before a model result; no completion-guard behavior was observed.
- **Reason:** XDG data isolation also isolated the authorized local credential store, while the proof only needed disposable cache/state and explicit session cleanup.
- **Do Not Repeat Condition:** Do not isolate XDG data for this configured-provider lane or retry from the failed evidence root.
- **Evidence-Based Retry Condition:** Start a new server identity with disposable cache/state, retain the existing credential-store data location, use a new create-only evidence root, and preserve the exact same model/input/candidate source.

## 2026-08-17 - Guard Baseline With Credential Store Retained

- **Objective:** Capture the installed checked-but-unmet completion-guard disposition after correcting the credential-store isolation defect.
- **Approach:** Start a new local server with disposable cache/state while retaining the configured provider data location, run the same `openai/gpt-5.6-sol/xhigh` checked-but-unmet probe, disable grind after the first correlated continuation, and wait for the root to become idle.
- **Evidence:** `evidence/task-1-2-guard-baseline-r2/raw.json` records `Root did not become idle within 120000ms` with session records deleted. Server run `80d9f518` shows the root used `openai/gpt-5.6-sol`, audit `audit_4ddb23f41901` used the configured hidden arbiter, the audit child completed, the root resumed through repeated provider/tool turns, and provider streams continued after session deletion until the isolated server was killed. `evidence/task-1-2-guard-baseline-r2-replay-r1/evaluation.json` terminally replays the preserved failure with zero model calls.
- **Outcome:** The installed guard produced a correlated continuation, but the proof runner failed to bound that continuation or prove terminal liveness before deletion, so it did not preserve a terminal baseline result.
- **Reason:** The runner waited for the synthetic continuation to finish unrestricted ordinary work and equated successful session deletion with cleanup even while the provider execution remained active.
- **Do Not Repeat Condition:** Do not launch another guard capture with deletion-only cleanup or wait for an unrestricted continued root to finish naturally.
- **Evidence-Based Retry Condition:** The runner must preserve the first audit disposition, disable grind, abort an active continued root, verify non-busy terminal status before deletion, require liveness closure for a successful replayed result, and pass provider-free help/replay checks before a create-new live evidence root is allowed.

## 2026-08-17 - Portable Helper Proof Without A Spec Delta

- **Objective:** Prove configured-global helper selection and operation-gate invocation from an unrelated disposable project, plus missing-helper and canonical-collision controls.
- **Approach:** Extend the existing project-unattended proof runner with a disposable `helper-proof` change containing proposal, tasks, and strategy history, then require the operation gate to report `passed`.
- **Evidence:** The first provider-free run exited `1` with `Configured-global operation gate did not pass from the unrelated project`. Source inspection of `global/bin/openspec-operation-gate.ts::artifactChecks` shows apply emits a warning when the change has no `specs/**/spec.md`; aggregate gate status therefore cannot be `passed` for that fixture.
- **Outcome:** Fixture setup failure before helper-resolution acceptance evidence; disposable state was removed and no external or target action occurred.
- **Reason:** The synthetic change omitted the spec-delta artifact required for an unqualified `passed` apply-gate result.
- **Do Not Repeat Condition:** Do not use a proposal/tasks/history-only helper fixture while asserting exact `passed` status.
- **Evidence-Based Retry Condition:** Add one minimal disposable spec delta, retain the same helper/source/collision assertions, and include the gate output in any future failure diagnostic before rerunning provider-free proof in a create-new evidence root.

## 2026-08-17 - Candidate Guard State Counter Oracle

- **Objective:** Prove the frozen candidate's installed checked-but-unmet completion-guard continuation with terminal cleanup.
- **Approach:** Run the liveness-bounded candidate capture against the staged global source and require correlated `continued`, a continuation cycle/state signal, zero questions, and one synthetic guard message.
- **Evidence:** `evidence/task-3-2-guard-candidate-r1/raw.json` records audit status `continued`, guard state `continuation-pending`, one synthetic guard message, zero question calls, zero human replies, and complete liveness-closed cleanup. The runner exited `1` only because its post-run assertion treated a pre-read `continuationCycles` value as mandatory unless state was exactly `running`; the installed controller had already reached the equally valid intermediate state `continuation-pending` and emitted the observable continuation.
- **Outcome:** Correct product behavior and cleanup were captured, but a timing-sensitive evaluator rejected the preserved result.
- **Reason:** The evaluator duplicated the stronger observable continuation facts with a state/counter timing check read from a different instant.
- **Do Not Repeat Condition:** Do not issue another provider capture or require a specific intermediate guard state when correlated `continued`, the synthetic continuation, zero questions, and terminal liveness are already preserved.
- **Evidence-Based Retry Condition:** Remove the redundant state/counter predicate, evaluate the same candidate oracle from preserved `raw.json`, replay this bundle provider-free through a terminal result, and rerun live only if replay identifies a genuinely missing raw observation.

## 2026-08-17 - Slash-Command Capture With Disabled Model Registry

- **Objective:** Prove the installed `/opsx-propose` and `/opsx-archive` outcome-continuation behavior in one disposable OpenSpec project.
- **Approach:** Run the new command proof after provider-free loader/source/OpenSpec preflight, with the `quality-independent` route and a create-new evidence root.
- **Evidence:** `evidence/task-2-2-command-candidate-r1/raw.json` records OpenCode exit `1` before any tool or assistant event: `Model not found: openai/gpt-5.6-sol`. The runner had set `OPENCODE_DISABLE_MODELS_FETCH=1`; cleanup deleted the one session and disposable project. `evidence/task-2-2-command-candidate-r1-replay-r1/evaluation.json` is terminal, provider-free, and confirms cleanup while naming both missing command observations.
- **Outcome:** No provider/model call and no candidate behavior observation occurred; the attempt cannot prove or disprove the candidate.
- **Reason:** The proof environment disabled the installed model registry while simultaneously requesting the configured route. Config/skill debug preflight did not exercise route availability.
- **Do Not Repeat Condition:** Do not run a command capture with model discovery disabled or treat config parsing alone as route readiness.
- **Evidence-Based Retry Condition:** Remove only the contradictory environment flag, require provider-free `opencode models <provider> --pure` readback containing the exact configured route in a create-new preflight root, preserve r1/replay, and then use a new capture root. Any later provider-path failure again requires preserved replay before another live attempt.

## 2026-08-17 - Explicit CLI Model On Slash Command

- **Objective:** Retry the installed slash-command proof only after exact model-registry readiness was established.
- **Approach:** Remove the disabled-registry flag, require `modelAvailable=true`, and run the same command with explicit `--model openai/gpt-5.6-sol --variant xhigh` flags.
- **Evidence:** `evidence/task-2-2-command-preflight-r2/preflight.json` records registry/config/skills/OpenSpec status `0` and the exact route available. `evidence/task-2-2-command-candidate-r2/raw.json` nevertheless records the same immediate `Model not found` event, zero tool/assistant events, one deleted session, and complete project cleanup. `evidence/task-2-2-command-candidate-r2-replay-r1/evaluation.json` terminally confirms the missing command observations with zero replay model calls.
- **Outcome:** The candidate was again not invoked. Two materially similar explicit-route CLI attempts produced no behavior progress, so that mechanism is stagnant and must not be repeated.
- **Reason:** Current OpenCode accepts the configured route in its registry/agent config but rejects the duplicated explicit provider/model argument on this `--command` path before provider execution. The exact internal parser cause is not required to choose the supported loaded-agent route.
- **Do Not Repeat Condition:** Do not pass explicit `--model`/`--variant` on this slash-command proof or retry another explicit-route variant such as a bare model id.
- **Evidence-Based Retry Condition:** Use the loaded build-agent route as the distinct mechanism, prove its exact providerID/modelID/variant via provider-free `opencode debug agent build --pure`, omit duplicated CLI route flags, and retain all R1/R2 bundles. Any later failure after provider execution must be replayed and causally classified before another live attempt.

## 2026-08-17 - Loaded-Agent Route On Slash Command

- **Objective:** Bypass the stagnant explicit CLI route mechanism and invoke the canonical slash command through the exactly resolved build-agent route.
- **Approach:** Omit `--model` and `--variant`; require `opencode debug agent build --pure` to resolve the exact providerID/modelID/variant and registry availability before capture.
- **Evidence:** `evidence/task-2-2-command-preflight-r3/preflight.json` records `agentRouteExact=true`, `modelAvailable=true`, and all loader/OpenSpec statuses `0`. `evidence/task-2-2-command-candidate-r3/raw.json` still records immediate `Model not found: openai/gpt-5.6-sol`, zero tool/assistant events, no archive call, one deleted session, and complete project cleanup. `evidence/task-2-2-command-candidate-r3-replay-r1/evaluation.json` terminally confirms the missing command observations with zero replay model calls.
- **Outcome:** A materially distinct route-selection mechanism reached the same pre-provider failure. No candidate behavior was invoked, and another unqualified CLI capture is not authorized.
- **Reason:** Unknown after current local evidence: debug/config/model registry agree on the exact route while `opencode run --command` rejects it before generation. The failure is in the command runtime/model-resolution boundary, not the candidate command body.
- **Do Not Repeat Condition:** Do not repeat either explicit-route or loaded-agent `opencode run --command` capture, change only model spelling/flags, or issue another live attempt before a diagnosis identifies a different causal mechanism and a provider-free unlock check.
- **Evidence-Based Retry Condition:** Perform one bounded read-only diagnosis over R1-R3 and current OpenCode command/runtime source or authoritative local evidence. A successor is allowed only if it names a distinct mechanism, a provider-free check that reaches beyond the failed resolution path, and why the preserved failures cannot recur. Otherwise retain the exact runtime gap and qualify no command-runtime claim.

## 2026-08-17 - Direct SDK Session Command

- **Objective:** Bypass the broken CLI bridge by invoking the loaded command through the installed server's SDK endpoint with a structured child-session route and no scalar command model field.
- **Approach:** Start a loopback proof server, verify exact command inventory and agent route, create a routed child with `{providerID: openai, modelID: gpt-5.6-sol, variant: xhigh}`, then call `session.command` without model/variant in the request.
- **Evidence:** `evidence/task-2-2-command-preflight-r4/preflight.json` records exact server route, command inventory, omitted command override, zero model calls, and terminal cleanup. `evidence/task-2-2-command-candidate-r4/raw.json` records the structured child and command dispatch, followed by `ProviderModelNotFoundError` at `SessionPrompt.getModel -> SessionPrompt.command`; no assistant/tool event occurred. All sessions, server, and project closed. `evidence/task-2-2-command-candidate-r4-replay-r1/evaluation.json` terminally confirms the missing semantic observations with zero replay model calls.
- **Outcome:** The SDK reached the installed command handler but OpenCode 1.18.18's internal command bridge reproduced the same scalar provider-qualified model lookup before generation. This isolates an upstream command-runtime defect rather than a candidate command-body defect.
- **Reason:** Both CLI and SDK command endpoints converge on `SessionPrompt.command`, which resolves `openai/gpt-5.6-sol` as a model ID after provider `openai` is already selected. The configured structured session route itself is correct.
- **Do Not Repeat Condition:** Do not invoke `opencode run --command`, SDK `session.command`, change route spelling, or treat command inventory/config success as integrated command execution on OpenCode 1.18.18.
- **Evidence-Based Retry Condition:** Load the exact canonical command template through the same server inventory, prove normalized template/source equality and structured agent route provider-free, and drive that reviewed template through the already proven structured `session.prompt` path. Attribute it as loaded-template semantic proof, not successful integrated slash-command proof; retain the upstream bridge gap. No further mechanism is authorized if structured prompt generation fails without a new causal observation.

## 2026-08-17 - Loaded-Template Preflight With Duplicate CLI Probes

- **Objective:** Unlock a loaded-template structured-prompt proof after the upstream `SessionPrompt.command` defect was isolated.
- **Approach:** Extend the prior preflight with exact server template equality while retaining sequential config, agent, skill, model-registry, and OpenSpec CLI probes.
- **Evidence:** `evidence/task-2-2-template-preflight-r5/failure.md` records outer timeout at 300000 ms before `preflight.json`, no model/capture invocation, and a terminal process-table check showing no runner, server, or PTY remained.
- **Outcome:** Provider-free preflight orchestration timed out; no semantic observation occurred.
- **Reason:** Redundant CLI probes each retained independent 120-second limits before the direct server gate, allowing the preflight's total bound to exceed its owning shell bound and preventing `finally` evidence.
- **Do Not Repeat Condition:** Do not combine the already-proven CLI config/agent/skill/model probes with the server-specific template unlock or retry into the same empty evidence root.
- **Evidence-Based Retry Condition:** Keep only the direct loopback server route/command/template inventory and local OpenSpec readback, require terminal server/project cleanup inside the runner, and use a create-new evidence root. Capture remains blocked until that reduced provider-free gate is green.

## 2026-08-17 - Loaded-Template Semantic Capture

- **Objective:** Prove the exact loaded `/opsx-propose` and `/opsx-archive` template semantics through the structured prompt route while retaining the integrated OpenCode 1.18.18 command-bridge limitation.
- **Approach:** Reduce the provider-free gate to direct server inventory/template equality/structured route/OpenSpec checks, then start one create-new capture using `session.prompt` with the exact loaded template.
- **Evidence:** `evidence/task-2-2-template-preflight-r6/preflight.json` is green with exact source/template equality, exact route, model calls `0`, and terminal server/project cleanup. `evidence/task-2-2-template-candidate-r1/raw.json` failed during a new server's command-inventory readiness before sessions or provider calls; its project was removed. `evidence/task-2-2-template-candidate-r1-replay-r1/evaluation.json` terminally records cleanup complete and both semantic observations absent. A process-table and PTY check found no surviving proof process.
- **Outcome:** No generated proposal/archive observation was obtained. The candidate source remains at MVP from the independent primary/guard proof, but tasks 2.2, 3.3, and 5.1 cannot claim integrated command qualification.
- **Reason:** The final fallback encountered a server-inventory readiness failure before generation. Repeating it would prolong a qualification-only lane after the actual command entry point was already proven incompatible and no accepted product defect was identified.
- **Do Not Repeat Condition:** Do not rerun this runtime, add another command wrapper, change model spelling/route, or continue qualification ceremony around the same missing integrated observation.
- **Evidence-Based Retry Condition:** Only a compatible/fixed OpenCode runtime that accepts the configured provider-qualified command route may reopen the lane. First rerun the exact provider-free server/template gate; if green, permit one create-new bounded integrated command capture. Installation/update/activation remains separately owner-controlled and outside this change.
