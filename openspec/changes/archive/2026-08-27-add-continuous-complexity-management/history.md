# Strategy History

## 2026-08-26 - Add a generic architect, skill, or new Practice Owner

- **Objective:** Give complexity and abstraction quality one obvious reusable owner.
- **Approach:** Add a new `complexity-management` skill and/or core Practice Owner that
  evaluates architecture on ordinary and project-wide work, rather than first trying to
  extend the existing quality/audit owners.
- **Evidence:** The current registry already separates `architecture-and-change-locality`
  from `simplicity-and-reuse`; `code-quality-audit` owns context-heavy modules and
  refactoring, while `codebase-audit-loop` owns exhaustive project ergonomics. Existing
  specs forbid a second autonomous architect and every-task Practice Owner routing.
- **Outcome:** A new generic architect and Practice Owner remain rejected. The initial
  no-new-skill approach was selected for the first draft, then narrowed after fresh
  maintenance review: add one thin main-executed focused skill, not an owner, and keep
  delta, post-change quality, service design, and exhaustive coverage in current owners.
- **Reason:** A new owner would duplicate authority and transfer decisions away from
  main. A thin skill is justified only because pre-expansion scenario rehearsal and
  post-change smell review have different lifecycle positions and output contracts.
- **Do-Not-Repeat Condition:** Do not add a new Practice Owner, generic architect, second
  focused skill, or workflow that duplicates exhaustive coverage.
- **Evidence-Based Retry Condition:** Reconsider the one thin skill only if implemented
  trigger/output evidence shows it cannot remain distinct from an existing owner at
  lower total context cost.

## 2026-08-26 - Compute a universal complexity or architecture score

- **Objective:** Make continuous validation cheap, comparable, and CI-friendly.
- **Approach:** Combine file size, dependency, public-surface, duplication, and context
  signals into a numeric project or abstraction score and fail above a threshold.
- **Evidence:** Current principles and canonical specs explicitly prohibit deterministic
  helpers from scoring architecture or inferring seam quality. The PMAC case also shows
  why: useful facades coexist with large files, while a small pass-through wrapper can
  add complexity; line count cannot distinguish them.
- **Outcome:** Rejected. Use deterministic facts plus a semantic Architecture
  Comprehension Map and same-scenario Change Rehearsal.
- **Reason:** An aggregate score collapses unlike dimensions, invites Goodhart behavior,
  and cannot prove whether a consumer's mental model or edit surface improved.
- **Do-Not-Repeat Condition:** Do not add numeric ranking, weighted metrics, or a hidden
  heuristic verdict to the helper, evaluator, CI, or instruction output.
- **Evidence-Based Retry Condition:** No retry for semantic quality scoring under the
  current policy. A future explicit owner philosophy change could permit a narrowly
  defined factual threshold, but it would still require proof that the threshold is a
  local operational constraint rather than an architecture-quality proxy.

## 2026-08-26 - Run the exhaustive audit after every non-trivial change

- **Objective:** Make project complexity validation continuous and prevent drift.
- **Approach:** Route every non-trivial change through `codebase-audit-loop`, its complete
  file/block ledger, and architecture review.
- **Evidence:** The exhaustive loop intentionally covers the whole declared scope and
  blocks on unreviewed ledger rows. Existing Practice Ownership requires zero-trigger
  ordinary work to launch no owner. Most cohesive changes need only the existing local
  comprehension check.
- **Outcome:** Rejected in favor of `delta`, `focused`, and explicit `project` modes.
- **Reason:** Mandatory exhaustive coverage would make the process itself a dominant
  source of complexity and create an unbounded polishing gate.
- **Do-Not-Repeat Condition:** Do not make a durable map, ledger, or reviewer mandatory
  for a cohesive zero-pressure change.
- **Evidence-Based Retry Condition:** Use exhaustive mode only when the user explicitly
  requests whole-project/exhaustive coverage or a bounded audit objective cannot be
  supported by a representative focused scenario.

## 2026-08-26 - Extend an existing inventory instead of adding a fact-specific CLI

- **Objective:** Avoid another tool while supplying project-neutral foraging facts.
- **Approach:** Add scope, component, entrypoint, proof, and support-state fields to
  `project-inventory` or infer architecture from `code-quality-inventory`.
- **Evidence:** `library-tools-architecture` requires project, instruction, and
  code-quality inventories to retain distinct scan/output contracts. The current PMAC
  outputs show that project inventory answers roots/build files and code-quality
  inventory answers line bands; neither owns reviewed hot-path scope or candidate
  detector evidence.
- **Outcome:** Rejected. Build one minimal separate complexity-foraging inventory at the
  active global source while reusing contract-compatible traversal/redaction helpers.
- **Reason:** Extending either existing CLI would blur stable ownership and tempt line or
  root facts to become semantic architecture judgments.
- **Do-Not-Repeat Condition:** Do not merge the new fact shape into existing inventories
  or create a generic inventory framework.
- **Evidence-Based Retry Condition:** Reconsider only if implementation readback proves
  the new contract is byte-for-byte a strict subset of one existing owner, including
  scan policy, inputs, outputs, errors, privacy, support states, and installed entrypoint.

## 2026-08-26 - Require multiple implementations before any abstraction

- **Objective:** Prevent speculative interfaces and framework overengineering.
- **Approach:** Forbid a facade or abstraction until at least two implementations exist.
- **Evidence:** The PMAC case has a useful `VirtualPmacController` and typed preparation
  boundary that reduce consumer knowledge even before multiple interchangeable runtime
  implementations exist. Conversely, interfaces/factories/plugin points without current
  variation would add navigation only.
- **Outcome:** Narrowed into two gates: a one-consumer facade can earn current
  encapsulation value, while polymorphic/framework machinery requires evidenced
  variation or a named reachable change axis.
- **Reason:** Encapsulation and extensibility solve different problems; one threshold
  would reject useful simple interfaces or admit speculative polymorphism.
- **Do-Not-Repeat Condition:** Do not treat every facade as polymorphism, and do not use
  one implementation count as the sole architecture decision.
- **Evidence-Based Retry Condition:** Revise the gates only if same-scenario evidence
  shows the current split systematically admits wrapper soup or blocks a facade that
  demonstrably reduces consumer context while preserving effects and failures.

## 2026-08-26 - Planning review correction: separate focused workflow and default availability

- **Objective:** Resolve pre-implementation ownership, trigger, profile, claim, and
  failure-model contradictions without changing the user's accepted universal-practice
  intent.
- **Approach:** Fresh architecture, instruction-governance, and claim-evidence reviews
  challenged planning candidate `continuous-complexity-management-planning-r1`.
- **Evidence:** Architecture review `ses_fc1de0367ffewt4KOSJAf0WQUY` and instruction
  review `ses_fc1de02caffe5SoFu6Q4bfQo2U` independently found that task 2.1 assigned
  `delta` to an on-demand skill, extending `code-quality-audit` mixed pre-expansion and
  post-change responsibilities, project-mode map ownership was contradictory, default
  `core` lacked the advertised skills/helper, and traversal failure semantics were
  incomplete. Claim review `ses_fc1de0284ffeQyYUPMCqaflZ58` found population/task
  mismatch, heterogeneous path identity, and improper use of one external diagnostic as
  a broad population member.
- **Outcome:** Revised to planning candidate r2: existing main owns `delta`; one thin
  core `complexity-management` skill owns focused map/rehearsal; existing audit/ledger
  own review-only project mode; existing Practice Owner bodies remain unchanged; core
  contains the focused/exhaustive routes and exact helper; helper failure bounds are
  explicit; configured generic members share one loaded path; PMAC is a separate
  diagnostic outside broad population closure.
- **Reason:** The revised ownership map minimizes mixed responsibilities and impossible
  runtime routes while preserving proportionality and the common-practice outcome.
- **Do-Not-Repeat Condition:** Do not restore `delta` to an on-demand skill, append the
  focused contract to `code-quality-audit`, require maps per exhaustive block, advertise
  an all-only route from core, infer semantic verdicts in helper code, or use PMAC as
  generic population proof.
- **Evidence-Based Retry Condition:** Revisit only with new candidate runtime evidence
  showing a named revised boundary fails its exact trigger, availability, or same-path
  proof contract.

## 2026-08-26 - R2 re-review correction: order routing and narrow core

- **Objective:** Remove the remaining routing, discoverability, project-output, and
  profile-sequencing contradictions before implementation without widening the practice.
- **Approach:** Reconcile planning candidate r2 against fresh architecture,
  instruction-governance, claim-evidence, and simplicity/reuse observations; revise only
  the supported contract gaps and retain unknown writer/runtime evidence as unknown.
- **Evidence:** Re-reviews `ses_fc1ce468affe1gn0SQ5jyKnSTm`,
  `ses_fc1ce4663ffeNFu9qyBcvr5Gci`, `ses_fc1ce463bffeMIfEFhdnNB9xMl`, and
  `ses_fc1ce461dffex7mdFbY5fyNh5Y` identified incomplete seam-versus-focused ordering,
  profile availability after routing, adjacent descriptions that could still co-trigger,
  an unnamed project-mode output, retained shared-writer uncertainty, and claim-member
  aliasing. The claim review retained empty observations, unknown oracle, and missing
  runtime challenge at the planning ceiling.
- **Outcome:** Revised to planning candidate r3: exact Practice Owner routing precedes
  focused assessment; reverse stay-quiet is symmetric; profiles expose focused
  skill/helper before always-loaded routing; exhaustive owners remain `all`-only with
  visible core unavailability; project mode has one exact pressure matrix; all twelve
  claim members use one identifier set; runtime evidence remains unsupported.
- **Reason:** This ordering gives ordinary core users the common focused practice without
  importing exhaustive audit cost, double-running owners, or pretending an absent
  capability can provide coverage.
- **Do-Not-Repeat Condition:** Do not auto-load focused mode for the same seam fact already
  reviewed by its Practice Owner, match generic refactoring wording across pre- and
  post-change skills, move exhaustive audit into core, approximate exhaustive coverage,
  or rename claim members between artifacts.
- **Evidence-Based Retry Condition:** Revisit only if configured loaded evidence shows
  an exact accepted partition cannot discover its sole intended owner/output or the
  focused helper cannot be shipped in core within maintained budgets.

## 2026-08-26 - Supersede Instruction-Size Ceilings With Context Quality

- **Objective:** Reconcile the selected focused-workflow strategy with the repository's
  replacement instruction-context contract before implementation begins.
- **Approach:** Keep inventory size and token-proxy measurements as diagnostics while
  gating instruction changes on canonical ownership, exact-duplicate detection,
  mechanical canonicalization, context quality, profile integrity, and loaded behavior.
- **Evidence:** `replace-instruction-limits-with-context-quality` removed the maintained
  numeric instruction-budget owner. None of this change's complexity or profile
  invariants require a text-size maximum.
- **Outcome:** Selected as the current planning contract; the replacement change must
  apply first or this change must explicitly rebase before mutation.
- **Reason:** A unique focused workflow may legitimately increase a diagnostic while a
  smaller within-limit workflow can still duplicate ownership or misroute behavior.
- **Do-Not-Repeat Condition:** Do not restore `instruction:budget`, reviewed token-proxy
  ceilings, or compensating deletion requirements in this change. Existing campaign or
  execution attempt limits are unrelated and remain intact.
- **Evidence-Based Retry Condition:** Reconsider a numeric instruction acceptance limit
  only if a separately accepted requirement identifies a concrete safety or runtime
  boundary that context-quality and loaded behavior checks cannot enforce.

## 2026-08-27 - Bounded falsification correction: align proof boundaries

- **Objective:** Falsify current planning candidate r3 once before production mutation
  and leave the next provider-free slice independently executable.
- **Approach:** One fresh implementation-readiness challenge attempted the six required
  task-fit classes; main reproduced its sole material row, reassigned only the affected
  task evidence boundaries, and used the one permitted fresh corrected-candidate review.
- **Evidence:** Initial session `ses_fbe0b5dbaffetHZZhecBSuJHri` reported `CCM-IR-001`:
  task 1.2 required CLI help and runtime failures while tasks 1.3 and 3.1 owned that code.
  Main confirmed the contradiction from the three task rows. Corrected-candidate session
  `ses_fbe02b866ffegQYkLb8Py9q7Ri` inspected r4 and closed the row with no new
  current-slice material finding. Both reviews used `xai/grok-4.6`.
- **Outcome:** Planning candidate r4 keeps schema-record round-trip in task 1.2, moves
  effect-free help and happy-path execution to task 1.3, and leaves invalid-input,
  unreadable, bound, and cancellation behavior with task 3.1. All other attacks had no
  material finding; semantic and runtime readiness remain unknown.
- **Reason:** Each task now has one proof it can legally produce at its stated rung,
  without pre-implementing later behavior or marking schema-only work from prose.
- **Do-Not-Repeat Condition:** Do not launch a third generic challenge, restore CLI or
  traversal-failure proof to task 1.2, or treat this planning closure as runtime evidence.
- **Evidence-Based Retry Condition:** Reopen this exact surface only after a new
  candidate mutation invalidates the task-1.2/1.3/3.1 ownership or proof split.

## 2026-08-27 - Route the prepared facade pack as separate-arm evidence

- **Objective:** Preserve a provider-free baseline and candidate replay for task 2.4
  without running a configured model or changing the maintained general baseline.
- **Approach:** Extend the existing consumer-outcome runner with one `complexity` pack,
  one reviewed facade fixture, arm-specific local apply seeds, and one-request live gate.
- **Evidence:** The first immutable baseline capture at
  `implementation-evidence/task-2-4-offline-baseline-r1` completed its fixture, proof,
  and cleanup, but its derived evaluation reported candidate sample and fact-diff
  failures because the new pack fell through the generic matched-capture branch.
- **Outcome:** The raw baseline bundle is retained. Route `complexity` with the existing
  separate-arm focused packs so baseline establishment expects one arm and candidate
  comparison begins only after an explicit candidate bundle exists.
- **Reason:** The failure is evaluator/CLI routing, not product candidate, fixture,
  permission, effect, bound, or cleanup behavior. Repeating capture cannot change it.
- **Do-Not-Repeat Condition:** Do not recapture or overwrite baseline r1 to test this
  correction, and do not invoke the configured diagnostic lane.
- **Evidence-Based Retry Condition:** Replay baseline r1 provider-free through the
  corrected terminal evaluator; capture the offline candidate only after that replay is
  `baseline-established` with zero live calls.

## 2026-08-27 - Clear one configured facade diagnostic

- **Objective:** Reach task 2.4's first configured semantic boundary without broadening
  the prepared member, effects, or claim.
- **Approach:** Preserve the r1/r2 provider-free corpus, inspect both r2 terminal replays,
  materialize their evidence metadata, then request clearance for exactly one configured
  `diagnose` invocation rather than using baseline/capture or validation.
- **Evidence:** Both r2 replays are `passed-no-regression`, contain no oracle failures,
  use identical source/environment/scenario identities, report `liveCalls=0`, and have
  complete fixture/process/session cleanup. Preflight reports one configured-provider
  request maximum, fixture-only writes, 524288-byte sample evidence, and no remote,
  credential, install, destructive, or protected effects. The user explicitly authorized
  one diagnose invocation after this evidence was reported.
- **Outcome:** Live-Attempt Gate is clear for one current-source `complexity` diagnose at
  `useful-current-consumer-facade` only. No other configured call is authorized by this
  entry.
- **Reason:** The prior routing failure was replayed to its terminal evaluator result and
  current explicit clearance now satisfies the remaining attempt gate; the configured
  run can reach the previously unobserved loaded semantic boundary.
- **Do-Not-Repeat Condition:** Do not run baseline/capture, a second diagnose, another
  member, or an unchanged configured retry. Do not treat the diagnostic as broad proof.
- **Evidence-Based Retry Condition:** A failed configured evidence-only invocation must
  remain immutable and replay every reachable non-side-effecting finalization stage. A
  successor requires a causally different correction, green preserved-corpus replay, and
  another current explicit clearance.

## 2026-08-27 - Preserve the configured candidate diff and post-refactor context

- **Objective:** Determine whether configured diagnostic r1 completes task 2.4 and, if
  not, correct only the evidence path needed by the same accepted facade scenario.
- **Approach:** Inspect the immutable diagnostic through its proof, validation, file
  identities, session/tool records, model route, runtime errors, and cleanup, then compare
  the configured decision with the skill's same-scenario recheck and the reviewed fixture
  oracle without another provider call.
- **Evidence:** `task-2-4-configured-diagnose-r1/diagnostic.json` records one provider
  request, the expected current source/scenario/model route, `completed-observation`,
  green `check-decision.ts` and `test/scenario.test.ts`, no runtime errors, and complete
  fixture/process/session cleanup. It records changed hashes for `src/order-service.ts`
  and `src/run-order.ts` but no source diff. Its decision calls the three internals hidden
  while retaining them in one unlabeled `essentialContext` list, so the preserved record
  cannot independently demonstrate the required smaller post-refactor consumer context.
- **Outcome:** Task 2.4 remains incomplete. Classify the missing diff as Proof Runner raw
  evidence loss and the mixed context record as a fixture-oracle/instruction precision
  defect. Preserve r1; do not repeat it.
- **Reason:** The executable behavior and cleanup succeeded, but task 2.4 requires an
  inspectable candidate diff and the skill requires a before/after context comparison.
  Hashes plus an unlabeled combined list cannot establish either fact after cleanup.
- **Do-Not-Repeat Condition:** Do not treat `completed-observation` as task completion,
  infer source content from hashes, overwrite r1, or make an unchanged configured call.
- **Evidence-Based Retry Condition:** Extend the existing diagnostic owner to retain a
  bounded privacy-safe changed-text record for this reviewed synthetic fixture, tighten
  the existing fixture prompt/checker so post-refactor essential context excludes hidden
  internals and the same-scenario field states the before/after sets, then run the full
  provider-free focused tests and replay all preserved bundles. Because the prior
  clearance covered one call only, a corrected configured evidence-capture successor
  also requires a new current explicit clearance.

## 2026-08-27 - Remove the redundant successor-approval stop

- **Objective:** Continue the corrected task 2.4 evidence path without converting an
  agent-authored attempt control into a false owner boundary.
- **Approach:** Reconcile the previous one-call wording with standing machine
  authorization, current causal correction, terminal writer closure, and green preserved
  replay before deciding whether another question is required.
- **Evidence:** Standing authorization already covers bounded synthetic OpenCode model
  calls for kit validation. Configured r1 is terminal with complete cleanup; the proof
  runner now retains bounded changed text; the fixture checker rejects hidden internals
  in post-refactor consumer context; focused tests report 35; strict validation has no
  warnings; baseline r1 and paired r2 replays are green with zero live calls. The user
  challenged the repeated permission request rather than introducing a protected
  boundary.
- **Outcome:** The extra successor-approval requirement is withdrawn as an agent-authored
  process mistake. Live-Attempt Gate is clear for one causally corrected r2 evidence
  capture under the existing standing authorization and recorded envelope.
- **Reason:** No credentials, deployment, remote mutation, destructive effect, cost
  commitment, product policy, or other protected action is involved. Global controls
  require autonomous revision of attempt limits after causal correction rather than an
  owner quiz.
- **Do-Not-Repeat Condition:** Do not ask for approval of bounded local synthetic calls
  already covered by standing authorization after their live-attempt evidence gate is
  independently clear.
- **Evidence-Based Retry Condition:** Ask only if a future action crosses a genuine
  protected boundary or current evidence leaves the safety/authority envelope unknown.

## 2026-08-27 - Complete the loaded useful-facade boundary

- **Objective:** Close task 2.4 on the corrected current candidate without broadening one
  exact configured diagnostic into population proof.
- **Approach:** Run one r2 configured diagnose after the proof-runner/fixture/skill
  correction, then inspect retained changed text, map/rehearsal, proof, validation, model
  and source identities, tool records, effects, errors, and cleanup directly.
- **Evidence:** `task-2-4-configured-diagnose-r2/diagnostic.json` records source digest
  `4c32740732831aa05fe63b7714e811d7bec1aed7ba278414700701a829574ee1`,
  OpenCode `1.18.23`, route `openai/gpt-5.6-sol/xhigh`, one provider request,
  `completed-observation`, no runtime errors, and complete fixture/process/session
  cleanup. It retains exact before/after text for `src/order-service.ts` and
  `src/run-order.ts`; the consumer imports only `placeOrder` and the explicit
  `PaymentDeclinedError`, while the facade owns inventory/payment/receipt sequencing.
  Post-refactor essential context is exactly the consumer, facade owner, and scenario
  oracle. `check-decision.ts` and `test/scenario.test.ts` both exit 0 and preserve three
  effects plus the declined-payment failure.
- **Outcome:** Task 2.4 is complete for the exact configured useful-facade boundary. The
  live-attempt gate is clear and terminal; no additional call is required or implied.
- **Reason:** R2 supplies every raw observation missing from r1 and demonstrates the
  accepted smaller consumer model without an extra wrapper or hidden effect/failure.
- **Do-Not-Repeat Condition:** Do not rerun this member to seek confidence, count it as a
  matched population member, or overwrite r1/r2 evidence.
- **Evidence-Based Retry Condition:** Only a later product mutation that materially
  changes this exact loaded behavior or new decision-changing evidence of a distinct
  reachable defect can invalidate this lane.

## 2026-08-27 - Prepare the configured population without reopening the facade diagnostic

- **Objective:** Make every reviewed complexity partition executable through one matched
  configured-session contract while preserving the sealed one-member facade diagnostic.
- **Approach:** Extend the existing consumer-outcome contracts with a separately named
  `complexity-configured-session-r1` pack, twelve reviewed fixture roots, and a derived
  baseline/candidate invocation manifest. Keep evaluation and configured capture deferred.
- **Evidence:** Task 2.4's `complexity-management-r1` pack is terminal and intentionally
  contains only `useful-current-consumer-facade`. The broad claim names twelve exact
  identifiers and task 3.2 requires identical prompt/model/variant/permission/environment
  identities before any matched observation. Focused tests execute native validation and
  proof commands for all twelve fixtures, accept an allowed semantic-oracle alternative,
  reject helper scoring, and retain 24 matched invocation rows under the declared bound.
- **Outcome:** Selected `extend` with cross-project reuse not applicable. The new pack owns
  preparation only; `complexity-management-r1` remains unchanged, no configured call is
  made, and evaluator/capture integration stays with tasks 3.3 and 4.1.
- **Reason:** A separate pack prevents population preparation from weakening immutable
  exact-case evidence or turning deterministic code into a semantic architecture judge.
- **Do-Not-Repeat Condition:** Do not add population members to
  `complexity-management-r1`, reuse its configured diagnostic as a matched member, embed a
  score or semantic verdict in helper code, or capture/evaluate during fixture preparation.
- **Evidence-Based Retry Condition:** Revise the prepared pack only if task 3.3 readback
  finds a schema/fact-diff gap or a fixture cannot execute its reviewed provider-free
  validation and proof command under the frozen identity envelope.

## 2026-08-27 - Close malformed configured observations before another population attempt

- **Objective:** Establish a complete historical configured baseline for all twelve
  reviewed partitions without treating absent or unparsable observations as candidate
  behavior.
- **Approach:** Preserve the timed-out r1 root and malformed r2 bundle, replay r2 through
  the terminal evaluator, then add a reviewed closed decision vocabulary to fixture data
  rather than inferring semantic outcomes in helper code.
- **Evidence:** `task-3-3-configured-baseline-r1` contains no bundle after the 900-second
  outer timeout and no proof process survived. R2 completed all twelve captures, but its
  evaluator reported `malformed-observation` for every member; two samples reached the
  180-second member limit. Provider-free focused tests remained green after the fixture
  schema/readback correction.
- **Outcome:** R1 and r2 remain immutable failed evidence. A causally distinct r3 baseline
  was permitted only after terminal offline replay showed the missing closed vocabulary
  was the exact raw-observation gap.
- **Reason:** Repeating capture could not repair an observation contract that did not give
  the configured session a parseable reviewed decision vocabulary.
- **Do-Not-Repeat Condition:** Do not overwrite r1/r2, extend only timeouts, or recapture
  the population to test parser wording without terminal preserved-corpus replay.
- **Evidence-Based Retry Condition:** Another configured capture requires a reviewed
  exclusive route contract, green provider-free contract tests, and a terminal evaluator
  replay that identifies no remaining raw-observation gap in the preserved corpus.

## 2026-08-27 - Replace union decisions with exclusive route contracts

- **Objective:** Remove arm ambiguity after parseable r3 observations still failed seven
  reviewed baseline oracles.
- **Approach:** Preserve r3, inspect every exact expected/observed fact diff, replace the
  union decision vocabulary with arm-specific `routeDecisions`, and probe only
  `default-core-availability` through matched historical/current arms before any wider
  capture.
- **Evidence:** R3 produced twelve parseable observations with no member timeout, but only
  five matched the reviewed historical route. The historical default-core sample claimed
  `skill:complexity-management` without invoking a skill that does not exist at baseline
  git `541c713`. The bounded default-core baseline then passed as
  `mode:focused-unavailable`; its candidate passed as
  `skill:complexity-management`. The candidate retained two denied shell probes in the
  error facts while preserving its semantic, behavior, effect, proof, and cleanup
  oracles. Current evaluator replay reports `passed-no-regression`, `reasons=[]`, and
  `liveCalls=0`.
- **Outcome:** R3 remains immutable failed baseline evidence. Exclusive route selection is
  now fixture-reviewed data; helper code validates exact facts but does not choose a
  design or route. The focused pair cleared the population retry gate.
- **Reason:** A union vocabulary allowed the model to combine mutually exclusive
  historical and current availability facts. The one-member probe falsified that defect
  before another population run.
- **Do-Not-Repeat Condition:** Do not infer skill availability from prose, restore union
  decision tokens, hide failed tool calls, or use the one-member pair as population
  closure.
- **Evidence-Based Retry Condition:** Revisit route data only if a current exact oracle
  fails with a completed parseable observation whose tool/config identity contradicts the
  reviewed route.

## 2026-08-27 - Complete the matched configured partition pair

- **Objective:** Close task 3.3's exact fact-diff/evaluator boundary and obtain the raw
  matched population evidence needed by task 4.1 without another parser or route retry.
- **Approach:** Capture one full historical baseline from git `541c713` under the current
  evaluator, seal it, then capture the current `global` candidate against that exact
  baseline with no intervening source mutation.
- **Evidence:** `task-3-3-configured-baseline-r4/bundle.json` establishes all twelve
  baseline oracles with `status=baseline-established`, `reasons=[]`, `liveCalls=12`, and
  evaluator identity
  `3c2afb2422a0a898fe3d7abfad3b68b9e78b3d4c0cb8ceeedff6400108f755b2`.
  `task-3-3-configured-candidate-r4/bundle.json` passes all twelve candidate oracles and
  all twelve retained baseline oracles under the same capture/terminal evaluator identity,
  with `status=passed-no-regression`, `reasons=[]`, `liveCalls=12`, source digest
  `5634611b408b56deefc81689ca6447beb5e1d73f56f52246234bed9826b5883d`,
  environment digest
  `5b41257d1d2c556943437824c2c43399a6bb1ee2e61b80f95b5b5c60112469f1`,
  and terminal digest
  `3167f5c7f84641068ed33c6f876151cb9c09808647e343730bc8369d064fab0f`.
  No owner question or duplicate failed invocation occurred; exact failed-tool error facts
  remain visible where present.
- **Outcome:** Task 3.3 is complete. Live-Attempt Gate is clear and terminal for the r4
  twelve-member historical/candidate pair. The pair is raw input to task 4.1 and does not
  by itself close the broad claim or independent challenge.
- **Reason:** The r4 pair exercises identical prompt, model profile, variant, permission,
  environment, scenario, proof, and cleanup contracts while keeping semantic expectations
  in reviewed fixture records.
- **Do-Not-Repeat Condition:** Do not rerun either r4 arm for confidence, overwrite the
  bundles, suppress diagnostic error diffs, or promote the pair beyond its reviewed
  twelve-member configured-session ceiling.
- **Evidence-Based Retry Condition:** Only a product, runner, evaluator, environment, or
  reviewed-oracle mutation that invalidates a dependent r4 identity, or new evidence of a
  distinct reachable accepted-outcome defect, permits an affected-lane successor.

## 2026-08-27 - Promote the sealed r4 pair to configured population evidence

- **Objective:** Reconcile the raw r4 pair with tasks 3.4 and 4.1 without repeating live
  calls or treating model friction as hidden success.
- **Approach:** Re-run the current provider-free contract, inventory, profile, loader,
  consumer-outcome, and instruction-context checks; inspect all arm-specific semantic
  oracles and exact fact-diff dimensions in the sealed pair; keep failed shell probes in
  the diagnostic record.
- **Evidence:** Current focused validation reports complexity contracts `valid=8
  invalid=7`, inventory `fixtures=6 bounds=3 cancellation=1 unreadable=3`, consumer
  outcome `tests=36`, library `tests=177`, contracts `tests=71`, and instruction context
  `tests=15`. `task-3-4-runtime-core-r1` resolves the focused skill and both helper files
  from the generated root with no missing skill, permission, parent-source, or authority
  marker. `task-3-4-runtime-all-r1` reports no missing command/plugin or unresolved
  placeholder. Both report `status=passed` and `cleanup=complete`. The r4 evaluator passes
  every reviewed historical and current partition oracle; behavior, proof, effects, and
  cleanup remain exact while error fact diffs retain every failed tool call.
- **Outcome:** Tasks 3.4 and 4.1 are complete on the current source. The supported ceiling
  is the reviewed twelve-member configured population under the recorded homogeneous
  source/environment/scenario identities; evidence-index materialization and independent
  challenge remain open.
- **Reason:** The sealed r4 pair already crossed the exact configured production/comparison
  boundary. Re-running it after provider-free structural closure would add cost without a
  causally distinct hypothesis.
- **Do-Not-Repeat Condition:** Do not recapture r4, discard error fact diffs, infer lower
  friction from `passed-no-regression`, or represent the configured population as a
  cross-project or universal effectiveness claim.
- **Evidence-Based Retry Condition:** Re-run only an affected lane after an identity-
  changing product/runner/evaluator/environment mutation or a reproduced distinct
  accepted-outcome defect.

## 2026-08-27 - Widen only the PMAC read-only inventory file bound

- **Objective:** Complete the separate PMAC diagnostic without hiding its unusually large
  evidence/corpus surface or changing the maintained-path scope.
- **Approach:** Run the active global helper with the reviewed PMAC scope and default
  100,000-file process bound, preserve the fail-closed result, then widen only that
  caller-owned bound to 500,000 within the tested 1,000,000 hard cap.
- **Evidence:** The first invocation stopped with `support.state=blocked`, diagnostic
  `MAX_FILES`, and exactly 100,000 files observed: 343 maintained, 93,422 evidence, 638
  corpus, 1,910 generated, 3,683 dependency, four unknown, and no unreadable path. It had
  already retained maintained concentration and large-owner facts but could not claim a
  complete traversal. Full raw stdout is preserved by the session tool-output artifact
  `tool_04350d55d001Md0c519wTMbQgp`; the external Git worktree was not mutated.
- **Outcome:** The first invocation is finalized failed evidence. One 500,000-file retry
  is allowed with identical scope, helper, root, byte bound, timeout, and read-only
  effects.
- **Reason:** The observed excluded evidence population alone nearly exhausted the default
  bound. Increasing the file counter is the exact falsifiable unblocker and does not
  weaken traversal completeness or reclassify paths.
- **Do-Not-Repeat Condition:** Do not label the 100,000-file output complete, shrink away
  evidence/corpus pressure to obtain green status, overwrite the raw result, or make an
  unbounded retry.
- **Evidence-Based Retry Condition:** The 500,000-file run may proceed once. Any further
  bound stop requires preserving its exact observed cardinality and selecting a new finite
  bound within the tested hard cap; another failure for a different cause follows normal
  terminal diagnosis rather than a same-mechanism retry.

## 2026-08-27 - Close five explicit PMAC root-scope unknowns

- **Objective:** Make the external inventory complete without suppressing unknown paths or
  weakening reviewed evidence/corpus exclusions.
- **Approach:** Inspect the completed 500,000-file result, correlate its five unknown files
  with the external root listing, and add only those exact repository/toolchain files to
  the reviewed maintained scope before one effect-free replay.
- **Evidence:** The widened scan completed 146,414 files with no unreadable path or bound
  diagnostic but reported `support.state=partial` and
  `unknownFields=[unclassified-paths]`. The external root contains exactly five files not
  already included or excluded: `.gitattributes`, `.gitignore`, `Cargo.lock`,
  `opencode.json`, and `rust-toolchain.toml`. Raw stdout is preserved in
  `tool_0435162b2001zDu0JMSTnIj80M`; root digest is
  `79847b83706e0ac8772b90d3b85c8cd5ef9db422d4227a521622c102206c0c56`.
- **Outcome:** One current-source replay is permitted with the same 500,000-file, 512-MiB,
  120-second, read-only envelope and the five explicit reviewed includes.
- **Reason:** The partial state was caused by an exact scope omission, not traversal,
  source, permission, or helper behavior. Explicit inclusion preserves fail-closed
  unknown handling and avoids a heuristic default.
- **Do-Not-Repeat Condition:** Do not relabel all root paths maintained, remove pressure
  exclusions, treat partial as complete, or repeat after the explicit-scope replay unless
  another named unknown is observed.
- **Evidence-Based Retry Condition:** Revisit scope only for a newly observed exact path
  whose reviewed class and reason can be established without semantic inference.

## 2026-08-27 - Correct PMAC diagnostic attachment argument order

- **Objective:** Start one configured read-only PMAC assessment with the reviewed scope and
  compact inventory attached.
- **Approach:** Invoke `opencode run` with two repeated `--file <path>` options followed by
  the positional message, then correct only the CLI ordering after local parsing failed.
- **Evidence:** OpenCode exited before provider/session creation with `File not found` for
  the entire message, proving the array-valued final `--file` consumed the trailing
  positional. No model call, tool call, repository write, or external effect occurred.
- **Outcome:** The invocation is finalized preflight failure. One corrected invocation may
  place the message first and use `--file=<path>` arguments.
- **Reason:** This is deterministic CLI argument parsing, not candidate behavior or an
  evidence-oracle result.
- **Do-Not-Repeat Condition:** Do not place a positional message after the final
  array-valued `--file` option or count this preflight as a configured observation.
- **Evidence-Based Retry Condition:** Retry only with the positional message before
  options and explicit equals-form attachment values.

## 2026-08-27 - Complete the separate PMAC read-only diagnostic

- **Objective:** Exercise the loaded focused workflow on the named external checkout while
  keeping it outside generic population closure and leaving its dirty worktree untouched.
- **Approach:** Attach the complete reviewed inventory and scope to one configured
  `complexity-management` session; prohibit shell, build, test, controller, network,
  OpenSpec, and mutation operations; inspect only maintained source/navigation; compare
  external Git status before and after.
- **Evidence:** Session `ses_fbcab4e74ffe2wdM1AUUtj8SqC` used OpenCode `1.18.23`,
  `openai/gpt-5.6-sol/xhigh`, and one provider request. It loaded the focused skill and
  completed 90 read/search/symbol tools with zero failed or mutation-capable tools, one
  final JSON response, and one terminal stop. All seven required findings are `surfaced`
  with project-relative citations; output hash is
  `d87e670389721a32e45848c181b597ae195c0dd6efc325577937df17f320d098`.
  External Git status is unchanged. OpenCode emitted one non-terminal
  `MaxListenersExceededWarning` for its output stream, retained in the evidence record.
- **Outcome:** Task 4.2 is complete as one exact read-only diagnostic. It authorizes no
  PMAC edit/refactor and contributes no generic population member.
- **Reason:** The active helper supplied complete privacy-safe facts, and the loaded skill
  converted those facts plus direct maintained-source reads into the required bounded
  map/rehearsal without external effects.
- **Do-Not-Repeat Condition:** Do not rerun for confidence, mutate the PMAC checkout,
  broaden this exact case into generic evidence, hide the output-stream warning, or treat
  diagnostic debt as accepted PMAC implementation scope.
- **Evidence-Based Retry Condition:** Only a material candidate/source/scope mutation or
  new evidence of a distinct required finding failure can invalidate the affected lane.

## 2026-08-27 - Narrow population closure to exact member outcomes

- **Objective:** Close the broad claim from the sealed r4 pair without composing each
  singleton partition into one stronger all-members refactor claim.
- **Approach:** Materialize twelve homogeneous r4 observation rows, run one fresh
  evidence-sufficiency challenge, reproduce every risk, and change only claim wording,
  evidence bindings, and diagnostic exclusions.
- **Evidence:** Reviewer `ses_fbc978564ffeQ3qA85lPBYJk2B` found that the original
  statement could overrepresent stay-quiet, review-only, unreadable, and unsupported
  controls; claim-level refs mixed historical/profile artifacts with r4 support; and ten
  candidate members retained denied shell probes. Main confirmed those facts directly in
  the r4 evaluator. Provider-free replay is `passed-no-regression` with `liveCalls=0`.
- **Outcome:** The claim now states each exact fixture outcome, binds generic support only
  to the r4 population lanes and independent challenge, excludes clean-session inference,
  and remains explicit that PMAC is diagnostic-only. The apply gate reports `supported`
  with `12/12` observations.
- **Reason:** Exact per-member evidence supports the reviewed proportional routes and
  represented refactors, but not a claim that every member performs every workflow stage
  or has an error-free tool trace.
- **Do-Not-Repeat Condition:** Do not restore the conjunctive statement, bind profile or
  PMAC candidate ids to generic members, erase denied shell probes, or recapture r4.
- **Evidence-Based Retry Condition:** Revisit only after a material product/evaluator/
  environment/oracle identity change or new evidence that one exact member is unsupported.

## 2026-08-27 - Rebind focused change-locality validation to archived evidence

- **Objective:** Run task 5.2's required focused change-locality validation on the current
  repository without substituting a weaker check.
- **Approach:** Preserve the failed invocation, locate the exact immutable baseline bundle,
  confirm no active ownership overlap, and change only the stale test path from the former
  active change root to its dated archive root.
- **Evidence:** `npm run test:focused:change-locality` failed with `ENOENT` for
  `openspec/changes/improve-change-locality-guidance/.../one-off-local-fix.bundle.json`.
  The same bundle exists at
  `openspec/changes/archive/2026-08-24-improve-change-locality-guidance/...`; active
  ownership inventory names no writer for `tools/test-change-locality-scenarios.ts`.
- **Outcome:** The exact test file is admitted as CCM validation dependency closure; no
  archived evidence, production behavior, fixture oracle, or other active-change root is
  changed.
- **Reason:** Archive moved the immutable input after the maintained test was authored.
  Repeating the old path cannot reach its existing oracle.
- **Do-Not-Repeat Condition:** Do not recreate an active change directory, copy or modify
  the archived bundle, skip the focused test, or retry the nonexistent path.
- **Evidence-Based Retry Condition:** Revisit only if archive migration moves the cited
  immutable bundle again or a maintained locator replaces direct archive paths.

## 2026-08-27 - Replace three archive-generated Purpose placeholders

- **Objective:** Satisfy task 5.2's strict all-spec validation without changing unrelated
  requirement semantics or active change deltas.
- **Approach:** Run each failed specification validator independently, confirm the sole
  warning is the generated `TBD` Purpose sentence, verify the canonical files are clean
  and have no active writer, then replace only those placeholders with concise summaries
  of their existing requirements.
- **Evidence:** Strict validation identified `library-deduplication-audit`,
  `session-completion-guard`, and `unattended-roadmap-orchestration`; each report names the
  Purpose placeholder. Git shows no current diff on those files, and active ownership
  manifests claim none of their canonical paths.
- **Outcome:** The three exact canonical spec files are admitted as CCM validation
  dependency closure. Requirements, scenarios, active deltas, runtime behavior, and proof
  identities are unchanged.
- **Reason:** Archive-generated placeholder text is invalid under the repository's current
  strict schema and cannot become green through a CCM code or test retry.
- **Do-Not-Repeat Condition:** Do not weaken strict validation, edit requirement bodies,
  copy active deltas into canonical specs, or mark the failed all-spec run green.
- **Evidence-Based Retry Condition:** Revisit only if strict validation reports a new
  concrete issue after the Purpose-only correction.
