## Why

The global OpenCode instructions already contain most ingredients of a reliable SDLC, but they are spread
across a large `AGENTS.md`, general implementation/test rules, and several reviewers. The process can be
forgotten or applied inconsistently because no single on-demand instruction artifact owns the complete
role sequence and no dedicated SDET or final-candidate reviewer owns those narrow responsibilities.

The result must be a lightweight instruction-only framework that works in any software project. It must
not assume a programming language, framework, package manager, test framework, build system,
version-control system, CI/hosting provider, repository layout, issue tracker, review product, fixed model,
or fixed command. A main/general agent coordinates the lifecycle; bounded specialist agents implement,
assess/test, and review; the target project supplies native commands and adapters.

## What Changes

- Add one complete global orchestration adapter at `global/skills/change-ready-sdlc/SKILL.md`. It
  operationalizes the existing conceptual UDL without copying its named stage list and owns role sequence,
  evidence gates, correction routing, and the `Change-Ready` decision.
- Add a short mandatory routing block to `global/AGENTS.md`: for every behavior-changing implementation,
  bug fix, refactor, loaded instruction/config change, or generated-output change, the main/general agent
  loads the SDLC skill before mutation and acts as the sole orchestrator.
- Keep exactly two proportional profiles: `Small` and `Material`. Profile controls planning and delivery
  ceremony; every behavior change still receives fresh independent SDET assessment.
- Use one execution-ready Authoritative Brief for every dispatch. A subagent with no conversation history
  receives the exact role, objective, evidence, deliverables, boundaries, decisions, acceptance criteria,
  verification, return contract, and blocker policy needed to work without reconstructing intent.
- Make `implementation-worker` production-only. It implements the smallest complete happy path, never
  authors automated test artifacts, never executes authoritative lifecycle validation, and never declares
  readiness.
- Add `sdet-quality-engineer` as the fresh-context test/risk specialist. It assesses realistic risks and
  observable oracles, may author test-only artifacts when a gap exists, never fixes production, and never
  self-approves.
- Route test-only work directly through fresh SDET after baseline/current-boundary proof; do not invent a
  production edit. This covers flaky-test correction, fixtures/harnesses, and test blocks co-located with
  production code under exact content scope.
- Add `final-candidate-reviewer` as the fresh read-only post-SDET, post-validation reviewer of the complete
  production-plus-test candidate.
- Keep project-native validation execution, candidate capture, correction routing, and final synthesis in
  the main/general orchestrator.
- Keep subagent creation and resumption exclusive to the main/general orchestrator. Permit bounded parallel
  fan-out only for independent isolated or exact non-overlapping scopes proved before dispatch through the
  discovered runtime fan-out adapter. Retain each specialist's role plus session/task identity so the
  orchestrator can resume the same production author when role, objective, and owned scope remain continuous.
  Every writer dispatch/attempt—serial or fan-out—remains open after timeout, cancel, missing report, or
  partial mutation until terminal-or-isolated closure: a terminal report, adapter-proven terminal cessation
  (cancellation counts only after the writer can no longer execute or mutate), or isolated/revoked write
  authority. Cancellation request or acknowledgement alone is not closure. Partial fan-out failure and serial
  writer ambiguity stay an integration barrier: do not freeze, prove, or qualify until every attempt is closed.
  Recording timeout/cancel/missing report alone is not closure; unknown liveness or unisolated ownership
  blocks; late mutation invalidates the attempt. Accept specialist dispatch/resume evidence only when the
  discovered runtime adapter proves active primary parent identity, child session/task identity, and expected
  child role/context; top-level/default-primary fallback is not specialist evidence; unavailable or
  unverifiable child dispatch or continuation blocks the affected gate.
  Fresh-context independence requirements for corrected-candidate SDET and final review remain mandatory.
  Reviewers receive privacy-safe inline/attached evidence readable under their effective permissions;
  external path references alone are insufficient. Semantic Candidate Identity is the binding qualification
  identity; status-marker normalization is adapter-owned, explicit, and absent by default (no portable default
  status filename or marker syntax). Package Identity remains exact bytes for handoff and audit. This kit's
  OpenSpec recipe may use pre-existing `tasks.md` checkbox markers as a project-local instance only, not a
  portable requirement. Candidate identity generation is adapter-owned and must record a privacy-safe
  `Identity Recipe` (mechanism/version, baseline/reference, scoped path manifest/ordering, add/modify/delete
  framing, path/content and byte/line-ending treatment, semantic-normalization rule/version, reproduction
  procedure/inputs) without prescribing a portable hash, tool, OS, language, command, or product. Missing
  reproducible identity-generation capability or unreproducible recipe blocks qualification and restart
  continuity. SDET receives exact Input Semantic Candidate Identity, Input Package Identity, and Identity Recipe
  for the pre-SDET candidate covered by initial Applicable Proof, and every SDET phase records those input fields
  plus current Semantic Candidate Identity, Package Identity, and Identity Recipe. Provisional `authored-tests`
  uses pending current identities until main freezes, recaptures recipe/identities, re-runs post-test Applicable
  Proof, validates, and returns current pair/recipe/proof/validation to the same SDET context for final (pending
  forbidden). Assessed-existing-tests keeps input=current without redundant proof replay. SDET, final-review,
  delivery, and compact orchestration reports record both identities; freeze, compact orchestration, final-review,
  and delivery also record the Identity Recipe. Final review and delivery verify post-test Applicable Proof after
  authored-tests, final SDET, validation, and review share the current semantic identity/recipe; missing post-test
  proof continuity blocks. Delivery verifies the same recipe/baseline across proof/SDET/validation/final/delivery
  and that any post-final-review package change is exact marker-only metadata with unchanged Semantic Candidate
  Identity and the same recorded recipe. Delivery self-gate closes finitely after prerequisites without treating
  its own closing task as a false incomplete-task blocker.
- Use a generic local `Change-Ready: yes|no` state. Projects may render it as `PR-Ready`, `MR-Ready`,
  `Ready To Land`, or another native label. External publication/integration/deployment actions remain
  separately authorized.
- Align only the global readiness, test-coverage, delivery, troubleshooting, and handoff instructions that
  directly conflict with these role boundaries.
- Add acceptance scope lock and anti-polishing policy (SDLC-011): pre-mutation brief fields for acceptance
  criteria, scope lock, planned gate waves, correction budget, and stop line; post-mutation blocking expansion
  only via owner approval or qualifying P0/P1 serious defects; P2/note polish residual-only; representative
  evals; planned one-wave gates with limited replay.

## Capabilities

### New Capabilities

- `library-change-ready-sdlc`: a technology-neutral instruction-only SDLC framework with main/general
  orchestration, proportional profiles, production-only implementation, fresh independent SDET,
  project-native validation, correction replay, independent final review, and local Change-Ready handoff.

### Modified Capabilities

- `library-instruction-artifacts`: keeps the non-global shared reviewer contract as repository validation
  provenance while requiring mandatory runtime reviewer behavior to be available from always-loaded and
  role-specific global Markdown.

## Impact

Portable runtime scope is global instruction artifacts only:

- `global/AGENTS.md`
- `global/skills/change-ready-sdlc/SKILL.md` (new complete global orchestration adapter)
- `global/agents/implementation-worker.md`
- `global/agents/sdet-quality-engineer.md` (new)
- `global/agents/final-candidate-reviewer.md` (new)
- `global/agents/implementation-readiness-reviewer.md`
- `global/agents/test-coverage-reviewer.md`
- `global/agents/troubleshooter.md`
- `global/agents/session-delivery-reviewer.md`
- `global/skills/merge-request-author/SKILL.md`
- standalone `## Contract Reference` migration for the full registered reusable reviewer set:
  `code-quality-reviewer.md`, `deployment-config-reviewer.md`, `implementation-readiness-reviewer.md`,
  `instruction-artifact-reviewer.md`, `legacy-client-compatibility-reviewer.md`,
  `legacy-evidence-reviewer.md`, `openspec-architecture-reviewer.md`,
  `performance-reliability-reviewer.md`, `protocol-api-reviewer.md`, `rust-concurrency-reviewer.md`,
  `session-delivery-reviewer.md`, `test-coverage-reviewer.md`, `wire-protocol-reviewer.md`

Minimal non-runtime kit support scope:

- `profiles/all.json` and README agent/skill catalog and routing entries
- `REPO_AGENTS.md`, `instructions/reusable-project-agent-instructions.md`,
  `instructions/universal-development-loop.md`, `instructions/porting-checklist.md`,
  `templates/project/AGENTS.md`, `templates/project/validation.md`, `templates/project/adapter.json`,
  `tools/doctor.ts`, `tools/install-opencode-global.ts` (this kit's activation installer only),
  `tools/validators/opencode-config.ts` (shared pure OpenCode config root/machineOverride policy and path equality
  consumed by validator/doctor/installer), and `tools/validators/active-authority.ts` (pure AGENTS/SKILL active
  authority structural inspection consumed by doctor; kit-local only, not a portable target dependency) for SDET route
  alignment, mandatory Portable Material delivery/readiness semantics, dual-identity plus Identity Recipe report
  acceptance, corrected-candidate SDET freshness (same testing context only for provisional→final on an unchanged
  candidate), non-weakenable mandatory lifecycle ordering (writer closure/integration then freeze/capture then
  Applicable Proof then unchanged-identity recapture then Fresh SDET; Final Validation then Final Candidate Review
  then Handoff), self-contained project bootstrap, honest doctor dual validation-adapter semantics and active
  global authority structural conformance (heading skeleton + YAML skill frontmatter, not token stubs),
  POSIX-safe failure-atomic installer profile convergence with strict UTF-8/raw-byte preimage and
  symlink policy, mutually exclusive installer modes, template preflight and concurrent-destination-safe local
  config provisioning, safe Windows over-limit guidance (shorter path; no manual setx recovery), truthful default-mode
  platform semantics, reference-based porting checklist,
  install prior-config rollback instructions, and parent/child runtime evidence honesty
- README Manual Skills/Agents install topology: lifecycle skills, write-capable lifecycle agents, and
  reference-based reviewers are complete only when the active runtime also loads shared contracts from
  `<active-global-config-dir>/AGENTS.md` (`OPENCODE_CONFIG_DIR` when set, else `~/.config/opencode`; override
  bypasses the default); global copy destinations use that active directory; no project-level-equivalent
  substitute
- `instructions/leaf-reviewer-agent-contract.md` as the canonical maintenance/validation provenance for
  reference-based reusable reviewer bodies (not a target-project runtime dependency)
- the exact static contract changes under `tools/contracts/` enumerated by design D13, including the
  deterministic forbidden-inline-heading rule for Leaf Contract, Feedback Ledger, and Prevention Feedback,
  exact standalone backticked Contract Reference structure validation with exactly-one heading
  cardinality, dual-identity and Identity Recipe report field tokens, and Material delivery routing tokens for
  the five project-facing binding surfaces
- the smallest dispatch/trigger checks in `tools/validators/{agents,skills,routing}.ts`, with required
  routing/token lists owned by `tools/contracts/skills.ts`
- OpenSpec delta `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-tools-architecture/spec.md`
  aligning legacy aggregate and extracted-module test topology with current helpers
- focused existing contract/profile/permission/routing tests and required test fixtures, including
  `tools/test-helpers/fixture-builder.ts` (deleted after migration), `tools/test-library/doctor.ts`,
  `tools/test-install-opencode-global.ts`, and other shared fixture helpers when fresh SDET must migrate verbose
  Contract Reference fixtures to the standalone form, cover doctor-v2 honesty / installer-doctor oracle
  corrections, consolidate shared test helpers, and keep changed test files below 800 lines; when the required
  code-quality gate reports `tools/test-contracts-change-ready.ts` as a split-candidate, fresh SDET may also
  create `tools/test-contracts-change-ready-identity.ts` for dual-identity / Identity Recipe /
  marker-normalization / restart-continuity contract tests only, and may update `tools/test-contracts.ts` solely
  to import/register that module while preserving deterministic order and without changing production
  contracts/validators or test oracles

This support only validates and distributes the global Markdown artifacts. It SHALL NOT implement lifecycle
state, orchestration, command execution, candidate capture, retry, review, or readiness behavior.

No application/runtime code, plugin, MCP, workflow engine, command runner, deployment path, or remote state is
changed. Other application/runtime installers remain out of scope; only this kit's activation installer
`tools/install-opencode-global.ts` is in scope. Non-global instruction/documentation edits are limited to the
maintenance and distribution surfaces named above (including UDL for mandatory Material-delivery alignment); they
remain kit maintenance/distribution surfaces and are not target-project runtime dependencies.

## Portability Contract

- Portable instructions define capabilities and evidence, never a technology stack or repository.
- Each target project supplies or discovers its own requirement source, production adapter, SDET/testing
  capability, validation procedures, candidate-capture mechanism, deterministic candidate identity-generation
  capability (part of capture or a paired adapter), final reviewer, delivery gate, external operation policy,
  and readiness label.
- Missing mandatory capability is `unknown` or `blocked`; the orchestrator never imports a hard-coded tool
  from this or another project.
- Examples may name tools only when explicitly labeled non-normative.

## Reliability Boundary

Instruction-only runtime enforcement cannot provide an OS sandbox, dynamic path ACL, durable workflow database, or
mathematical guarantee that a model never disobeys. Reliability therefore comes from a deliberately short
always-loaded trigger, one complete global orchestration skill, mutually exclusive role prompts, main-owned evidence
checks, fresh-session behavioral evals, and binding independent review. The artifacts must state this
honestly and must not claim stronger technical enforcement.

## Compatibility And Rollout

- Existing sessions retain old instructions until OpenCode fully restarts.
- SDET and final-review agent files omit fixed `model` and `variant` values so those independent roles
  inherit active project/session configuration. The existing kit-specific `implementation-worker` adapter
  retains owner-selected `model: xai/grok-4.5` and `variant: high` for token-cost control. That adapter choice
  is not part of the portable SDLC contract and target projects may select another conforming production
  adapter.
- Existing uncommitted work in global files must be attributed and preserved. Unsafe overlap blocks the
  affected edit.
- Existing project commands and policies remain authoritative; this framework discovers them and does not
  replace them.
- **Full change rollback** restores the entire authoritative scoped candidate manifest for this change
  (portable runtime global Markdown plus the minimal non-runtime kit support surfaces above; expected final
  size 59 paths: 42 modified, 16 added, 1 deleted; prior 58 plus pure active-authority policy owner
  `tools/validators/active-authority.ts`; exact A/M/D list is the authoritative table in `tasks.md`; no fabricated
  deletions) to the captured baseline: modified paths restored, added paths removed, deleted paths restored when
  present. Scope identity comes from the recorded manifest / Identity Recipe / baseline only; never a broad
  workspace reset or overwrite of unrelated/pre-existing teammate work.
  Do not perform unjournaled sequential in-place rollback in a shared/dirty workspace. Build the complete
  baseline-restored candidate in an isolated workspace or project-native snapshot/transaction, validate it
  there, then integrate/swap only via a discovered project-native failure-atomic or explicitly
  journaled/recoverable mechanism that retains preimages. Owner authorization may be additionally required
  but never substitutes for failure atomicity or journaling. Preflight all manifest paths, ownership, and
  acceptable preimages (qualified candidate or baseline) before integration. After interruption/restart,
  re-inventory; only complete candidate or complete baseline states may continue; a third/unattributed state
  blocks. If no safe isolated failure-atomic or journaled integration capability exists, ownership overlaps,
  integration partially fails or is interrupted, or any path has a third/unattributed state: stop before
  unprotected target mutation when possible and report rollback incomplete/blocked; hand off the validated
  isolated restored package; do not promise original workspace preservation after unprotected partial target
  mutation; do not run baseline validation against a mixed state; do not claim rollback complete. After
  complete restoration only, run baseline-compatible repository validation; restart/reload OpenCode only if
  active global runtime artifacts or the active config pointer changed. No application data or external-state
  rollback is needed; remote operations remain separately authorized. Rollback is planned/evidenced in
  handoff, executed only when separately authorized, and never required to claim Change-Ready.
- **Runtime activation rollback** is a separate operational action: restore the prior active
  `OPENCODE_CONFIG_DIR` / config pointer and restart/reload OpenCode without mutating the repository
  candidate. It can disable the new runtime for subsequent sessions but does **not** count as rollback of the
  repository change or support artifacts. Restoring only global instruction artifacts while leaving coupled
  profiles, contracts, validators, tests, or maintenance/OpenSpec surfaces in place is not a complete
  full-change rollback and leaves the repository incompatible.

## Resolved Owner Decisions

- Target-project runtime remains instruction-only and depends only on global Markdown artifacts.
- After reviewing the repository's mandatory catalog/profile/validator contracts, the owner explicitly
  selected minimal non-runtime support for distribution and static regression checks. That support is not
  part of the portable SDLC runtime and may not implement lifecycle behavior.
- On 2026-07-12 the owner explicitly retained the existing fixed model/variant on this kit's production
  implementation worker to reduce token cost. This supersedes the earlier blanket proposal statement that
  all three new lifecycle roles inherit the active model; SDET and final review still inherit, and the
  portable contract still prescribes no provider or model.
- On 2026-07-12 the owner approved correcting this change's planning artifacts before implementation to
  include all stale testing-route consumers, exact deterministic contract surfaces, a reproducible
  fresh-session evaluation protocol, and the complete repository CI/code-quality gate.
- On 2026-07-14 the owner approved an anti-polishing policy to optimize delivery speed without tolerating
  serious bugs: before first mutation record accepted acceptance criteria, project-specific scope lock,
  planned gate waves, correction budget, and stop line in existing Authoritative Brief fields; after first
  mutation, new blocking corrections or acceptance criteria require explicit owner approval or a reproducible
  P0/P1 defect affecting behavior, CI, security, data integrity, or compatibility (severity label alone is
  insufficient); mandatory-gate failures, unsafe writer ownership/liveness, and unresolved owner decisions
  still block Change-Ready without justifying speculative product/evidence scope; P2/note, coverage-only gaps,
  optional evidence, and wording polish route to Residual Risks or a separately approved follow-up and must not
  populate Required Next Actions or trigger `changes_requested`/autonomous polish replay; plan one SDET wave,
  one Final Candidate Review wave, and for Material one delivery wave; replay only gates invalidated by a
  qualifying P0/P1 correction or failed mandatory gate; use representative high-impact evals rather than
  exhaustive Cartesian products unless risk, regulation, or owner requires more; evidence tooling must not
  become a second product; predeclared correction budget is a planning ceiling with no universal retry count;
  current-change stop line after the policy edit is exactly one fresh corrected-candidate SDET focused on the
  two accepted defects, one complete candidate-only validation run, one fresh Final Candidate Review under the
  new blocker policy, and one Material delivery review. Normative requirement: SDLC-011.

## Open Questions

None.
