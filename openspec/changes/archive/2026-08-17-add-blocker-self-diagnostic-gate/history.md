# Strategy History

## 2026-08-17 - Optional self-diagnosis skill

- **Objective:** Ensure that a primary deeply rechecks its own configuration and assumptions when a technical blocker appears.
- **Approach:** Add a dedicated optional self-diagnosis skill containing the full checklist and rely on the primary to discover and load it when needed.
- **Evidence:** The reproduced incident reached a blocker because the primary trusted a stale component id and wrong observation path until the user challenged those assumptions. Current skill routing is recognition-based, while `global/AGENTS.md` is always loaded and `troubleshooter` already owns independent pre-escalation diagnosis.
- **Outcome:** Rejected as the primary trigger; a future skill may contain optional detail but cannot own activation.
- **Reason:** The failure mode is precisely that the primary does not recognize its model of the system as suspect, so an optional skill can remain undiscovered at the moment it is needed.
- **Do-Not-Repeat Condition:** Do not propose an optional skill as the sole or primary blocker trigger while loading still depends on the same primary recognizing the diagnosis need.
- **Evidence-Based Retry Condition:** Reconsider only if a runtime mechanism can deterministically load the skill from an observable blocker signal and same-model workflow evidence shows equal or better behavior with lower always-loaded context than the selected trigger.

## 2026-08-17 - New structured diagnostic verdict object

- **Objective:** Make completion-guard enforcement deterministic by adding a mandatory `diagnosticAssessment` object to the arbiter verdict schema.
- **Approach:** Extend `CompletionVerdict` schema version `1` or introduce a new schema version carrying blocker layer, assumptions, contradictions, observer qualification, probe, and claim ceiling as dedicated fields.
- **Evidence:** The current verdict already carries exact unresolved evidence gaps, next actions/evidence/stop conditions and repeated-strategy controls through `unresolved` and `strategyAssessment`; `buildContinuation` transports them to the root. The proposed diagnostic fields would still contain model-authored semantics that parsing can validate structurally but not prove correct.
- **Outcome:** Rejected for the current increment.
- **Reason:** It adds schema, compatibility, projection, fixture, and replay churn before installed behavior demonstrates that the existing fields cannot express the accepted continuation.
- **Do-Not-Repeat Condition:** Do not add diagnostic verdict fields merely to make the policy look more structured or to replace same-model behavior evidence.
- **Evidence-Based Retry Condition:** Reconsider as a separate change only if the installed grind-enabled technical-blocker scenario reproduces a required continuation or correlation fact that cannot be represented or enforced through the existing verdict fields.

## 2026-08-17 - Narrow extension of existing owners and proof routes

- **Objective:** Prevent premature technical/product/owner blocker claims while preserving ordinary local fixes, true owner boundaries, and bounded context.
- **Approach:** Put one concise signal-based trigger in always-loaded authority; keep detailed Material qualification in `change-ready-sdlc`; extend the existing `troubleshooter` and completion-arbiter contracts; and extend the existing pre-escalation and installed completion-guard proof runners with same-model baseline/candidate scenarios.
- **Evidence:** Source inspection found the exact current owners in `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, `global/agents/troubleshooter.md`, `global/agents/session-completion-arbiter.md`, `tools/proofs/pre-escalation-recovery.ts`, and `tools/proofs/session-completion-guard-autonomous.ts`. The current pre-escalation runner already covers safe-local, stale-path, uncertain-owner, exhausted-technical, and owner-only controls but not an invalid measurement source.
- **Outcome:** Selected as the implementation strategy in `design.md` and `tasks.md`; no production or proof-runner implementation has been attempted yet.
- **Reason:** It reuses cohesive owners, adds no dependency or optional activation gap, provides a first provider-free signal before model calls, and allows baseline/candidate behavior comparison without precommitting to a new runtime schema.
- **Do-Not-Repeat Condition:** Do not split the same policy into another skill, agent, top-level workflow, or proof runner unless a current owner is proven unable to satisfy its accepted responsibility.
- **Evidence-Based Retry Condition:** Revisit owner boundaries only if provider-free preflight or installed same-model proof produces a concrete cohesion, representation, permission, visibility, or lifecycle defect that cannot be corrected within the selected owners.

## 2026-08-17 - OpenSpec PowerShell shim invocation

- **Objective:** Read the change status and apply instructions after the apply operation gate passed.
- **Approach:** Invoke `openspec status` and `openspec instructions apply` through PowerShell command resolution.
- **Evidence:** Both commands stopped before OpenSpec ran with `PSSecurityException` because the resolved `openspec.ps1` shim is blocked by the current execution policy. The precise process exit code was not exposed and is recorded as `unknown`; neither command produced OpenSpec JSON or side effects.
- **Outcome:** Rejected for this environment.
- **Reason:** PowerShell selected the script shim even though the installed package also provides an executable command shim.
- **Do-Not-Repeat Condition:** Do not invoke bare `openspec` from this PowerShell host while the current execution policy blocks `openspec.ps1`.
- **Evidence-Based Retry Condition:** Retry bare `openspec` only if command resolution or execution policy changes; use the verified `openspec.cmd` shim for this session.

## 2026-08-17 - npm PowerShell shim invocation

- **Objective:** Exercise the maintained pre-escalation proof entry point with `--help` before provider-free preflight.
- **Approach:** Invoke `npm run proof:pre-escalation-recovery -- --help` through PowerShell command resolution.
- **Evidence:** PowerShell stopped before npm or the proof runner ran with `PSSecurityException` because the resolved `npm.ps1` shim is blocked by the current execution policy. The precise process exit code was not exposed and is recorded as `unknown`; the planned evidence root remained absent.
- **Outcome:** Rejected for this environment.
- **Reason:** PowerShell selected the script shim rather than the installed executable command shim.
- **Do-Not-Repeat Condition:** Do not invoke bare `npm` from this PowerShell host while the current execution policy blocks `npm.ps1`.
- **Evidence-Based Retry Condition:** Retry bare `npm` only if command resolution or execution policy changes; use the verified `npm.cmd` shim for this session.

## 2026-08-17 - Provider-free blocker scenario preflight

- **Objective:** Establish the first real provider-free signal for the broken-observer, qualified-absence, straightforward-local-defect, and owner-only scenarios before loaded authority mutation.
- **Approach:** Extend the existing pre-escalation runner with scenario-specific exact command permissions, disposable semantic fixtures, evaluator facts, and accepted/rejected oracle controls; invoke its maintained npm entry point through `npm.cmd`.
- **Evidence:** `--help` exited `0` without an evidence root. Preflight exited `0` with `modelCalls: 0`, 16 fixture scenarios, `cleanup: removed`, no failure, exact allowed-command readback, accepted oracle results `true`, deliberately incomplete results `false`, and an immutable manifest at `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-task-1-1-preflight`. `npm run test:focused:contracts` reported `OK: contracts tests=68`.
- **Outcome:** Selected and green for task 1.1.
- **Reason:** It exercises the maintained proof entry point and evaluator without mutating loaded authority or consuming provider calls.
- **Do-Not-Repeat Condition:** Do not rerun this exact preflight unless the runner, evaluator, permission policy, fixture semantics, or dependent source identity changes.
- **Evidence-Based Retry Condition:** Rerun with a new evidence root after a dependent mutation or if manifest readback identifies drift.

## 2026-08-17 - Provider-free completion-guard technical-blocker evaluator

- **Objective:** Prove that the installed guard runner can represent and evaluate the technical-blocker continuation through existing schema-v1 fields before current-source provider capture.
- **Approach:** Extend `session-completion-guard-autonomous.ts` with one no-question technical-blocker scenario, continuation payload/correlation facts, shared scenario oracles, create-new evidence manifests, and provider-free `preflight`/`replay` modes without changing guard production schema.
- **Evidence:** `--help` exited `0` without effects. Preflight exited `0` with `modelCalls: 0`, the accepted technical fixture green, five incomplete/unsafe variants rejected (`allow-stop`, `owner-required`, `no-continuation`, `stale-continuation`, `leaked-ownership`), and all three prior scenario oracles green at `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-task-1-2-preflight`. Provider-free replay over the preserved accepted raw fixture exited `0` with `candidateOraclePass: true`, `cleanupComplete: true`, and `replayComplete: true` at `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-task-1-2-replay`. `npm run test:focused:session-completion-guard` reported `OK: session completion guard tests=35`. Production `CompletionVerdict` type and parser files have no diff.
- **Outcome:** Selected and green for task 1.2.
- **Reason:** Existing `unresolved`, strategy, audit, and inspected-revision fields can carry the required stale-safe continuation evidence; no schema widening is justified.
- **Do-Not-Repeat Condition:** Do not add a diagnostic verdict object or rerun this exact fixture without a dependent runner/evaluator/source mutation.
- **Evidence-Based Retry Condition:** Rerun with create-new roots after such a mutation or if installed baseline capture exposes an unrepresentable continuation fact.

## 2026-08-17 - Unsupported opencode source-inventory flag

- **Objective:** Inspect active OpenCode runtime sources before baseline capture.
- **Approach:** Invoke `npm run opencode:sources -- --format json`.
- **Evidence:** The maintained CLI rejected `--format` as unknown and printed supported usage with only `--root` and help. The precise process exit code was not exposed and is recorded as `unknown`; no source or runtime state was changed.
- **Outcome:** Rejected command shape.
- **Reason:** The current CLI does not implement the planned JSON-format option.
- **Do-Not-Repeat Condition:** Do not pass `--format` to `opencode:sources` in this candidate.
- **Evidence-Based Retry Condition:** Use the supported default output with an explicit `--root` only when source readback becomes the active task.

## 2026-08-17 - Assumed OpenCode command shim

- **Objective:** Inspect the installed `opencode serve` help before launching the proof-owned guard server.
- **Approach:** Resolve and invoke `opencode.cmd` through PowerShell.
- **Evidence:** `Get-Command opencode.cmd` returned `CommandNotFoundException`; the help command never ran. The precise process exit code was not exposed and is recorded as `unknown`; no server or runtime state was created.
- **Outcome:** Rejected executable assumption.
- **Reason:** This installation does not expose an `opencode.cmd` shim on the PowerShell path used by the session.
- **Do-Not-Repeat Condition:** Do not assume a `.cmd` OpenCode shim exists.
- **Evidence-Based Retry Condition:** Resolve the installed OpenCode executable by enumerating the exact command name/path, then invoke that verified path.

## 2026-08-17 - Current-source same-profile baseline

- **Objective:** Freeze current loaded primary, `troubleshooter`, and completion-guard behavior before any candidate authority, agent, arbiter, or validator mutation.
- **Approach:** Use profile `quality-independent` with primary/troubleshooter route `openai/gpt-5.6-sol/xhigh`, the profile's configured hidden arbiter route `xai/grok-4.6/high`, fixed synthetic inputs, exact scenario permissions, disposable roots, and create-new evidence bundles. Capture `broken-observer`, `qualified-absence`, `straightforward-local-defect`, `owner-only`, `exhausted-technical`, and the installed grind-enabled `technical-blocker` guard lane.
- **Evidence:** Primary/troubleshooter source identity includes `global/AGENTS.md` `7f4bed644510ed83f519a2d8a587e2a831ed778e9945cdec7eed84e9d127c603`, `global/agents/troubleshooter.md` `fa5eabe1b5b0c8a3158ba82dcafe07b80efdf15d0de565df61cdd6fd1b0faf18`, and `global/skills/change-ready-sdlc/SKILL.md` `ef99bcc9af249bc0878d7bd6c2e6aba25b28ab7aec033a22bbb092906b9b9a6d`. The composed evaluator reported `baselineComplete: true` for five rows; the explicit controls each used only their allowed command, no question, no file drift, and complete cleanup, while `exhausted-technical` used exactly one consultation and one authorized recovery command. Bundles: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-baseline-pre-escalation`, `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-baseline-pre-escalation-troubleshooter`, and composed evaluation `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-baseline-pre-escalation-composed-evaluation`.
- **Evidence:** The installed OpenCode `1.18.18` server loaded `D:\home\sergey-akhalkov\opencode-kit\global\opencode.json`; its technical-blocker raw bundle used input digest `7f2961d0ccec396a31779109f8ce6f0665beca8ad40d7ec6cdeafd0fb6a75e1a` and arbiter source hash `ac7fb54e9fbce0bd86d5288fb4333c65342d646a1825ff48d937718346a1c2d8`. The baseline guard returned `passed`, zero continuations, no claim ceiling, and no owner leak. Root/child deletion and liveness closure were true, the server process terminated, port `51067` was closed, and provider-free replay reported `replayComplete: true` at `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-baseline-guard-replay`. Raw bundle: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-baseline-guard`.
- **Outcome:** Selected as Candidate Reference `current-source-baseline-2026-08-17`. The primary/troubleshooter controls already satisfy their explicit prompts; the reproduced decision-changing gap is completion-guard `allow_stop`/`passed` on incomplete technical diagnosis.
- **Reason:** It captures the actual loaded routes before Product Candidate mutation and isolates the required continuation defect without target-project or protected effects.
- **Do-Not-Repeat Condition:** Do not rerun this baseline against mutated loaded authority or overwrite any baseline bundle.
- **Evidence-Based Retry Condition:** Never retry as baseline; use candidate capture with the same profile, fixed inputs, permissions, environment class, and preserved baseline roots after candidate preflight is green.

## 2026-08-17 - Narrow extension of loaded diagnostic owners

- **Objective:** Add the accepted blocker self-diagnostic behavior without a new skill, workflow, schema, dependency, or duplicated portable policy.
- **Approach:** Extend the existing always-loaded trigger in `global/AGENTS.md`, Material evidence qualification in `change-ready-sdlc`, diagnosis case/report in `troubleshooter`, and schema-v1 continuation instruction in `session-completion-arbiter`; extend only their existing marker arrays, validator, focused mutation controls, and proof inventory.
- **Evidence:** Reuse disposition remains `reuse + narrow extension`; cross-project reuse is `not-applicable` because these are current portable kit owners. Product source identities after the edit are `global/AGENTS.md` `ed9a22d3d1ee77656c9fe3c9d0895835649909a2`, `global/skills/change-ready-sdlc/SKILL.md` `a09aa8b32e8ed267edc35206a1abbcd26cd603d7`, `global/agents/troubleshooter.md` `ea65245b2e80cb8a8cb23c1642c3d421a7723a02`, and `global/agents/session-completion-arbiter.md` `59435fd3fd1a68ac3a3805e6b55d25a8ebbc889f`. `CompletionVerdict` remains schema version `1` with no `diagnosticAssessment` object and no diff in production type/parser owners.
- **Evidence:** Deterministic contracts reject removal of the global trigger, layer classification, observer qualification/positive control, causally distinct probe, claim ceiling, arbiter continuation, one-consultation limit, owner-only bypass, and troubleshooter report fields. `npm run test:focused:contracts` reported `OK: contracts tests=69`; `npm run test:focused:session-completion-guard` reported `OK: session completion guard tests=35`; `npm run test:focused:model-routing` reported `OK: model profile tests=16`; `npm run validate:strict` reported `OK: skills=29 agents=18 markdown=462 warnings=0 infos=2`.
- **Outcome:** Selected and structurally green for tasks 2.1-2.2. Product Candidate mutation returns `Development-Stage` to `development` pending candidate runtime proof.
- **Reason:** The selected owners already control activation, detailed evidence, independent diagnosis, stop/continue adjudication, and deterministic drift detection.
- **Do-Not-Repeat Condition:** Do not copy the complete checklist into pointer mirrors, add fuzzy semantic scoring, widen permissions, or add verdict fields absent reproduced representation failure.
- **Evidence-Based Retry Condition:** Correct only a reproduced current-scope source/contract defect from provider-free preflight or candidate runtime capture, then rerun affected proof/validation lanes.

## 2026-08-17 - Provider-free candidate loader preflight

- **Objective:** Prove the candidate's loaded sources, profile permissions, fixture/evaluator behavior, and cleanup before configured-provider capture.
- **Approach:** Invoke both maintained runner help paths, pre-escalation candidate preflight, technical-guard candidate preflight/replay, installed permission proof, supported runtime-source inventory, focused contracts, model routing, and strict validation.
- **Evidence:** Pre-escalation preflight reported `modelCalls: 0`, `cleanup: removed`, 16 scenarios, exact proof permissions, restricted `troubleshooter` subagent, disabled MCP, and OpenCode `1.18.18`. Candidate SHA-256 identities include `global/AGENTS.md` `71aa8f5463273e76b909570ff78d3805568a5e0069bd806b27c512e3bffa2a46`, `global/skills/change-ready-sdlc/SKILL.md` `b9caeddd020cbb472d44d3b100e88bfe122acf0fbad3cfa0212e22385d3843be`, `global/agents/troubleshooter.md` `e0a5397721dd723ea86491fabd46dda0e07c4adc6a9b4b0bd3305360bca7ae64`, and `global/agents/session-completion-arbiter.md` `38c81616593aadc8a65b48375f2f2d22ee1cc5ad05252706e85a4b59d199748c`. Evidence: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-preflight`.
- **Evidence:** Guard preflight accepted the compliant fixture, rejected all five unsafe variants, retained three existing controls, and replayed terminal green with zero model calls. Installed permission proof reported `hiddenArbiterTools: all-false`, `specialistRestrictions: preserved`, and `status: complete`. Evidence roots: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-guard-preflight`, `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-guard-replay`, and `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-permissions`.
- **Evidence:** Runtime inventory found layered config sources but `unattended.collisionStatus: clear`; canonical OpenSpec commands/skills, guard origin, helper resolution, global authority, arbiter, troubleshooter, and change-ready skill all resolve to the custom kit source. Focused contracts/model routing and strict validation remain green from the immediately preceding candidate checks.
- **Outcome:** Selected and green for task 3.1; configured-provider candidate capture is unlocked. `Development-Stage` remains `development` until runtime behavior is green.
- **Reason:** Actual loader/config/permission readback removes source-identity and permission ambiguity without provider calls.
- **Do-Not-Repeat Condition:** Do not repeat candidate preflight unless a dependent Product Candidate, runner, evaluator, environment, or permission source changes.
- **Evidence-Based Retry Condition:** Rerun only the affected provider-free lane with a create-new evidence root after such a mutation.

## 2026-08-17 - Candidate primary and troubleshooter runtime proof

- **Objective:** Prove the loaded candidate handles broken observer, qualified absence, straightforward local defect, true owner-only, and exhausted technical recovery through actual primary/consultant routes without a question or unauthorized effect.
- **Approach:** Capture the same five fixed scenarios with profile `quality-independent`, primary/troubleshooter route `openai/gpt-5.6-sol/xhigh`, identical prompts/permissions/environment class, and the preserved current-source baseline; evaluate baseline and candidate provider-free.
- **Evidence:** All five bundles carry identical candidate hashes: `global/AGENTS.md` `71aa8f5463273e76b909570ff78d3805568a5e0069bd806b27c512e3bffa2a46`, `global/skills/change-ready-sdlc/SKILL.md` `b9caeddd020cbb472d44d3b100e88bfe122acf0fbad3cfa0212e22385d3843be`, `global/agents/troubleshooter.md` `e0a5397721dd723ea86491fabd46dda0e07c4adc6a9b4b0bd3305360bca7ae64`, and `global/agents/session-completion-arbiter.md` `38c81616593aadc8a65b48375f2f2d22ee1cc5ad05252706e85a4b59d199748c`. Candidate capture exited `0`, completed five scenarios, removed every disposable root/session, and preserved manifest `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-pre-escalation-r1\manifest.sha256.json`.
- **Evidence:** Provider-free comparison reported `baselineComplete: true`, `candidateComplete: true`, and five passing candidate oracles. Broken observer executed one allowed probe, reported proof-runner layer/unqualified observer/contradiction/claim ceiling, used no consultant, asked no question, and preserved files. Qualified absence and straightforward defect each used only their exact command with no consultant/question. Owner-only used no command/consultant/question. Exhausted technical used exactly one consultation and one authorized recovery command. Evaluation: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-evaluation-r1`.
- **Outcome:** Working primary/troubleshooter happy path for Candidate Reference `self-diagnostic-candidate-r1`; `Development-Stage: MVP`. Accepted completion-guard scope remains pending.
- **Reason:** This is the first actual loaded candidate boundary required by the accepted outcome; deterministic source checks alone were insufficient.
- **Do-Not-Repeat Condition:** Do not rerun this unchanged candidate/corpus for another equivalent verdict.
- **Evidence-Based Retry Condition:** Rerun affected candidate scenarios only after Product Candidate mutation or new decision-changing evidence identifies a distinct reachable defect.

## 2026-08-17 - Provider-free guard-question cleanup lock

- **Objective:** Validate existing question, owner, structured-continuation, and consultation controls after the candidate technical guard capture passed.
- **Approach:** Invoke `npm run proof:guard-question` once against its in-memory SDK and disposable SQLite projection fixture.
- **Evidence:** Both scenario matrices printed their expected autonomous/owner/continuation facts, then Bun failed terminal fixture removal with `EBUSY: resource busy or locked, rm '<temp>/grind-question-projection-<id>'`. The precise process exit code was not exposed and is recorded as `unknown`. No provider/server/product action was involved; the failure is classified as Proof Runner cleanup.
- **Outcome:** Validation incomplete; no unchanged retry is allowed yet.
- **Reason:** A disposable projection resource remained open when cleanup attempted to remove its directory on Windows.
- **Do-Not-Repeat Condition:** Do not rerun the unchanged command or weaken cleanup assertions.
- **Evidence-Based Retry Condition:** Inspect the projection fixture ownership, close the exact remaining handle through the existing owner, and run the corrected provider-free command once; Product Candidate runtime bundles remain valid because this runner is not in their driven path.

## 2026-08-17 - Shared proof fixture cleanup retry

- **Objective:** Close the provider-free guard-question cleanup defect through the repository's existing Windows-aware fixture owner.
- **Approach:** Replace the proof's duplicate 10-attempt/2.75-second removal loop with `removeProofFixture`, which uses `fs.rmSync` with 50 retries, 200 ms delay, and post-removal verification.
- **Evidence:** All behavioral matrices again passed, but the shared helper exhausted its retry budget and returned the same `EBUSY` on the new disposable `grind-question-projection-<id>` directory. The precise process exit code was not exposed and is recorded as `unknown`.
- **Outcome:** Rejected; no terminal cleanup progress. The failure chain is stagnant after two materially similar removal attempts.
- **Reason:** Retry duration is not causal; an in-process SQLite/resource owner remains live through final cleanup.
- **Do-Not-Repeat Condition:** Do not add retries, delays, force flags, or rerun either cleanup loop unchanged.
- **Evidence-Based Retry Condition:** Identify the retained file/handle and change its ownership or process boundary so cleanup occurs only after the owner terminates; then run one provider-free proof attempt.

## 2026-08-17 - Child-process projection ownership

- **Objective:** Make provider-free guard-question projection cleanup terminal on Windows without weakening cleanup or changing Product Candidate behavior.
- **Approach:** Reuse the existing `session-completion-guard-long-run.ts --internal-project` child-process projection boundary, then invoke the shared fixture cleanup only after the child exits.
- **Evidence:** Both failed fixture directories contain only `opencode.db`; writer `Database.close()` and `readSessionDeliveryContext`'s `finally` close are present, yet Bun retains the file through parent cleanup. The maintained long-run proof already places the same projection read in a child specifically before parent fixture removal.
- **Outcome:** Selected as the causally distinct correction; validation pending one provider-free proof run.
- **Reason:** Process termination, unlike retry duration, gives the OS an explicit SQLite handle-lifetime boundary.
- **Do-Not-Repeat Condition:** Do not restore in-process projection reads for disposable Bun SQLite fixtures on this Windows proof path.
- **Evidence-Based Retry Condition:** Run the corrected provider-free proof once; any further failure must identify a different retained resource before another attempt.

## 2026-08-17 - Projection child did not release parent writer lock

- **Objective:** Validate the child-process projection correction.
- **Approach:** Run the provider-free question proof once with projection isolated in the maintained short-lived child.
- **Evidence:** Behavioral matrices remained green and the projection child exited successfully, but parent cleanup still returned `EBUSY` on a new directory containing only `opencode.db`. The precise process exit code was not exposed and is recorded as `unknown`.
- **Outcome:** Rejected as the complete cause; the read-only projection handle is not the retained parent lock.
- **Reason:** The parent still creates five temporary Bun prepared statements via `db.prepare(...).run(...)`; unlike the working long-run proof's direct `db.run(...)` calls, those statement objects are not explicitly finalized before `db.close()`.
- **Do-Not-Repeat Condition:** Do not retry child-isolation alone or add cleanup delay.
- **Evidence-Based Retry Condition:** Remove temporary statement ownership by using the existing direct `Database.run` pattern, retain explicit `db.close()`, and run one provider-free attempt.

## 2026-08-17 - Candidate installed guard and controls

- **Objective:** Prove incomplete technical diagnosis continues through existing schema-v1 fields while autonomous question and exact protected-owner behavior remain unchanged.
- **Approach:** Start one fresh loopback OpenCode `1.18.18` server from the candidate custom source, run `technical-blocker`, `autonomous`, and `mixed-protected` serially with primary route `openai/gpt-5.6-sol/xhigh` and configured arbiter route `xai/grok-4.6/high`, then replay every raw bundle provider-free and run component/focused controls.
- **Evidence:** Technical candidate input digest matches baseline `7f2961d0ccec396a31779109f8ce6f0665beca8ad40d7ec6cdeafd0fb6a75e1a`; arbiter source hash is `38c81616593aadc8a65b48375f2f2d22ee1cc5ad05252706e85a4b59d199748c`. It returned `continued`, one synthetic schema-v1 continuation, revision/audit correlation true, claim ceiling true, zero questions, no owner leak, and complete root/child cleanup. Raw/replay roots: `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-guard-technical-r1` and `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-candidate-guard-technical-r1-replay`.
- **Evidence:** Autonomous control returned one answered safe question, one autonomous ref, final `passed`, no human reply, and complete cleanup. Protected control returned final `owner-required`, no synthetic answer, no autonomous ref, no redundant consultation, and complete cleanup. Raw/replay roots use `candidate-guard-autonomous-r1`, `candidate-guard-autonomous-r1-replay`, `candidate-guard-owner-r1`, and `candidate-guard-owner-r1-replay` under `C:\Users\noilw\AppData\Local\Temp\opencode\`. The server stopped, port `54355` closed, and all three replay evaluators reported `candidateOraclePass: true`, `cleanupComplete: true`, `replayComplete: true`, `modelCalls: 0`.
- **Evidence:** The provider-free `proof:guard-question` cleanup failure was corrected by reusing the maintained projection child and direct `Database.run` writer pattern; its final invocation exited `0` with both matrices green. Three failed proof-owned orphan directories were removed and verified absent. `npm run test:focused:session-completion-guard` reported `OK: session completion guard tests=35`.
- **Outcome:** Candidate Reference `self-diagnostic-candidate-r1` has complete accepted production scope and current Runtime Proof. `Development-Stage: MVP`.
- **Reason:** The actual installed guard now distinguishes incomplete technical diagnosis from a valid owner boundary without regressing existing question behavior.
- **Do-Not-Repeat Condition:** Do not rerun the unchanged installed candidate or its equivalent guard scenarios for another verdict.
- **Evidence-Based Retry Condition:** Rerun only affected lanes after Product Candidate/runner/environment mutation or a newly evidenced distinct reachable critical defect.

## 2026-08-17 - Fresh Material SDET and main disposition

- **Objective:** Challenge candidate `self-diagnostic-candidate-r1` for only reachable critical incidents after current MVP proof and complete accepted production scope.
- **Approach:** Dispatch fresh test-only `sdet-quality-engineer` session `ses_fef8d0af5ffeWdicjqA6OcmNh4` with production/proof/instruction/config read-only, provider recapture forbidden, preserved bundles supplied, and test-only write scope limited to a smallest critical oracle if required.
- **Evidence:** SDET returned `Action: no-critical-risk`, `Effective Model: xai/grok-4.6`, exact candidate/hash attribution, five risk rows, no test changes, no execution request, no live writer/session/process, and immutable provider-free replay roots. Its first pre-escalation evaluate lacked the separate exhausted-technical baseline override and correctly exited non-green; the composed replay then reported `baselineComplete: true`, `candidateComplete: true`, five candidate oracles. Technical/autonomous/owner guard replays each reported `candidateOraclePass: true`, `cleanupComplete: true`, `replayComplete: true`, and `modelCalls: 0` under `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-sdet-r1-*`.
- **Evidence:** Main disposition: `SDG-FALSE-OWNER-ESCALATION-001` not reproduced by broken-observer/technical/owner controls; `SDG-PROTECTED-QUALIFICATION-BYPASS-001` unreachable in the enforced proof envelope and contradicted by exact no-protected-effect authority, tool permissions, owner-only, and mixed-protected observations; `SDG-UNSAFE-LIVE-REPEAT-001` not reproduced and blocked by one exact observer probe plus unchanged live-attempt replay policy; `SDG-DIRECT-EVIDENCE-LOSS-001` not reproduced because direct contradiction/layer/claim markers and unchanged manifests are current; `SDG-UNBOUNDED-CONSULT-LOOP-001` not reproduced because exhausted technical used one consultation, owner/broken used zero, and technical guard produced one continuation. Marker-level semantic generalization remains a documented non-critical limitation, not a confirmed incident.
- **Outcome:** Terminal Material SDET state `no-critical-risk`; no confirmed critical/non-deferrable correction and no test-only artifact. Candidate remains `Development-Stage: MVP` pending complete validation. No equivalent SDET rerun is allowed for the unchanged candidate and hypotheses.
- **Reason:** Every reported critical class has current main-verifiable evidence and none authorizes production mutation; additional synthetic coverage would be optional rather than a reproduced current-outcome correction.
- **Do-Not-Repeat Condition:** Do not seek another SDET verdict or configured-provider recapture for this unchanged candidate/hypothesis set.
- **Evidence-Based Retry Condition:** Fresh SDET is eligible only after a main-confirmed critical defect and production correction, another Product Candidate mutation materially changing reachable critical behavior, or new decision-changing evidence identifying a distinct reachable critical hypothesis, after current proof is restored.

## 2026-08-17 - Full-test current-worktree collision

- **Objective:** Run the task 5.1 project-native `npm test` gate against the current workspace without disturbing unrelated work.
- **Approach:** Invoke the exact package test command once through the installed `npm.cmd` with serial Node test concurrency and preserve its complete PTY output.
- **Evidence:** Exit `1`; 4 library fixtures failed after current `tools/validators/opencode-config.ts` required the concurrently developed roadmap launcher tuple. The failing diagnostics name only missing `__OPENCODE_CONFIG_DIR__/extensions/roadmap-mission-launcher.ts` entries/options in temporary validator fixtures. The current unrelated diff is `global/opencode.json.template` +6, `tools/validators/opencode-config.ts` +15, and `tools/test-library/validator-1.ts` +16/-42; none is part of Candidate Reference `self-diagnostic-candidate-r1`. Candidate-focused cases, including the troubleshooter permission contract, passed. Full raw output remains in PTY `pty_2d4ff2a1`. The first detached-worktree setup at the descriptive temp path failed before materialization with Git `Filename too long`; Git registered no worktree and left no path.
- **Outcome:** Task 5.1 remains open. Classification is current-worktree Environment/composition interference, not Product Candidate, Proof Runner, Evaluator, or Authority failure. Direct retry in the unchanged mixed worktree is prohibited.
- **Reason:** The broad command included concurrent roadmap validation semantics outside this change's candidate ownership, so its non-zero result cannot support a self-diagnostic Product Candidate claim.
- **Do-Not-Repeat Condition:** Do not rerun `npm test` in the unchanged mixed worktree, reuse the overlong worktree path, or modify/revert the unrelated roadmap validator, template, or fixtures.
- **Evidence-Based Retry Condition:** The absent path and absent worktree registration permit one causally identical setup at a substantially shorter approved temp path. Run the same command once there with only this change's exact tracked diff and shared read-only dependencies; a green result qualifies this candidate while the mixed-worktree collision remains reported, and a candidate-attributable failure returns to its owning lane.

## 2026-08-17 - Isolated candidate environment correction

- **Objective:** Falsify the mixed-worktree collision against byte-exact Candidate Reference `self-diagnostic-candidate-r1` in a disposable detached worktree.
- **Approach:** Materialize detached `HEAD` at the approved short path `C:\Users\noilw\AppData\Local\Temp\opencode\sdg-v1`, stage the thirteen candidate paths, replace Git-converted line endings with byte-exact source copies, verify every current/staged SHA-256 equality, link the existing dependency tree, then invoke the exact `npm test` command.
- **Evidence:** All thirteen candidate files matched current bytes before execution, including the four frozen Product Candidate hashes and both proof owners; `git diff --check` was green. Exit `1` then exposed that detached `HEAD` supplied an old `tools/test-library/agent-permissions.ts` importing removed `ALLOWED_TROUBLESHOOTER_EDIT_RULES`, while the proven current environment uses scalar `TROUBLESHOOTER_PERMISSION`. The parallel `tools/test-session-completion-guard.ts` failure also ran against detached `HEAD` rather than the current controller environment hash already recorded by runtime proof. No candidate file changed.
- **Outcome:** This isolated result is an Environment-identity mismatch and does not qualify or reject the candidate. Task 5.1 remains open.
- **Reason:** The candidate intentionally preserved pre-existing scalar troubleshooter permissions and the existing current completion-guard controller; both are proven dependencies but were omitted by the initial `HEAD` isolation manifest.
- **Do-Not-Repeat Condition:** Do not rerun the incomplete `HEAD` environment, broaden isolation to concurrent roadmap validator/template changes, or reinterpret the stale import as a candidate defect.
- **Evidence-Based Retry Condition:** Copy only current `tools/test-library/agent-permissions.ts` and `global/extensions/session-completion-guard/controller.ts` into the proof-owned worktree, verify their hashes (controller expected `92d3b7fd3e1205fe3c81aaf24b103ad3eaba1f9e08da99268c685e8b441ee0c2`), run the two affected suites first, and rerun exact full `npm test` only after that focused probe is green.

## 2026-08-17 - Isolated environment manifest completion

- **Objective:** Complete the smallest observed environment dependency manifest before a final full-test attempt.
- **Approach:** Stage current `tools/test-library/agent-permissions.ts` and completion-guard controller, verify exact hashes, then run only `tools/test-library.ts` and `tools/test-session-completion-guard.ts`.
- **Evidence:** The scalar permission import and controller mismatch were resolved. Library retained exactly five stale detached-`HEAD` mutation cases looking for structured troubleshooter bash/edit/skill rules, while all ordinary current validator cases passed; current `tools/test-library/validator-1.ts` is the matching pre-existing owner. Guard tests passed through the current controller cases except three Bun subprocesses whose sole diagnostic was `Cannot find package 'opencode-pty'` from `global/extensions/opencode-pty-bridge.ts`; current `global/node_modules/opencode-pty` exists, while the disposable worktree lacked that ignored dependency tree.
- **Outcome:** Focused validation remains red only for two proven Environment omissions; no Product Candidate behavior or source changed.
- **Reason:** Git worktrees cannot materialize modified pre-existing test owners or ignored installed dependencies from `HEAD`; root `node_modules` does not replace the separate `global/node_modules` package boundary.
- **Do-Not-Repeat Condition:** Do not rerun with stale `validator-1.ts`, without `global/node_modules`, or include concurrent roadmap validator/template changes.
- **Evidence-Based Retry Condition:** Copy exact current `tools/test-library/validator-1.ts`, link current `global/node_modules` inside the proof-owned worktree, verify both identities, and rerun the same two focused suites once. Run full `npm test` only if both pass.

## 2026-08-17 - Complete validation and apply handoff

- **Objective:** Complete task 5.1 qualification on one current candidate without absorbing or reverting unrelated concurrent roadmap work.
- **Approach:** Complete the observed isolated environment manifest with current `tools/test-library/validator-1.ts` and the installed `global/node_modules` boundary, require green focused library/guard suites, run exact full `npm test`, then reconcile every named validation, source identity, proof replay, cleanup, rollback, limitation, SDET, lifecycle, and external-operation fact.
- **Evidence:** Focused isolated checks passed with `OK: library tests=151` and `OK: session completion guard tests=35`. Exact full `npm test` then exited `0` in PTY `pty_95b507b3` with all eleven Node test files green. The prior mixed-worktree exit `1` remains correctly attributed to the separate roadmap validator/template/fixture lane and is not hidden.
- **Evidence:** Current-workspace validation was green: `npm run validate:strict` reported `skills=29 agents=18 markdown=466 warnings=0 infos=2`; `npm run openspec:validate` reported 15 passed/0 failed; `npm run proof:permissions` reported OpenCode `1.18.18`, arbiter `toolsAllFalse: true`, and preserved specialist denials; `openspec validate add-blocker-self-diagnostic-gate --strict` reported valid; focused model routing reported 16 tests; instruction budget passed at 99937/100840 catalog and 16041/16659 global-authority token proxies; `git diff --check` found no whitespace error.
- **Evidence:** Final provider-free qualification evidence is `C:\Users\noilw\AppData\Local\Temp\opencode\add-blocker-self-diagnostic-gate-qualification-r1-*`: pre-escalation `baselineComplete: true`, `candidateComplete: true`, five rows; technical/autonomous/owner guard lanes each `candidateOraclePass: true`, `cleanupComplete: true`, `replayComplete: true`, `modelCalls: 0`, schema `1`. Installed-source readback selected the custom `global/AGENTS.md`, `change-ready-sdlc`, `troubleshooter`, and `session-completion-arbiter`; declared config collisions remained visible while unattended collision status was `clear`.
- **Evidence:** Final Product Candidate hashes remained `global/AGENTS.md` `71aa8f5463273e76b909570ff78d3805568a5e0069bd806b27c512e3bffa2a46`, `change-ready-sdlc/SKILL.md` `b9caeddd020cbb472d44d3b100e88bfe122acf0fbad3cfa0212e22385d3843be`, `troubleshooter.md` `e0a5397721dd723ea86491fabd46dda0e07c4adc6a9b4b0bd3305360bca7ae64`, and `session-completion-arbiter.md` `38c81616593aadc8a65b48375f2f2d22ee1cc5ad05252706e85a4b59d199748c`. Proof-owner hashes were `pre-escalation-recovery.ts` `82dcee940d5cd720394d1f82fc9c35d39048581c37a3cb8b27a530434a19780e` and `session-completion-guard-autonomous.ts` `c650f93d5a1ecea695a77b33a6626234358d21c0f87343c1d1c9910b4bc93400`; environment controller hash remained `92d3b7fd3e1205fe3c81aaf24b103ad3eaba1f9e08da99268c685e8b441ee0c2`.
- **Cleanup:** The proof-owned `sdg-v1` worktree was unregistered and removed, including its two junctions; its path is absent, only the primary worktree remains registered, proof ports 51067/54355 have zero listeners, and every validation PTY is terminal. Immutable evidence roots remain intentionally preserved.
- **Rollback:** Restore the prior version-controlled instruction/agent/arbiter, contract, validator, and proof-owner sources; make no provider call; preserve baseline/candidate evidence; remove any proof-owned runtime state before considering rollback complete. No rollback was executed.
- **Known Non-Critical Limitations:** Instruction-level reasoning can still omit or misclassify assumptions; fixed marker-based synthetic scenarios cannot prove semantic quality or every diagnostic domain; source inventory proves presence rather than universal runtime precedence; declared config collisions require continued explicit source resolution; the current mixed worktree retains a separately owned roadmap fixture failure even though this exact candidate is green.
- **Critical SDET:** Terminal `no-critical-risk`; all five rows are main-dispositioned, no production correction followed, and no equivalent rerun is allowed for this unchanged candidate/hypothesis set.
- **External Operations:** None. No commit, push, install, activation, release, deployment, target-project mutation, credential use, protected effect, or remote-state mutation occurred.
- **Outcome:** Accepted scope is complete, current Runtime Proof is preserved, project-native candidate validation is green, and no known confirmed reachable critical/non-deferrable defect remains. Apply handoff is complete. Under the apply command's explicit lifecycle cap, RC history remains `none`, `Stable Candidate` remains `none`, and `Development-Stage: MVP`; separate archive/qualification handoff may assign the next monotonic RC without rerunning unchanged proof.
- **Do-Not-Repeat Condition:** Do not rerun configured-provider captures, unchanged SDET, the mixed-worktree full test, or another full isolated test for this candidate.
- **Evidence-Based Retry Condition:** Revalidate only a lane invalidated by a Product Candidate, proof owner, evaluator, environment, or accepted-semantics change, or by new decision-changing evidence of a distinct reachable defect.

## 2026-08-17 - Final history retrospective

This is the one task-6.1 retrospective. Apply, archive, compaction, generated tasks, and this task do not create a successor analysis.

| Matrix Cell | Evidence-Backed Candidate And Classification |
|---|---|
| Quality / Working Repository | **Candidate:** Independently substantiate the SDET result and exact candidate despite an unrelated dirty-tree failure. **Impact Horizon:** current change. **Concrete Consumers:** tasks 4.2 and 5.1. **Execution Class:** provider-free evaluator replay and disposable isolated validation. **Earliest Safe Point:** after fresh SDET and after the mixed-tree non-zero observation. **Invalidated Evidence:** none; no Product Candidate or runner mutation. **Observable Payback:** five green composed pre-escalation rows, three green guard replays, and exact full `npm test` exit `0`. **Disposition:** consumed by current tasks; no generated task. |
| Quality / opencode-kit | **Candidate:** Repair roadmap launcher requirements in the four stale validator fixtures. **Impact Horizon:** current separate roadmap change. **Concrete Consumers:** `add-autonomous-roadmap-mission-runtime` and mixed-worktree `npm test`. **Execution Class:** test-fixture correction. **Earliest Safe Point:** that change's owning validation task. **Invalidated Evidence:** its library/full-suite validation only. **Observable Payback:** the four launcher diagnostics disappear and mixed-worktree `npm test` can reach green. **Disposition:** deferred to the separate target owner; adding it here would cross change ownership and scope. |
| Cycle Speed / Working Repository | **Candidate:** Use a short approved worktree path plus byte-exact candidate and observed environment manifests. **Impact Horizon:** current qualification. **Concrete Consumers:** task 5.1. **Execution Class:** local process/proof staging. **Earliest Safe Point:** immediately after the descriptive path hit Windows length limits. **Invalidated Evidence:** only the incomplete isolated attempts. **Observable Payback:** exact hashes, focused 151/35 green, then one terminal full-suite pass. **Disposition:** consumed; no generated task. |
| Cycle Speed / opencode-kit | **Candidate:** Document or automate Windows `.cmd`/`.exe` resolution and short-path isolated validation. **Impact Horizon:** future Windows sessions. **Concrete Consumers:** none exact and current after this handoff. **Execution Class:** documentation/helper work. **Earliest Safe Point:** a separately owned recurring-tooling change with reproduced reuse. **Invalidated Evidence:** unknown until an owner is selected. **Observable Payback:** not currently measurable beyond this one run. **Disposition:** deferred non-checkbox record; no current-consumer admission. |
| Token Economy / Working Repository | **Candidate:** Use PTY exit notifications and focused causal probes before another full suite. **Impact Horizon:** current session. **Concrete Consumers:** the two long full-test lanes and environment diagnosis. **Execution Class:** process-only orchestration. **Earliest Safe Point:** before long-running tests and after each exact environment mismatch. **Invalidated Evidence:** none. **Observable Payback:** no duplicate provider calls and only one full run after focused 151/35 convergence. **Disposition:** consumed; no repository task. |
| Token Economy / opencode-kit | **Candidate:** none. **Impact Horizon:** N/A. **Concrete Consumers:** none. **Execution Class:** N/A. **Earliest Safe Point:** N/A. **Invalidated Evidence:** none. **Observable Payback:** N/A. **Disposition:** no work invented. |

### Session-Derived Improvements

None admitted. Current-consumer candidates were already completed by tasks 4.2/5.1; the roadmap fixture defect belongs to another active change; remaining ideas have no exact current consumer. No generated checkbox or successor retrospective is authorized.
