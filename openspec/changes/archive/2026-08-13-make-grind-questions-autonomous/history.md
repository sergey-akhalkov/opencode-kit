# Strategy History

## 2026-08-13 - Existing proof and installed-runtime baseline

- **Objective**: Determine whether the current guard already resolves autonomous interactive questions at the actual installed OpenCode boundary.
- **Approach**: Inspected the current controller/spec/proof, current OpenCode 1.18.18 SDK declarations, active plugin/config inventory, focused guard suite, and session-delivery evidence. Ran `/enable-grind` in a disposable CLI root and two bounded configured-model prompts plus a custom primary-agent prompt requiring a question tool call.
- **Evidence**: `controller.ts` autonomous branch calls `question.reject` and later `promptAsync`; `buildArbiterAuditRequest` carries only a hashed request ref; verdict schema has no answer matrix; `tools/proofs/session-completion-guard-question.ts` exercises only `owner_required`; focused suite passed 27/27 without an autonomous question oracle. The three configured-model prompts emitted terminal markers without any question/tool event, so they are invalid-route evidence rather than product proof. Session-delivery reads for `ses_005d9e4e0ffebI7MgekPTl5bc0` and `ses_005d7c1d3ffeCbitXsG9WqY4kb` showed zero tool/question evidence. Active executable is 1.18.18 and configured plugin/SDK package is 1.18.15.
- **Outcome**: Confirmed contract and coverage defect. The current product does not select an option; the attempted model routes did not exercise the question boundary and cannot establish current behavior.
- **Reason**: Rejection is not an answer, no exact selection can be generated or validated, and the maintained proof excludes the autonomous branch.
- **Do Not Repeat**: Do not treat a terminal text marker, private owner-only `applyVerdict` call, or prompt that merely asks a model to use `question` as runtime proof without a recorded `question.asked` event and original tool observation.
- **Evidence-Based Retry Condition**: After the product carries exact question payloads and validated answer matrices through official `question.reply`, use a maintained runner that records a real question event, selected answer at the original tool boundary, downstream completion, and cleanup. A changed already-configured model route is allowed only when the prior route refusal and new route identity are preserved.

## 2026-08-13 - Prompt-only installed probe

- **Objective**: Exercise the installed question boundary with a constrained inline primary agent.
- **Approach**: Enabled grind in a disposable CLI root and launched a custom primary prompt requiring `question` as its first action.
- **Evidence**: The resolved runtime tool map still exposed unrelated tools. The model called `todowrite`, then `skill("question")`, then `list_mcp_resources`; no `question.asked` event or answer occurred. The process exited normally and emitted no success marker.
- **Outcome**: Invalid route, not product proof. No protected or repository effect occurred.
- **Reason**: CLI agent selection did not enforce the intended tool isolation, so prompt compliance could not force the real boundary.
- **Do Not Repeat**: Do not use an inline agent prompt as evidence of a question call unless the SDK request explicitly supplies a tool map and the event/tool part proves only `question` was enabled.
- **Evidence-Based Retry Condition**: Use the SDK against a fresh installed server, enumerate registered tools, set every tool false except `question`, and assert the real tool part plus downstream marker.

## 2026-08-13 - SDK-isolated installed question proof

- **Objective**: Prove the current candidate automatically selects and returns an offered option through the actual installed boundary.
- **Approach**: Started fresh OpenCode 1.18.18 servers from the current kit source and used a maintained SDK runner with only `question` enabled in a disposable root. The configured XAI arbiter classified the pending request; the runner evaluated root/tool/projection/child state and deleted sessions.
- **Evidence**: First successful product lane recorded one real `question` call, official log `replied ... [["Recommended"]]`, same-tool output and downstream `QUESTION_PROBE_SELECTED=Recommended`, final root `passed`, and no human reply. Two arbiter outputs used an invalid object answer row and were rejected before side effects; a later exact matrix succeeded. A capture against a server started before the final projection mutation correctly failed only its projection oracle. The current-server attempt exceeded the outer 300-second evaluator timeout while provider retries continued; preserved root later reached `passed`. Terminal offline evaluation then proved one confirmed request/call ref, one guard `answered` intervention with `Recommended`, zero human replies, marker true, child passed, and cleanup `rootDeleted=true, childrenDeleted=1`.
- **Outcome**: Current candidate reached MVP at the installed OpenCode boundary. Retry/recovery and evaluator-process loss did not prevent autonomous product completion.
- **Reason**: Explicit SDK tool isolation reached the real question owner, while exact answer validation prevented invented labels and persisted request/call provenance survived evaluator loss.
- **Do Not Repeat**: Do not rerun a provider attempt merely because the evaluator timed out; inspect and terminally evaluate the preserved root first. Do not run projection proof against a server process that predates a projection source mutation.
- **Evidence-Based Retry Condition**: Another live/provider run is permitted only after current production mutation invalidates this proof or a distinct accepted real lane requires it, with offline proof green and a freshly started server identity.

## 2026-08-13 - Accepted-scope matrix and fresh installed recapture

- **Objective**: Close the unattended question/race/retry/restoration matrix and refresh installed proof after production and arbiter-instruction mutation.
- **Approach**: Expanded the maintained production proof, not automated tests, across multi-select, human/disable/interrupt/stale/not-found races, capacity, duplicate idle, structured continuation, default-off, and metadata restoration. Ran one fresh tool-isolated installed question proof and one fresh retained-child retry transport proof.
- **Evidence**: `proof:guard-question` exited 0 with every matrix assertion green. OpenCode 1.18.18 on `127.0.0.1:41989` returned exact `Recommended` on the first arbiter result, completed the original question tool and downstream marker, reached root/child `passed`, projected one guard answer and zero human replies, and deleted the root. The 420-second runner wait completed inside a 600-second process envelope. The retry runner on `127.0.0.1:41990` returned `retryHasEvidence=false`, valid correlation, and `allow_stop`. Existing focused guard execution passed 20 PTY/task/default-off/disable lanes before seven stale test fixtures failed on the accepted schema/deleted legacy method.
- **Outcome**: Accepted production scope is complete and current installed happy path is green. Fresh SDET owns test-only synchronization and critical challenge.
- **Reason**: Production-owned replay now covers the behavior changes without violating Material test authorship; real runtime proof exercises the loaded entry point and official question owner.
- **Do Not Repeat**: Do not modify the stale automated-test fixtures under a production-author role, and do not interpret their missing `questionAnswers: null` or deleted correction helper as a production regression.
- **Evidence-Based Retry Condition**: Run another installed provider attempt only after a production/agent mutation or a main-confirmed SDET critical defect invalidates current proof. Test-only changes require focused/full validation but do not invalidate product runtime proof unless they expose a reproduced product defect.

## 2026-08-13 - Literal-label evaluator mismatch after production reduction

- **Objective**: Re-prove the reduced final production candidate at the installed question boundary.
- **Approach**: Started fresh OpenCode 1.18.18 on `127.0.0.1:41992` and ran the maintained tool-isolated installed proof.
- **Evidence**: Product facts were terminal green: one completed question, root/child `passed`, one confirmed synthetic ref, zero pending/human replies, projected answer equal to tool answer, and cleanup complete. The primary model offered and the arbiter returned the exact label `Recommended (Recommended)`. The evaluator alone failed because it hard-coded literal `Recommended`, including the downstream marker. Server log preserved the official reply but not the offered option structure; the runner deleted the root in `finally` as designed.
- **Outcome**: Evidence-only failure with one missing raw observation: the offered option labels/descriptions. No product defect was established and no live retry was authorized through the unchanged evaluator.
- **Reason**: The proof system prompt controls semantic option descriptions but the primary model may format labels. Product correctness requires selecting an exact offered label, not a fixed evaluator-authored literal.
- **Do Not Repeat**: Do not compare against literal `Recommended` or rerun live before the evaluator records the offered options and derives the expected safe label from the fixed description.
- **Evidence-Based Retry Condition**: Offline runner inspection must show structural capture of offered labels, exact selected-offered equality, the fixed safe-description label, dynamic downstream marker equality, projection equality, terminal state, and cleanup. The next run is bounded capture for the previously missing option observation and can become proof only if every terminal oracle is then green.

## 2026-08-13 - Final RC1 capture and qualification

- **Objective**: Close the missing option observation, prove the final reduced production candidate, and qualify the complete accepted scope.
- **Approach**: The runner captured offered labels/descriptions, selected answer, projection, dynamic downstream marker, root/child state, and cleanup. One fresh OpenCode 1.18.18 capture ran on `127.0.0.1:41993`, followed by the complete project validation matrix.
- **Evidence**: Offered labels were `Recommended` and `Alternative`; the fixed safe description mapped to `Recommended`; selected/tool/projected answer and downstream marker matched exactly. Root and child passed, human replies and pending refs were zero, and cleanup deleted the root. Full `npm test`, focused guard `28/28`, session plugin `17/17`, contracts `67/67`, installer `25/25`, validation `3/3`, every current OpenSpec item, strict target/proposal/apply gates, permission diagnostics, strict validation, and diff check were green. Fresh SDET was terminal `no-critical-risk`.
- **Outcome**: Candidate `make-grind-questions-autonomous-RC1` is complete and locally stable within the enforced operating envelope.
- **Reason**: Current product, proof runner, evaluator, environment identity, raw structural observations, independent tests, and project validation all agree; no known reachable critical/non-deferrable defect remains.
- **Do Not Repeat**: Do not rerun live proof without a product/agent/environment mutation or a newly identified missing raw observation. Do not restart or activate the user's current chat as part of source handoff.
- **Evidence-Based Retry Condition**: Any future production/agent mutation returns the candidate to `development` and requires fresh installed proof plus affected validation. Evaluator-only mutation replays trustworthy preserved observations first and only re-drives live effects if an exact observation is missing.

## 2026-08-13 - Archive preflight exposed incomplete modified requirement

- **Objective**: Complete official OpenSpec synchronization and archive without dropping historical scenario identity or restoring retired rejection behavior.
- **Approach**: Invoke the deterministic archive owner after green completion and project validation, inspect its fail-closed merge diagnostic, then refresh the complete `Pending questions receive a race-safe escalation audit` delta from the current requirement while preserving the accepted official-reply semantics.
- **Evidence**: Official archive stopped before mutation because the `MODIFIED` block omitted current scenario IDs `Human answers during audit` and `Autonomous question is rejected by guard`. OpenSpec's installed schema requires full updated content for `MODIFIED` requirements and provides no scenario-level removal operation. The refreshed compatibility scenarios retain those IDs while requiring human-wins behavior and explicitly forbidding legacy reject-then-corrective-continuation behavior.
- **Outcome**: No file changed during the failed archive. Only delta/history traceability changed afterward; Product Candidate, main specs, Runtime Proof, SDET, tasks, and accepted semantics remain unchanged.
- **Reason**: The implementation delta replaced the legacy scenarios with finer-grained official-reply scenarios but did not preserve their names, so deterministic merge correctly refused an implicit drop.
- **Do Not Repeat**: Do not omit existing scenario IDs from a `MODIFIED` requirement or bypass synchronization with `--skip-specs`.
- **Evidence-Based Retry Condition**: Retry official archive once after strict validation confirms the refreshed full block and its compatibility scenarios prohibit rejection while preserving human precedence.
