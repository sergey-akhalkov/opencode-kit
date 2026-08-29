# Task 4.1 Bounded Semantic Root Evidence

## Implementation And Reuse

- `global/bin/work-campaign/semantic-executor.ts` is the current owner for one
  parentless read-only campaign assignment. It reuses the installed
  `@opencode-ai/sdk/v2` session/provider/tool APIs and the existing campaign record
  parsers; it does not reuse the mutation-capable roadmap mission executor or terminal
  certificate issuer.
- `global/bin/work-campaign-semantic-executor.ts` is a thin portable CLI. The production
  executor accepts an already-running unauthenticated loopback HTTP runtime and never
  starts or hides a server.
- Reuse disposition: `build-minimal`. Current repository and SDK sources were reached;
  mission/session proof clients were verified but have incompatible mutation/proof
  ownership. Node URL/path/fs/crypto/AbortController primitives satisfy the remaining
  bounded contract. Cross-project discovery is `degraded` because no configured peer
  source/scope exists; no portability claim depends on it.

## Enforced Envelope

- One assignment requires exactly one model call and bounded request, output, wall-clock,
  evidence, candidate, definition, phase, block, and result-path identities.
- Session creation has no `parentID`. Session permission rules deny all first and allow
  only `read`, `glob`, `grep`, and `lsp`; the prompt-level tool map independently disables
  every other discovered tool. `StructuredOutput` is accepted only as OpenCode's internal
  schema-output control observation and is not granted in the prompt tool map.
- The response must be one structured JSON envelope. Existing campaign parsers validate
  discovery, reconciliation, investigation, synthesis, and final-challenge payloads and
  exact producer/candidate/assignment correlation.
- Readback requires zero child sessions, project diffs, pending permission requests, and
  questions. The result is create-new below the campaign evidence path. Session deletion
  is mandatory; unknown deletion yields `status=unknown` and cannot complete.

## Provider-Free Validation

- `npm run test:focused:work-campaign` is green. The focused production-executor tests
  cover a complete structured result plus malformed JSON, stale candidate, oversized
  output, timeout, and cleanup-unknown. Every failure preserves one bounded result and
  performs no second model call.
- `proof:work-campaign-semantic --mode preflight` completed with `liveCalls: 0` in
  `task-4-1-semantic-preflight-r1`.
- Syntax checks and `git diff --check` passed for the executor, CLI, proof runner, and
  focused test.

## Configured Runtime Proof

- Current candidate `foundation-fi-camp-003-r5`; environment
  `node-24.18.1-windows-isolated-semantic-r5`; installed OpenCode `1.18.23`; selected
  route `openai/gpt-5.6-sol` variant `xhigh` from profile `quality-independent`.
- `foundation-fi-camp-003-semantic-r5` invoked the production CLI through one explicit
  disposable loopback server and one non-sensitive configured model call. The result is
  complete with exact assignment/candidate/model correlation, `outputBytes=522`, one
  schema-valid partition result, zero children/diffs/questions/permission requests, a
  parentless session, terminal session/server/fixture cleanup, identical source SHA-256,
  and empty exact Git worktree status before/after.
- The runtime uses a create-new isolated config file derived from the selected profile.
  Effective config digest is preserved and both configured MCP and plugin inventories are
  empty; built-in provider support remains available without loading repository extensions.
- `foundation-fi-camp-003-semantic-replay-r5` recomputed the complete evaluator with
  `liveCalls: 0`.

## Preserved Failure Chain

- `configured-r1`: proof runner called `runPortableCommand` with an incompatible object
  signature; no production CLI or model call occurred. Replays r1/r2 remained blocked.
- `configured-r2`: production SDK response normalization omitted the installed nested
  agent-list shape; the session was never created and no model call occurred. Replay r3
  remained blocked.
- `configured-r3`: the first actual model call completed and cleaned up, but OpenCode's
  built-in `StructuredOutput` control part was misclassified as a mutation tool. Replay
  r4 remained blocked. The corrected verifier permits only this output control plus the
  four read-only observations; configured r4 then passed.
- The failed bundles are historical immutable observations and are not relabeled or used
  as successful evidence.
- Historical configured r4/replay r5 remain further narrowed by `FI-CAMP-003`: they prove
  unchanged `src/main.ts` and zero SDK diff, not an unchanged whole worktree, because the
  repository-global Serena MCP created untracked `.serena` files outside that oracle.

## Code Health And Claim Ceiling

- Deterministic inventory places the semantic executor in the attention band at `593`
  lines; the proof runner remains below attention. Fresh reduction review for candidate
  `task-4-1-semantic-r1`, Effective Model `xai/grok-4.6`, returned an empty matrix: no
  safe deletion, reuse, deduplication, public-surface narrowing, or split reduces concepts
  without losing exact validation or failure oracles.
- Split-or-justify: the executor's helpers, five fixed payload branches, one session
  lifecycle, verification, and cleanup form one current change axis. Extracting private
  validators or SDK calls would add a generic wrapper; importing proof or mission owners
  would cross production/mutation boundaries.
- Maximum supported claim: one non-sensitive disposable discovery assignment can execute
  against the selected current loopback OpenCode runtime with deny-by-default tools,
  produce one correlated schema-valid partition result, leave source/worktree unchanged,
  close its session/server/fixture, preserve an extension-free configured surface, and
  replay offline. Semantic quality, complete
  playbook orchestration, configured remediation, multiple waves, Windows supervision,
  population closure, deployment, release, and remote effects are not supported.
