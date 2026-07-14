# Design: Portable Instruction-Only Change-Ready SDLC

## 1. Context

The desired product is not an implementation pipeline or repository-specific automation. It is a reusable
instruction framework loaded from `global/` and applied by OpenCode in any software project.

The main/general agent is the active primary agent that owns the user session, not a nested general-purpose
subagent. It is the orchestrator. It reads the target project's requirements and policies,
chooses proportional ceremony, delegates bounded work to narrow specialist agents, executes project-native
validation, routes failures, and decides whether the current local candidate is Change-Ready. Production,
SDET, and final review remain separate roles.

The framework must remain small enough to retrieve and follow. Repeating the complete lifecycle in
`AGENTS.md`, several agents, and several skills would reduce compliance through context cost and drift. The
design therefore uses one complete global orchestration skill, one compact always-loaded routing trigger, and
role-specific prompts that contain only each role's local contract.

## 2. Goals And Non-Goals

### Goals

- Work in projects using any language, framework, build/test ecosystem, version control, hosting model, or
  repository layout.
- Make the main/general agent visibly own process state, delegation, validation, correction routing, and
  final synthesis.
- Keep each specialist role narrow and mutually exclusive.
- Establish applicable proof before independent risk-driven test assessment: the smallest complete
  production happy path for production work, or baseline/current test-boundary proof for test-only work.
- Let SDET find realistic defects and corner cases rather than optimize coverage or test count.
- Ensure final review sees the exact complete post-SDET, post-validation candidate.
- Re-run affected evidence after every candidate correction.
- Produce a binary local Change-Ready result without external actions.
- Keep instructions concise, non-duplicating, and explicit enough for less capable agents.

### Non-Goals

- No application/runtime code, plugins, MCP tools, workflow engines, command runners, or persistent
  lifecycle state.
- No non-global runtime dependency. Minimal repository-only catalog/profile metadata, static instruction
  contracts, validator dispatch, fixtures, and focused regression tests may validate and distribute the
  global Markdown artifacts but never execute the SDLC.
- No portable hard-coded language, framework, package manager, build system, test framework,
  version-control system, CI/hosting provider, operating system, shell, repository, issue tracker, review
  product, model, or command. A project or kit adapter may retain owner-selected local configuration without
  turning it into a portable requirement.
- No OS sandbox, dynamic path ACL, durable run database, cryptographic evidence protocol, or claim of
  technical enforcement beyond OpenCode permissions and main-session inspection.
- No mandatory automated test edit when independent SDET assessment proves existing evidence is sufficient.
- No arbitrary universal retry count, coverage threshold, mutation score, or test-count gate.
- No publication, upload, remote review creation/update, integration, deployment, release, or archive.

## 3. Artifact Topology

### Always-loaded runtime overlay

`global/AGENTS.md` contains only the rules the main/general orchestrator must never forget:

- the behavior-change trigger that requires loading `change-ready-sdlc` before mutation;
- exactly Small/Material classification;
- the fixed role order and ownership boundaries;
- main-only project-native validation and final readiness judgment;
- evidence invalidation after candidate changes;
- external-operation prohibition without explicit authority.

It does not restate detailed risk categories, report schemas, or role prompts.

### Canonical global orchestration skill

`global/skills/change-ready-sdlc/SKILL.md` is the only complete global orchestration adapter. It
operationalizes the repository's existing conceptual Universal Development Loop without copying its named
stage list. It contains:

- profile classification;
- Authoritative Brief lifecycle values, role views, and reference to the shared schema;
- portable adapter discovery;
- production, proof, SDET, validation, review, correction, and handoff transitions;
- evidence requirements and stale-evidence rules;
- compact orchestration record;
- Change-Ready acceptance checklist;
- output shape.

The skill description must trigger on implementation, bug fixes, behavior-changing refactors, loaded
instruction/config changes, generated-output changes, and explicit local readiness requests. It must stay
quiet for review-only questions, pure research, and demonstrably inert content edits.

### Narrow role agents

- `implementation-worker`: production artifacts only.
- `sdet-quality-engineer`: independent risk assessment and test artifacts only.
- `final-candidate-reviewer`: read-only final candidate judgment only.
- `implementation-readiness-reviewer`: pre-mutation requirement and adapter readiness.
- `test-coverage-reviewer`: optional specialist assessment of SDET evidence, never a test author.
- `troubleshooter`: diagnosis only; production/test corrections route to their owners.
- `session-delivery-reviewer`: Material delivery/readiness gate, not source author.

The orchestrator/canonical skill owns the generic local change-handoff package. `merge-request-author`
remains only a PR/MR rendering adapter when the target project uses that delivery model.

### Non-runtime kit support

The repository may add only the deterministic support needed to keep its distribution green.
The exclusive production and test write set is the authoritative 59-path manifest in `tasks.md`
(42 modified, 16 added, 1 deleted). Do not invent a second partial inventory here.

That support surface includes:

- catalog/profile entries for the new skill and agents;
- a filename-specific static SDET permission/text contract;
- validator dispatch before generic read-only reviewer handling (including pure active-authority policy
  ownership in `tools/validators/active-authority.ts`);
- kit-local doctor and activation installer (`tools/doctor.ts`, `tools/install-opencode-global.ts`);
- project templates including `templates/project/adapter.json`;
- the three existing maintenance routing consumers that still advertise testing-mode implementation-worker;
- focused contract, permission, catalog, routing, and profile regression tests.

This support validates static artifact shape only. It cannot prove dynamic test-path confinement, fresh
context, risk quality, candidate continuity, command safety, or Change-Ready. Those remain instruction and
behavioral-eval responsibilities. Support must not execute lifecycle state.

## 4. Decisions

### D1. Use one canonical skill and one mandatory trigger

For every behavior-changing task, the main/general agent must load `change-ready-sdlc` before the first
mutation. The trigger is short and early in `global/AGENTS.md`. The skill owns the detailed process; role
agents reference the orchestrator brief and do not copy the full lifecycle.

This is the main anti-forgetting mechanism available in an instruction-only design. Fresh-session evals
must reject behavior where the orchestrator edits first and remembers the skill later.

### D2. Use exactly Small and Material

Initially classify exactly as Small or Material. Small requires clear requirements, local reversible scope,
one affected boundary, known focused validation, and no public-contract, persisted-data, migration, security,
concurrency, deployment, or compatibility risk. Any false or unknown condition selects Material. A run may
escalate only from Small to Material; never downgrade Material to Small or discard already-required evidence.

Profile controls planning and delivery ceremony, not independent testing. Every behavior change receives a
fresh SDET assessment. SDET `N/A` is allowed only for evidence-backed non-behavioral work.

### D3. Keep the main/general agent as sole orchestrator

The orchestrator owns:

- source-of-truth selection and the Authoritative Brief;
- profile selection and task tracking;
- adapter discovery from the target project;
- specialist dispatch and fresh-session boundaries;
- project-native validation execution;
- candidate capture and scope inspection;
- failure batching and owner routing;
- final review dispatch;
- local package and Change-Ready decision.

Specialists do not delegate, ask the user, execute external actions, or claim lifecycle completion. They
return report-only handoffs to the orchestrator.

### D4. Use one concise Authoritative Brief

The orchestrator never delegates a raw user prompt or assumes access to hidden conversation context. Every
dispatch uses one self-contained execution-ready brief. Small and Material use the same fields; Small keeps
answers compact, while Material supplies the depth required by risk. A genuinely inapplicable field is
`N/A - <reason>` rather than silently omitted.

The complete shared field schema remains defined once in the always-loaded Universal Task Briefing Contract
inside `global/AGENTS.md`. The orchestration skill references that schema and adds only lifecycle-specific
field values, role views, and the cold-context dispatch-readiness gate. It does not copy the full schema.

The shared schema contains:

- role and objective stated as the required end state and value;
- business/system context;
- current state and evidence, separating observations, assumptions, hypotheses, and recommendations;
- original task, authoritative source references, later owner decisions, and superseded statements;
- required deliverables;
- in-scope and out-of-scope/non-goals;
- exact read scope, write scope, and forbidden actions;
- requirements, invariants, acceptance criteria, and observable happy path;
- resolved decisions and rationale, including approach, ownership, error model, compatibility, and rollback
  when relevant;
- applicable security, reliability, compatibility, performance, protocol, operations, and privacy
  expectations, with `unknown` where undefined;
- inputs/source of truth, dependencies, and preconditions;
- exact project-native verification procedures and expected success conditions;
- return contract with required evidence, changed artifacts, commands/outcomes, blockers, and residual risks;
- blocker/escalation policy distinguishing agent-resolvable unknowns from owner decisions.

Before dispatch, the orchestrator verifies that a cold-context subagent can state what result is required,
why it matters, what it may change, how success is proved, and what it must return. If not, dispatch blocks
until the brief is repaired.

Small uses compact field values. Material uses the target project's accepted durable specification system when
one exists, otherwise a complete session brief. The framework never introduces OpenSpec or another
specification product into a project solely because the task is Material.

### D5. Discover project adapters instead of prescribing tools

Before production work, the orchestrator identifies the target project's:

- requirement source;
- production author adapter;
- SDET/testing capability;
- build, check, test, and other validation procedures;
- candidate-capture mechanism;
- deterministic candidate identity-generation capability (part of candidate capture or a paired adapter);
- independent final reviewer;
- delivery/readiness gate;
- external-operation policy and native readiness label.

Sources include project instructions, build/validation configuration, existing automation, schemas, and
explicit owner input. Missing mandatory capability is `unknown` or `blocked`. Missing reproducible candidate
identity-generation capability blocks qualification. The orchestrator never imports npm, Git, a CI provider, a
review tool, a portable hash algorithm, or any other foreign default merely because an example used it.

### D6. Separate production and SDET authorship

The production author implements and proves the smallest complete happy path without changing automated
test artifacts. It returns changed artifacts, proof procedure, blockers, and residual risks.

The portable contract does not prescribe the production adapter's model. For this kit only, the owner
explicitly retained the pre-existing `model: xai/grok-4.5` and `variant: high` configuration on
`implementation-worker` for token-cost control. This local adapter decision supersedes the earlier blanket
plan to remove fixed model/variant from every lifecycle role. SDET and final-review agents still omit fixed
model/variant and inherit active project/session configuration; another project may use any conforming
production adapter.

After current applicable proof, a fresh SDET context receives original requirements, current candidate,
existing tests, project testing guidance, proof evidence, exact test-only write scope, validation
descriptions, and exact `Input Semantic Candidate Identity`, `Input Package Identity`, and `Identity Recipe`
for the pre-SDET candidate covered by the initial Applicable Proof. Prefer a distinct effective SDET model when
available; same-model use records residual correlation risk and does not remove the fresh role/context
requirement. The portable contract never hard-codes a provider/model. Applicable proof is production happy-path
proof for production work or the defined baseline/test-boundary proof plus production-dispatch `N/A` rationale
for test-only work. SDET does not receive production reasoning or expected approval language.

SDET returns one action:

- `authored-tests`: a demonstrated evidence gap required a test-only change;
- `assessed-existing-tests`: current tests already cover the accepted risk matrix;
- `blocked`: requirements, oracle, boundary, permission, environment, or practical automation is
  insufficient.

SDET first returns a provisional report with identity fields: Input Semantic Candidate Identity, Input Package
Identity, Semantic Candidate Identity, Package Identity, and Identity Recipe. Provisional `authored-tests` keeps
the input pair exact and sets current Semantic/Package to `pending orchestrator recapture after test edits`
while Identity Recipe records the input recipe and notes that main must confirm/reuse or replace it through
current recapture; SDET never fabricates post-edit hashes. Provisional `assessed-existing-tests` has no mutation:
current pair equals input pair and recipe unchanged; prior Applicable Proof remains valid without redundant
replay. `blocked` reports known input/current status exactly or unknown.

After provisional authored-tests, main inspects exact test-only scope, freezes, records/reproduces the current
Identity Recipe, recaptures both current identities, re-runs Applicable Proof at the relevant production/system
boundary against the complete post-test current candidate (production need not be redispatched when unchanged,
but observable proof must run and bind to current semantic identity), then runs complete validation. If recapture
changes the recipe unexpectedly, scope is unsafe, proof cannot run or pass, or current identities cannot be
reproduced, block before final SDET and validation progression. Main sends exact current pair, recipe, post-test
Applicable Proof outcome, and bounded validation outcomes to the same SDET context. Final SDET records exact
current pair and recipe; pending is forbidden in final. Final SDET checks received proof/validation coherence and
does not execute them. Same SDET context remains valid only for provisional→final on that inspected test-only
mutation. Qualification gates bind to Semantic Candidate Identity; Package Identity records exact bytes handed
off or reviewed. Candidate correction requires a new fresh SDET assessment.

For a test-only task, no production edit or production-author dispatch is invented. The orchestrator first
captures baseline/current-boundary behavior and the reason the task is test-only, then dispatches fresh SDET
as the sole content author. The normal scope inspection, project-native validation, and independent final
review still apply. For tests co-located with production code, ownership follows exact test blocks/content,
not whole-file labels; unsafe separation blocks the edit.

### D7. Keep validation and candidate evidence project-native

The orchestrator records each applicable validation command or procedure and its source before execution.
Agent suggestions do not silently expand authority. A candidate change to validation definitions requires
the orchestrator to re-derive authorization from trusted project or owner evidence.

Candidate capture must include every scoped added, modified, and deleted artifact plus reviewable
representations for generated or binary artifacts. The mechanism may be version-control diff, filesystem
comparison, artifact manifest, or another project-native facility. It excludes secrets and unrelated work.
Capture and handoff maintain the dual-identity pair plus a recorded Identity Recipe: Semantic Candidate
Identity for qualification binding, Package Identity for exact-byte audit, and Identity Recipe for
adapter-owned reproducible framing. Before freeze or qualification, main records a privacy-safe Identity
Recipe containing mechanism/algorithm identifier and version; baseline/reference used to determine candidate
and pre-existing task items; stable scoped path manifest and ordering; add/modify/delete representation
including deletion framing; path/content boundary framing; exact byte and line-ending treatment;
semantic-normalization rule/version; and reproduction procedure with required local inputs. Do not prescribe a
universal hash, version-control product, OS, language, command, filename, or product.

Writers are serial unless the orchestrator proves isolated or exact non-overlapping scopes. After production
path completion, the orchestrator closes production writers, integrates outputs, freezes the complete pre-SDET
candidate, records/reproduces the Identity Recipe, and captures both identities before Applicable Proof. It then
runs Applicable Proof against that frozen candidate; after proof and terminal-or-isolated closure of any
mutation-capable proof execution, it recaptures with the same recipe and requires both identities unchanged
before Fresh SDET dispatch. After provisional authored-tests, it freezes and recaptures the complete post-test
candidate before post-test Applicable Proof, complete validation, and final SDET. No production or test mutation
runs concurrently with qualification gates. Any mutation invalidates and abandons the current qualification
attempt and affected evidence, but does not close a still-live mutation-capable execution.

After any validation that may mutate artifacts, the orchestrator recaptures the candidate. A scoped change
invalidates prior candidate-bound proof and gates.

### D8. Route corrections by artifact ownership

| Failure | Owner |
| --- | --- |
| Product/build defect exposed by existing or new validation | Production author; reproducer preserved |
| Test, fixture, simulator, harness, or oracle defect | Fresh SDET |
| Missing or weak risk evidence | Fresh SDET |
| Failure with unknown cause or ownership | Orchestrator diagnosis or blocker; no correction author yet |
| Validation authority/environment blocker | Orchestrator or evidence owner |
| Final-review production finding | Production author |
| Final-review test finding | Fresh SDET |
| Handoff-package text only | Orchestrator/package author |

Any production or test correction invalidates affected applicable proof, SDET, validation, specialist review, and
final review. The corrected candidate repeats all downstream gates. Handoff-package-only edits may skip
candidate qualification when requirements and candidate artifacts are unchanged.

Unexplained fail/pass on an unchanged candidate remains blocked. Stop when the same failure repeats without
new root-cause evidence, a mandatory adapter is unavailable, workspace ownership is unsafe, or an owner
decision remains unresolved. There is no universal numeric cycle cap.

After restart, compaction, cancellation, or context loss, the orchestrator reconstructs current brief,
candidate, role identities, validation, and correction evidence from authoritative project/session sources.
Anything that cannot be proved is stale and blocks Change-Ready; continuity uncertainty never resets prior
failures.

### D9. Make final review independent and last

Final review begins only after accepted SDET evidence and complete applicable validation. The reviewer gets
the Authoritative Brief, complete privacy-safe candidate, current applicable proof, SDET risk/oracle evidence,
validation outcomes, simulation/mock exceptions, corrections, and residual risks. Applicable proof means
current production happy-path proof for production work; for evidence-backed test-only work it means the
production-dispatch `N/A` rationale, current baseline/test-boundary proof, and passing validation of the
changed test boundary. After authored-tests, applicable proof is the post-test proof bound to the current
semantic identity and recipe; missing post-test proof replay after authored-tests blocks final review.

The reviewer uses a fresh read-only context and authored neither production nor tests. Native verdicts map
to `approved | approved_with_notes | changes_requested | blocked`. Actionable notes do not pass. No
conforming reviewer means blocked.

Its structured report contains the exact verdict enum, separate `Semantic Candidate Identity`,
`Package Identity`, and `Identity Recipe` fields for the candidate assessed, ordered evidence-backed findings
with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`, `Confidence`, and
`Needs external reviewer`, plus blockers, residual risks, and actionable continuation items. Qualification
gates bind to Semantic Candidate Identity; Package Identity records exact bytes handed off or reviewed. The
final reviewer verifies that post-test Applicable Proof (when authored-tests ran), final SDET, validation, and
this review share the current semantic identity and recipe; missing or unreproducible recipe or missing
post-test proof continuity after authored-tests blocks. The verdict field is constrained; the report is not a
bare verdict. Inputs must be privacy-safe inline or attached content directly readable under reviewer
permissions; external paths alone are insufficient.

### D10. Define local Change-Ready

`Change-Ready: yes` requires current evidence for accepted requirements, applicable proof, SDET, complete
project validation, independent final review, scoped candidate ownership, no blocking required action, and
a local change-handoff package.

Material work always runs the discovered conforming delivery/readiness gate with current task/evidence
status; missing conforming capability blocks and is never a skip due to unavailable inputs. Small invokes
that gate only when project policy, risk, or the owner requires it. Diagnostic scale never overrides the
Portable Small/Material profile. Delivery and compact orchestration outputs record current
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Delivery verifies the same
recipe/baseline across proof, SDET, validation, final review, delivery, and the current package, including
post-test Applicable Proof continuity after authored-tests; missing or unexplained recipe change or missing
post-test proof continuity after authored-tests blocks. Any package change after final review must be an exact
marker-only metadata transition with unchanged Semantic Candidate Identity, the same recorded Identity Recipe
and baseline, and exact diff proof; otherwise stale evidence blocks.

The package contains context, requirements, scope/non-goals, changed artifacts, applicable proof, SDET and validation
evidence, review results, risks/rollback, review focus, baseline/candidate assumptions, residual blockers,
and `External Operations: not performed`.

Projects may render `PR-Ready`, `MR-Ready`, `Ready To Land`, or another native label. Publication, upload,
remote review creation/update, integration, deployment, release, and archive require separate authority.

### D11. Accept the instruction-only enforcement boundary

No instruction can technically guarantee model compliance, path confinement, command safety, or durable
state. The framework therefore relies on:

- a short always-loaded mandatory trigger;
- one complete global orchestration skill;
- mutually exclusive role prompts and denied tools where OpenCode supports them;
- exact brief scopes and report envelopes;
- main-session before/after candidate inspection;
- fresh-session behavioral evals;
- binding independent final and Material delivery review.

Artifacts must describe these as process controls, not sandbox guarantees.

### D12. Pre-resolve the `global/AGENTS.md` migration

Implementation SHALL follow this map rather than asking the implementer to redesign authority:

| Current section | Required disposition |
| --- | --- |
| Core Golden Rules lifecycle chain | Replace only the chain with the pre-mutation `change-ready-sdlc` trigger; retain safety, evidence, simplicity, and surgical-change rules |
| Universal Task Briefing Contract | Retain as the single shared execution-ready brief schema; allow compact Small field values and full Material detail; the skill references rather than duplicates it |
| Autonomous Work Contract | Retain main-session ownership and blocker-only questions; change completion wording to Change-Ready and make delivery evidence project-adapter based |
| Interactive Next-Step Handoff | Retain owner/external-action boundaries; use Change-Ready plus optional project-native labels |
| Parallel Work And Delegation | Retain fan-out ROI and complete briefs; require isolated/non-overlapping writers, integration barrier, and no writes during qualification |
| Implementation Method | Replace mandatory implementation products with project-adapter discovery; this kit's implementation worker is the default production adapter; other tools are optional checkpoints only |
| Code Review Method | Replace mandatory product-specific final review with `final-candidate-reviewer` as this kit's default conforming adapter; other reviewers are optional adapters with explicit verdict mapping |
| Risk-Driven Test Workflow | Preserve risk/oracle principles; replace testing-mode worker ownership with fresh SDET; point lifecycle ordering to the skill |
| Repository Changes and Task Completion Honesty | Retain unchanged except generic Change-Ready terminology where required |
| Local model/tool environment notes | Retain only as installation evidence; the portable framework never requires those models/tools |

The shared leaf-reviewer reference outside `global/` remains repository validation provenance only.
Mandatory runtime reviewer safety and output invariants live in always-loaded `global/AGENTS.md` plus each
role-specific global agent, so target projects do not need to read the external reference.

### D13. Make static support exact and non-behavioral

Production support writes (non-test) are limited to these paths in addition to the global Markdown targets.
The complete A/M/D inventory, including every test path, remains the authoritative 59-path table in
`tasks.md` (42 modified, 16 added, 1 deleted). This exclusive production list must stay aligned with that
manifest and must not omit already approved installer/template support:

- `tools/contracts/sdet-quality-engineer.ts`;
- `tools/contracts/implementation-worker.ts`;
- `tools/contracts/agents.ts`;
- `tools/contracts/reviewer-binding.ts`;
- `tools/contracts/skills.ts`;
- `tools/validators/agents.ts`;
- `tools/validators/skills.ts`;
- `tools/validators/routing.ts`;
- `tools/validators/opencode-config.ts`;
- `tools/validators/active-authority.ts` (pure AGENTS/SKILL active-authority structural policy; kit-local only);
- `tools/doctor.ts`;
- `tools/install-opencode-global.ts` (this kit's activation installer only; not a portable runtime dependency);
- `profiles/all.json`;
- `README.md`;
- `REPO_AGENTS.md`;
- `instructions/leaf-reviewer-agent-contract.md` (canonical maintenance/validation provenance for
  reference-based reusable reviewer bodies; not a target-project runtime dependency);
- `instructions/reusable-project-agent-instructions.md`;
- `instructions/porting-checklist.md`;
- `instructions/universal-development-loop.md`;
- `templates/project/AGENTS.md`;
- `templates/project/validation.md`;
- `templates/project/adapter.json`.

`tools/contracts/agents.ts` and `tools/validators/agents.ts` enforce the reference-based reviewer form with
exact multiline heading RegExp for the forbidden inline blocks `## Leaf Contract`, `## Feedback Ledger`, and
`## Prevention Feedback`. Diagnostics name all three blocks and the affected file. The provenance file itself
may retain canonical shared text for authors; reusable runtime bodies must not inline those three sections.

In addition, `tools/validators/agents.ts` enforces the exact standalone `## Contract Reference` structure for
the 13 registered reusable reviewers in `PREVENTION_FEEDBACK_REVIEWER_FILES` and for
`final-candidate-reviewer.md`: exactly one heading, blank line, sole backticked path
`` `instructions/leaf-reviewer-agent-contract.md` ``, blank line, then next `##` heading or EOF.
Line-ending tolerant; rejects zero headings, duplicate headings (valid or malformed), and verbose
explanatory sentences. Cardinality is counted before shape validation. Diagnostics name the affected file.
Non-registered agents such as `qwen-local-worker` are intentionally out of that structural set.

Fresh SDET owns only the test files listed in task 5.1, including shared fixture helpers when Contract
Reference fixtures must migrate to the standalone form, and including the dedicated identity/recipe contract
module `tools/test-contracts-change-ready-identity.ts` when authorized by that task. No other production or
test path is implied by a directory name or by the phrase "smallest surface."

When the required final code-quality inventory reports `tools/test-contracts-change-ready.ts` as a
split-candidate under `--split-lines 800 --fail-on-split-candidates`, the smallest cohesive second-extraction
seam is a dedicated identity/recipe module: move only dual-identity, Identity Recipe, marker-normalization,
and restart-continuity contract tests plus their local test-only helpers/constants into
`tools/test-contracts-change-ready-identity.ts`. Register that module from `tools/test-contracts.ts` solely by
importing and spreading its exported test array so deterministic suite order is preserved. Production
contracts/validators and test oracles must not change during the split. Both resulting modules must remain
below 800 lines without artificial minification or readability loss. Do not relocate these tests into
validator fixtures or invent further modules solely to evade the threshold.

`tools/contracts/skills.ts` defines the exact `change-ready-sdlc` contract. The skill must contain all of
these case-sensitive lifecycle markers:

- `Adapter Discovery`;
- `Profile: Small | Material`;
- `Authoritative Brief`;
- `Applicable Proof`;
- `SDET Provisional Report`;
- `Candidate Freeze`;
- `Project-Native Validation`;
- `Final Candidate Review`;
- `Change-Ready Decision`.

The canonical skill must not contain these case-insensitive portable-hardcode tokens: `npm `, `pnpm `,
`yarn `, `node `, `cargo `, `go test`, `dotnet `, `git `, `gh `, `openspec `, `dream_team_`,
`session_delivery_context`, `.github/`, `Windows`, `Linux`, or `macOS`. The check is intentionally scoped to
the canonical skill, which needs no stack-specific example. Non-normative examples elsewhere remain allowed.

The duplicate-orchestration check scans global Markdown artifacts other than the canonical skill and fails
when any one artifact contains six or more of the nine exact lifecycle markers. This is a deterministic
drift signal, not semantic or behavioral proof. `tools/validators/skills.ts` validates the skill contract;
`tools/validators/routing.ts` validates the mandatory `global/AGENTS.md` trigger and the three lifecycle role
routes; `tools/validators/agents.ts` dispatches filename-specific agent contracts. Diagnostics name the file
and missing, forbidden, or duplicated token. Seeded invalid fixtures assert those exact diagnostics.

The runtime-self-containment fixture combines only `global/AGENTS.md` and each mandatory reviewer body and
asserts the exact shared safety/output tokens plus role-specific report tokens, including dual-identity
report fields `Semantic Candidate Identity` and `Package Identity` on SDET, final-candidate, and
session-delivery outputs, plus `Identity Recipe` on SDET, final-candidate, session-delivery, and compact skill
output, and SDET input/current identity handshake fields (`Input Semantic Candidate Identity`,
`Input Package Identity`, pending recapture token). It proves static self-containment only; tasks 4 and 6 remain
the behavioral evidence.

`tools/contracts/reviewer-binding.ts` and `tools/validators/routing.ts` also require the five project-facing
binding surfaces (`REPO_AGENTS.md`, `global/AGENTS.md`, reusable project instructions, UDL, and project
template) to retain exact Material-always, Small-conditional, and missing-capability-blocks tokens via an
explicit named token array. Static validation gathers evidence only and never decides runtime readiness.
README Manual Skills/Agents topology requires shared contracts from the active global config directory
(`OPENCODE_CONFIG_DIR` when set, else `~/.config/opencode`; override bypasses the default) for complete
lifecycle skills, write-capable lifecycle agents, and reference-based reviewers. Global copy destinations are
`<active-global-config-dir>/skills/...` and `<active-global-config-dir>/agents/...`; matching shared contracts
live at `<active-global-config-dir>/AGENTS.md`. Project-local `.opencode` paths remain allowed and do not
replace those shared contracts. No project-level-equivalent substitute is defined.

UDL maintenance guidance states that a production correction invalidates prior SDET qualification and requires
a new fresh corrected-candidate testing context; only provisional→final reporting on an unchanged candidate may
reuse the same testing context. Adapters and owner/project constraints may change commands, artifacts, add
stricter gates, or stop work, but cannot weaken, reorder, or omit mandatory role separation, proof-before-SDET,
corrected-candidate freshness, validation, independent final review, or applicable Material delivery while
claiming Change-Ready.

### D14. Use reproducible fresh-process evaluations and candidate-only validation

Before editing global artifacts, the main session records the resolved active `OPENCODE_CONFIG_DIR`. After
instruction changes, each new discovery or behavioral case starts a new `opencode` process without
`--continue` or `--session`, passes an explicitly selected available model, uses `--format json`, and sets
`--dir` to the intended repository or disposable workspace. `opencode debug skill` and
`opencode debug agent <agent-name>` provide discovery and effective frontmatter evidence. `opencode run`
provides the behavioral transcript. `opencode export <session-id>` is used only when the JSON event stream
does not contain the complete privacy-safe tool order or role evidence. `--auto`, remote sharing, and remote
state are forbidden.

Each eval record remains in the main-session evidence/delivery bundle rather than a new repository ledger.
It contains the exact command and prompt, excluded hints, resolved config directory, disposable workspace,
model/variant, session id, loaded artifacts, observed tool order, profile, adapter choices, role/session
identities, evidence, forbidden outcomes, and binary evaluator decision. A fresh session means a new session
id from a new process. Distinguish a fresh primary `opencode run` process from orchestrator-owned subagent
dispatch: leaf specialists (production, SDET, final review, delivery) are created and resumed only by the
active primary through the discovered runtime dispatch/continuation adapter. Do not invoke a subagent by
direct `opencode run --agent <subagent-name>`; live OpenCode rejects that path and falls back to the default
primary, which falsely attributes role evidence.

The sole continuation exception is the provisional-to-final SDET handshake. Continue the recorded primary
orchestrator session (not the child SDET id) with
`opencode run --session <recorded-main-session-id> --model <same-model> --format json --dir <repository> <bounded-validation-outcomes>`
and no subagent name on that CLI. That primary then resumes the exact recorded SDET child through the
discovered runtime continuation adapter and supplies the bounded proof/validation outcomes. Accept the final
SDET report only when evidence verifies: the recorded primary session id, the same child SDET session/task
id, the same SDET role/context, the same model disclosure, and final report identity fields. Direct CLI
`--agent` use for a subagent, fallback to the default primary, a changed child session/task id or role, or
unavailable/unverifiable child continuation blocks acceptance. A candidate correction starts a new primary
process without continuation flags and must produce a new primary session plus a different child SDET
session/task id (fresh corrected-candidate SDET; no continuation flags).

Disposable workspaces live under the approved temporary root and contain no credentials or unrelated user
work. The main session records their baseline manifest, performs only the requested harmless change, captures
the privacy-safe result, and removes only that disposable workspace after evidence is retained.

Because unrelated untracked `.opencode/skills` currently produce strict warnings, qualification runs in a
detached temporary worktree created from the recorded baseline and overlaid with every scoped added,
modified, and deleted candidate artifact, including active OpenSpec artifacts. The main session verifies the
overlay manifest against the scoped candidate before running `npm run validate:strict`, `npm test`, the CI
code-quality inventory command, instruction inventory, OpenSpec validation, and
`npm run openspec:gate -- --operation prepush` there. Every command must exit `0`; the operation gate must
also report a non-blocking status. The worktree uses Node 24 and runs `npm ci` first; dependency installation
must exit `0`, remain confined to the disposable worktree, and leave every tracked candidate artifact
unchanged. This candidate-only procedure does not alter or hide candidate files; it excludes unrelated
workspace content and leaves the original `.opencode/skills` untouched.
Current-workspace baseline failures remain recorded rather than called green.

### D15. Make main-owned fan-out and bounded specialist continuation explicit

Only the active primary orchestrator may create or resume specialist sessions. Leaf production, SDET,
review, diagnosis, and delivery roles never spawn or resume nested agents. Real parallelism uses one
orchestrator-owned fan-out through the discovered runtime fan-out adapter containing multiple independent
dispatches; single blocking dispatches are serial. One blocking specialist call is not background
parallelism; real concurrency requires one adapter-supported fan-out and must not invent a portable tool or
API name. Writers may run concurrently only when isolation or exact non-overlapping write scopes are proved
before dispatch, and all outputs pass an orchestrator-owned integration barrier before proof or qualification.

Accept specialist dispatch or resume evidence only when the discovered runtime adapter proves active primary
parent identity, child session/task identity, and expected child role/context. Top-level/default-primary
fallback is not specialist evidence. Unavailable or unverifiable child dispatch or continuation blocks the
affected gate. Portable runtime text must not hard-code a concrete runtime mechanism, provider, model, OS, or product.

Universal writer attempt closure applies to every writer dispatch/attempt, serial or fan-out. Every writer
dispatch/attempt remains open after timeout, cancel, missing report, or partial mutation until a terminal
report is received, adapter-proven terminal cessation is established (cancellation counts only after the
writer can no longer execute or mutate), or its workspace/write authority is isolated or revoked so it cannot
mutate the candidate. Recorded timeout, cancel, or missing report alone is not closure. Cancellation request
or acknowledgement alone is not closure. Unknown liveness or unisolated ownership blocks integration, freeze,
proof, and qualification. Late output or late mutation after the attempt boundary invalidates the attempt.

If any fan-out child or serial writer attempt blocks, times out, is cancelled, returns a missing report, or
leaves a partial mutation, do not freeze, prove, or qualify. A fan-out slice or serial writer attempt is closed
only when a terminal report is received, adapter-proven terminal cessation is established (cancellation counts
only after the writer can no longer execute or mutate), or its workspace/write authority is isolated or revoked
so it cannot mutate the candidate. Cancellation request or acknowledgement alone is not closure. Record each
slice/attempt state and identity, recapture attributable mutations, quarantine unsafe ownership, integrate only
after every result is accounted for, and route retry, resume, or fresh dispatch by continuity rules without
erasing prior failure—only after the open attempt is closed or isolated. Partial writer failure is an
orchestrator accounting and integration problem, not a new persistent coordinator or durable state machine.

The orchestrator records each dispatched specialist's role, ownership scope, and runtime session/task
identity. It should resume the same production-author context for a bounded correction to artifacts that
author owns when the objective, role, and scope remain continuous. The continuation receives the new
reproducer/outcome, exact current Semantic Candidate Identity, Package Identity, and Identity Recipe,
explicit objective text continuous with the original production objective, an explicit brief delta, unchanged
forbidden actions, and the exact return contract. It must not rely on an implicit chat-memory-only
instruction.

Continuation is not appropriate when the prior session is unavailable or cannot be identified, continuity
cannot be reconstructed, role, objective, or ownership changes, scope materially expands, or an independence
rule requires freshness. In those cases the orchestrator dispatches a new conforming specialist with a
complete cold-context brief or blocks. Corrected-candidate SDET remains a new fresh context, and final review
remains fresh and read-only. Reusing a production author does not preserve old Applicable Proof, SDET,
validation, or final-review evidence; affected gates replay against the corrected candidate.

Maintain two deterministic identities and one recorded Identity Recipe. Semantic Candidate Identity covers all
candidate content, including active OpenSpec artifacts. Status-marker normalization is adapter-owned, explicit,
and absent by default: the Identity Recipe records any selected status artifact and the enumerated pre-existing
status items/marker transitions that are normalized. Portable text does not prescribe a universal status
filename or marker syntax. Only proven forward transitions on those adapter-enumerated pre-existing status
items may be qualification-neutral; reverse, unknown, wording, order, add/delete, or evidence changes remain
semantic. This kit's OpenSpec recipe may use `tasks.md` `[ ]` and `[x]` / `[X]` as a project-local instance
only, not a portable requirement. For this change, the settled kit-local Identity Recipe is
`sha256-length-prefixed-entries-v4` with collision-safe length-prefixed binary entry framing and
semantic-normalization version `status-forward-v1`. SHA-256 is computed over the concatenation of framed entries
for the complete scoped path manifest in stable UTF-8 path ascending order. Each entry is: entry/version tag
byte `0x04`; unsigned 64-bit big-endian UTF-8 path byte length; exact UTF-8 path bytes; one-byte status tag
`A`/`M`/`D` (`0x41`/`0x4D`/`0x44`); unsigned 64-bit big-endian content length; exact on-disk content bytes for
`A`/`M` and zero content length with no content bytes for `D`. Deletion is status-tag only and cannot collide
with an empty `A`/`M` file or with literal `<deleted>` file content. Line endings are exact bytes with no
normalization. Baseline/reference is git commit `7c231e2`. Only `[ ]` → `[x]` or `[X]` on the exact pre-recorded
eligible baseline-unchecked task IDs `4.1`, `4.2`, `4.3`, `5.1`, `5.2`, `5.3`, `5.4`, `6.1`, `6.2`, `6.3`,
`6.4`, `6.5`, `6.6`, `6.7`, `7.1`, `7.2`, `7.3`, `7.4` may normalize back to baseline `[ ]`;
reverse/unknown/text/order/add/delete/evidence or recipe changes remain semantic. The eligible set is recorded
before qualification and remains immutable for same-recipe finite marker closure; exact item wording/order stays
unchanged. No normalization is applied at the initial freeze after recipe record, so initial semantic and package
hashes match. Current Semantic Candidate Identity and Package Identity are pending orchestrator recapture after
production/SDET changes and must not reuse stale v3 digests. Restart reproduction requires baseline `7c231e2`,
this recipe, the authoritative A/M/D path manifest, and the framed SHA-256 procedure above. Package Identity
covers exact bytes for handoff and audit. Identity Recipe is the adapter-owned privacy-safe record of how both
identities are framed and reproduced (mechanism/algorithm identifier and version; baseline/reference; stable
scoped path manifest and ordering; add/modify/delete and deletion framing; path/content boundary framing; exact
byte and line-ending treatment; semantic-normalization rule/version including any adapter-owned status-marker
normalization or explicit absence of normalization; reproduction procedure and required local inputs). Do not
prescribe a portable hash, tool, OS, language, command, filename, or product. Qualification gates bind to Semantic Candidate Identity; Package
Identity records exact bytes handed off or reviewed. Both identities and the Identity Recipe bind to the same
scoped candidate. If the recipe and required local inputs cannot reproduce both identities after restart,
compaction, or handoff, continuity is unknown and qualification blocks. SDET provisional/final reports use exact
separate fields `Input Semantic Candidate Identity`, `Input Package Identity`, `Semantic Candidate Identity`,
`Package Identity`, and `Identity Recipe`. Final-candidate reports, session-delivery outputs, and compact
orchestration records use exact separate fields `Semantic Candidate Identity`, `Package Identity`, and
`Identity Recipe` rather than one ambiguous candidate-identity field. Only an exact adapter-enumerated forward
status-marker transition on a pre-existing status item (this kit's local OpenSpec recipe: `[ ]` → `[x]` on a
pre-existing `tasks.md` task item) with current literal evidence is qualification-neutral metadata: use the same
recorded Identity Recipe and baseline/pre-existing status-item set (baseline cannot silently change), recapture
Package Identity, and do not replay candidate gates. Identity Recipe change is always semantic process-evidence
change and always stales qualification evidence requiring recapture/replay of affected gates; there is no
recipe-change exception. There is no generic handoff-note exception. Handoff-package-only text outside the
scoped candidate may skip candidate qualification only when the recorded Identity Recipe itself is unchanged,
both identities remain independently reproduced with that same prior recipe, and requirements and candidate
artifacts are unchanged. Any wording, evidence, blocker, verdict, risk, command, requirement, status
text/order/add/delete, reverse or unknown marker direction, or other candidate artifact change is semantic
mutation and invalidates affected gates. This closes the finite marker loop for delivery status closure without
excluding status text or whole OpenSpec files from the candidate.

Before reviewer dispatch, the orchestrator verifies every candidate and evidence input is directly readable
under the reviewer's effective permissions. External path references alone are insufficient. Supply a
privacy-safe inline or attached bundle (manifest, reviewable diff/content, runtime event excerpts when used
as proof, SDET report, validation outcomes). Missing readability blocks before dispatch; do not relax
reviewer permissions.

Finite Material delivery self-gate: after prerequisites, main may mark proven tasks through final-candidate
review as marker-only transitions, run delivery with only the delivery closing task unchecked, and after
accepted delivery with no other blocker mark that closing task as marker-only metadata and recapture package
identity without replaying semantic candidate gates. The delivery reviewer must not P0-block solely on its
own current closing task marker when every prerequisite is checked and this review is the literal evidence
for that task. Any other unchecked applicable task blocks.

Resumable task/session identity is a discovered adapter capability, not a portable API name. Projects
without resumable specialist sessions may use a fresh production author with the complete brief; they must
report that token-saving continuation is unavailable rather than inventing durable memory.

### Kit-local doctor/installer safety corrections (historical task 7.2)

These remain non-portable kit support decisions (the original multi-reviewer task 7.2 was superseded by the
owner stop line; production corrections already landed where needed):

- Doctor required authority uses structural Markdown headings and `js-yaml` frontmatter parsing rather than
  token co-presence, so one-line stubs and unloadable/malformed skill frontmatter block qualification while an
  independent complete copy still passes without source equality.
- Installer explicit modes are mutually exclusive before any side effect.
- Profile and local-config replacement share one exclusive-temp/fsync/raw-preimage-or-absence/rename primitive;
  profiles use fatal UTF-8 decode as the exact-byte editing boundary; template content is preflighted through
  shared `inspectOpenCodeConfigText` before provisioning; concurrent destination appearance fails closed.
- Residual check-to-rename race remains accepted without a lock/coordinator.

### D16. Acceptance scope lock and anti-polishing

Owner decision (2026-07-14): keep mandatory quality gates and serious-defect protection while preventing
unbounded reviewer, evidence, test, and eval expansion.

- Record accepted acceptance criteria, project-specific scope lock, planned gate waves, correction budget, and
  stop line in existing Authoritative Brief fields before first candidate mutation. Do not invent a second
  planning artifact.
- After first mutation, new blocking corrections or acceptance criteria require explicit owner approval or a
  reproducible P0/P1 defect affecting behavior, CI, security, data integrity, or compatibility. Severity label
  alone is insufficient.
- Mandatory-gate failure, unsafe writer ownership/liveness, and unresolved owner decision still block
  Change-Ready without justifying speculative product/evidence scope.
- Keep Required Next Actions binding, but restrict contents to mandatory-gate or qualifying P0/P1 blockers.
  Route P2/note, coverage-only gaps, optional evidence, and wording polish to Residual Risks or separately
  approved follow-up; they must not produce `changes_requested` or autonomous polish replay.
- Plan one SDET wave, one Final Candidate Review wave, and for Material one delivery wave. Replay only gates
  invalidated by a qualifying P0/P1 correction or failed mandatory gate.
- Select evals representatively from the accepted high-impact risk matrix. Exhaustive Cartesian work needs a
  concrete high-impact risk, regulatory/project mandate, or owner approval.
- Evidence tooling must not become a second product.
- Predeclared correction budget is a planning ceiling with no universal retry count. Exhausted budget with a
  remaining serious/mandatory blocker => Change-Ready no + owner escalation.
- Current-change stop line after the policy edit: one fresh corrected-candidate SDET focused on the two
  accepted defects, one complete candidate-only validation, one Final Candidate Review under the new blocker
  policy, one Material delivery review. Normative: SDLC-011.

## 5. Implementation Order

1. Capture current global-file diffs and ownership; stop on unsafe overlap.
2. Create the canonical `change-ready-sdlc` skill.
3. Replace duplicated/conflicting lifecycle prose in `global/AGENTS.md` with the short mandatory trigger and
   orchestration overlay.
4. Make `implementation-worker` production-only.
5. Add the dedicated SDET and final-candidate reviewer agents.
6. Align readiness, test-coverage, troubleshooting, delivery, and handoff artifacts only where required by
   the new boundaries.
7. Add minimal catalog/profile, maintenance routing, and static contract/validator support without lifecycle
   implementation.
8. Restart OpenCode and prove artifact discovery, routing, and role refusal before new test authoring.
9. Let fresh SDET exclusively update focused repository regression tests; run focused and full validation.
10. Under the owner stop line (D16), run one focused corrected-candidate SDET on accepted defects rather than
    the full historical multi-scenario eval matrix unless a qualifying serious defect or owner expansion
    reopens scope.
11. Run one Final Candidate Review and one Material delivery review under the anti-polishing blocker policy;
    do not open additional domain-review/eval/evidence waves without a qualifying defect or owner expansion.

## 6. Behavioral Validation

The target-project runtime remains instruction-only. Repository-local static contracts, validator dispatch,
fixtures, and fresh-SDET-owned regression tests validate/distribute those instructions but do not execute
the SDLC. Behavioral acceptance uses D14's exact fresh-process protocol, JSON event/session evidence, and
disposable workspaces.

Owner stop line (D16 / SDLC-011): remaining current-change acceptance is the four tasks in `tasks.md`
(`5.2`, `7.1`, `7.3`, `7.4`). The historical multi-scenario list below remains design inventory and residual
risk context; it is not an exhaustive mandatory acceptance battery for the current stop line unless a
qualifying serious defect or owner expansion reopens scope.

Historical representative inventory (not current exhaustive mandatory acceptance):

1. Inert content edit: Small, evidence-backed SDET `N/A`, no unnecessary ceremony.
2. Local behavior change in a non-Node project: project-native command discovery; production proof before
   fresh SDET; validation before final review.
3. Workspace without Git: candidate captured through another project-native mechanism.
4. Ambiguous public retry change: Material and blocked on unresolved semantics rather than guessed behavior.
5. Existing tests sufficient: fresh SDET returns `assessed-existing-tests` with risk/oracle evidence.
6. SDET test exposes product defect: production fixes; fresh SDET and all downstream gates replay.
7. SDET edits production: orchestrator blocks progression.
8. Preferred reviewer unavailable: configured conforming fallback runs or readiness blocks.
9. Native delivery label: underlying Change-Ready evidence remains unchanged for PR, MR, patch, or bundle
   workflows.
10. In a disposable isolated workspace, an adversarial prompt asks to skip the process and perform one
    harmless bounded edit. Recorded tool order must show skill load, profile, and brief before mutation;
    main/general preserves role order and the disposable artifact is not retained as implementation output.

Each eval records the exact prompt, loaded artifacts, agent/session identities, observed role order,
forbidden outcomes, and evaluator decision. Token presence alone is not a pass.

## 7. Rollback

This change has two distinct rollback modes. They MUST NOT be conflated.

### 7.1 Full change rollback (repository candidate)

Full change rollback is a reviewed restoration of the **entire authoritative scoped candidate manifest** for
this change to the captured baseline, not a runtime-instruction subset.

Scope identity for rollback SHALL come from the recorded scoped path manifest, Identity Recipe, and baseline
reference used for qualification of this change. Expected authoritative final size remains the complete coupled
  candidate (expected 59 paths: 42 modified, 16 added, 1 deleted; prior 58 plus pure active-authority policy owner
  `tools/validators/active-authority.ts`; exact A/M/D list is the authoritative table in `tasks.md`; no fabricated
  deletions), covering portable runtime global Markdown and the minimal non-runtime kit support surfaces listed in
proposal Impact (profiles/catalog, maintenance docs, contracts, validators, focused tests/fixtures,
installer/doctor support, project adapter template, OpenSpec support, and related paths in the recorded
manifest). Do not invent a broader tree reset.

Exact restoration semantics:

- **Modified** paths: restore baseline content for each path present in the recorded manifest.
- **Added** paths: remove each path that the recorded manifest marks as added by this change.
- **Deleted** paths: restore each path that the recorded manifest marks as deleted by this change, when a
  baseline copy exists.

Ownership, isolation, and safety:

- Use only the recorded manifest/Identity Recipe/baseline to identify exact paths. Never perform a broad
  workspace reset/checkout or overwrite unrelated, pre-existing, or teammate work outside that manifest.
- Prohibit unjournaled sequential in-place rollback in a shared or dirty workspace. Build the complete
  baseline-restored candidate in an isolated workspace or project-native snapshot/transaction, validate that
  restored package there, then integrate or swap into the target workspace only through a discovered
  project-native failure-atomic or explicitly journaled/recoverable mechanism that retains preimages. Owner
  authorization may be additionally required but never substitutes for failure atomicity or journaling.
- Preflight every manifest path, ownership, and acceptable preimage (qualified candidate or baseline) before
  integration. After interruption or restart, re-inventory; only complete candidate or complete baseline
  states may continue. A third or unattributed state blocks.
- If no safe isolated failure-atomic or journaled integration capability exists, ownership overlaps,
  integration partially fails or is interrupted, or any path has a third/unattributed state: stop before
  unprotected target mutation when possible and report rollback incomplete/blocked; hand off the validated
  isolated restored package; do not promise original workspace preservation after unprotected partial target
  mutation; do not run baseline validation against a mixed state; do not claim rollback complete.
- Do not prescribe a fixed VCS product, OS, shell, command, hash tool, durable recovery coordinator, or
  destructive default; use the project-available restoration adapter and a reviewed procedure.

After complete full change restoration only:

1. Run baseline-compatible repository validation for this kit (the same class of checks that established a
   trustworthy pre-change baseline), and do not call a failing result green.
2. Restart or reload OpenCode **only if** active global runtime artifacts or the active config pointer
   (`OPENCODE_CONFIG_DIR` / active global config directory) changed as part of the rollback or residual
   activation state. If only non-runtime support paths changed, restart is not required solely for those
   support paths.
3. No application data or external-state rollback is required: this change creates none. Remote publication,
   integration, deployment, release, and archive actions remain separately authorized and are out of scope
   for this rollback procedure.

Full change rollback is planned and evidenced in the handoff package, executed only when separately
authorized, and never required to claim Change-Ready. It is the only mode that restores repository
compatibility when runtime and support surfaces are tightly coupled. Restoring global instruction artifacts
alone leaves profiles, contracts, validators, tests, and maintenance/OpenSpec surfaces incompatible with the
restored runtime and is therefore insufficient.

### 7.2 Runtime activation rollback (operational only)

Runtime activation rollback restores the prior active `OPENCODE_CONFIG_DIR` / active global config directory
pointer (and any operator-local activation choice that points OpenCode at a candidate runtime tree) and
restarts or reloads OpenCode so the prior active instruction set is loaded.

Activation rollback:

- MAY disable the new runtime for subsequent sessions without mutating the repository candidate.
- SHALL NOT count as rollback of the repository change or of non-runtime support artifacts
  (profiles/catalog, contracts, validators, tests, maintenance docs, OpenSpec, or other manifest paths).
- Leaves the repository candidate intact; full change rollback remains a separate reviewed action if the
  workspace must return to baseline.

### 7.3 Handoff package

Local Change-Ready handoff `risks/rollback` for this change SHALL document both modes, state that full
rollback uses the complete recorded manifest via isolated restore plus project-native integration (not
unjournaled in-place multi-file rollback), state that activation-only rollback does not restore repository
support surfaces, and state that actual rollback remains separately authorized. Session delivery verifies
complete rollback plan/evidence and never treats activation rollback as full change rollback.

## 8. Open Questions

None.
