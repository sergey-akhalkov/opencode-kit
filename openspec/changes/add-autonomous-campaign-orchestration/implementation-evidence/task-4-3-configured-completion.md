# Task 4.3 Configured Campaign Completion

## Outcome

One disposable configured campaign completed discovery, fresh reconciliation, one frozen
P1 mission, OpenSpec propose/apply/archive/checkpoint, changed-block re-review, campaign
aggregate validation, declared real-boundary proof, final challenge, report readback, and
`terminal-complete`. The P2 naming control remained report-only and its source was unchanged.

## Operating Envelope

- Candidate: `task-4-3-configured-r2`.
- Environment: `node-24.18.1-windows-task-4-3-r2`.
- Isolated configured runtime: selected `quality-independent` profile, empty configured MCP
  and plugin inventories, one explicit disposable loopback server.
- Effects: disposable local fixture/process/source/OpenSpec writes plus six bounded synthetic
  model calls. No host install, remote mutation, credentials, push, deployment, or release.
- Source ownership: only the existing roadmap mission changed `src/main.mjs`; the proof
  checkpointed those bytes before later read-only roots. `src/format.mjs` remained unchanged.

## Production Behavior

- `work-campaign verify --verification-input <path>` consumes exact contained semantic
  re-review and final-challenge results.
- Re-review correlates assignment/result/session identity, exact changed-block coverage,
  current tracked candidate and file hashes, finite budgets, command evidence, and report
  readback before recording `rereview`.
- Final challenge may attest `challengeStatus=complete` but must leave `terminalState=unknown`.
  The controller sets terminal completion only after the materializer's explicit closure
  facts are complete.
- `resume` consumes a mission only from `mission-launch`/`mission-terminal`, finishes a
  post-materialization terminal transition, and cannot evolve after `terminal-complete`.
- Frozen wave, initial partition, and reconciliation candidate identities remain historical;
  current work items, changed blocks, report seed, and re-review partition bind the current
  candidate.

## Runtime Proof

- `npm run test:focused:work-campaign`: green. The production CLI test covers command failure
  with original exit cause, semantic producer mismatch, exact re-review, P2 non-mutation,
  model terminal-authority rejection, terminal report, and duplicate verify/resume/replay.
- `task-4-3-controller-r2`: provider-free controller capture complete; production CLI reaches
  `terminal-complete`. `task-4-3-controller-replay-r2`: zero-call replay complete.
- `task-4-3-state-r2` and `task-4-3-materializer-r2`: current capture complete; matching replay
  invocations complete with zero live calls.
- `task-4-3-mission-preflight-r2` and `task-4-3-mission-controller-r2`: current mission
  correlation/controller captures complete; matching replays complete with zero live calls.
- `task-4-3-configured-r2/raw.json`: six configured roots completed, `captureError=null`, source
  correction and P2 exclusion were observed, all semantic roots were terminal read-only, and
  the campaign report reached terminal completion.
- `task-4-3-configured-terminal-replay-r2/evaluation.json`: corrected full evaluator replay is
  complete with every check true and `liveCalls: 0`.
- `task-4-3-source-readback.json`: 44/44 current source files match the provider-free capture,
  with zero mismatch.

## Failure Chain

- Configured r1 completed behavior but assignment-level evidence retained stale
  `file:src/main.ts` refs. The bundle and replay are preserved as diagnostic evidence and are
  not used for current completion.
- Configured r2 completed behavior with current refs and no capture error. Its capture-time
  evaluator alone was blocked because the new evidence-ref check attempted to read a `context`
  field that capture raw deliberately omits.
- The evaluator was corrected to use the fixture's explicit two-block mapping. Replaying the
  preserved r2 raw through the complete evaluator produced the terminal complete zero-call
  result. No third live attempt was made.

## Code Health

Deterministic inventory marked the controller, focused test, and configured proof as
split-candidates. Fresh reduction review `ses_fba512ab7ffem0hIwQj7RLJ0vb`, Effective Model
`xai/grok-4.6`, found no safe reduction. Split-or-justify: the controller remains the cohesive
campaign transition/lease/report owner; the test and proof remain one linear fixture/evidence
owner each. The distinct contained verification parser is already extracted in
`verification-input.ts`.

## Claim Ceiling

This evidence supports one disposable configured local P1 remediation campaign through
terminal completion with one P2 report-only negative control. It does not support another
wave, the full reviewed population, Windows supervision, long-duration operation, another
provider/profile, deployment, release, remote effects, or stable/RC status.
