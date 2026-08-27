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
