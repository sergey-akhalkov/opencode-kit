# library-instruction-artifacts Specification

## Purpose
Defines canonical instruction ownership, reusable skill and agent contracts, OpenSpec authoring requirements, validation boundaries, and context-efficiency invariants.
## Requirements
### Requirement: Canonical Universal Development Loop source

The repository SHALL have exactly one file that defines the Universal Development Loop step list and its supporting sections. The canonical file SHALL be `instructions/universal-development-loop.md`. Every other artifact in the repository that previously restated the step list SHALL contain only a reference or role-specific delta and SHALL NOT claim canonical sections or step counts that the canonical file does not contain.

The current canonical loop SHALL contain 12 steps through `Process Improvement`, followed by `Quality Defaults` and `Output Shape`. Token and time policy SHALL remain owned by the always-loaded operating priorities and `docs/token-economy.md`; documentation SHALL NOT claim a nonexistent canonical `Token/Time Rules` section.

#### Scenario: kit docs pointer

- **WHEN** a reader opens `docs/universal-development-loop.md`
- **THEN** the file SHALL contain a `## Universal Development Loop` heading
- **AND** the body SHALL point to `instructions/universal-development-loop.md` without restating the step list or inventing canonical sections.

#### Scenario: project template avoids a broken target-relative dependency

- **WHEN** `tools/init-project.ts` writes `AGENTS.md` into a target project
- **THEN** the written file SHALL describe the active global runtime authority
- **AND** it SHALL NOT require the target project to contain `instructions/universal-development-loop.md`.

#### Scenario: reusable project instructions use runtime authority

- **WHEN** `instructions/reusable-project-agent-instructions.md` is rendered
- **THEN** the file SHALL NOT inline the 12-step Universal Development Loop list
- **AND** it SHALL identify the loop as conceptual guidance subordinate to the loaded global authority.

#### Scenario: validator rejects current step duplication

- **WHEN** `npm run validate` scans the repository
- **THEN** the orchestrator SHALL fail with a clear error if any artifact other than `instructions/universal-development-loop.md` contains the current full 12-step loop body
- **AND** the detector SHALL derive or maintain the current step names rather than retired lifecycle names.

### Requirement: Compaction analyzes improvement across three directions and two targets
Every compaction summary SHALL evaluate quality, cycle speed, and token economy for both the active working repository and `opencode-kit`. Each of the six cells SHALL record observed session evidence, the smallest cheap improvement, expected benefit, cost/risk, or `none` when the session supplies no supporting evidence.

An improvement candidate SHALL be admitted only when it is local, reversible, low-cost, causally linked to an observed loss or opportunity and the original user goal, and does not expand accepted scope. The summary SHALL NOT invent timing, recurrence, savings, or root cause.

When an identifiable writable active OpenSpec change owns an admitted improvement, the main session SHALL immediately append an unchecked item under `## Session-Derived Improvements` in that change's `tasks.md`. The item SHALL state `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. It SHALL remain unchecked until implementation and its stated proof and validation are complete.

Automatic compaction SHALL emit every not-yet-persisted admitted candidate under `Pending Improvement Tasks` because compaction cannot call tools. The next session SHALL reconcile all such entries against `Original User Goal` and persist every still-admissible entry before substantial work. It SHALL NOT silently select one candidate and discard the remainder.

An improvement that belongs to another repository, expands outcome, or crosses a protected boundary SHALL NOT be silently implemented in the active change. The entry SHALL identify the exact target or owner blocker, and normal completion SHALL wait for an authorized scoped implementation path or an explicit owner change to accepted scope.

#### Scenario: Session provides evidence in every direction
- **WHEN** a session observes multiple distinct working-repository improvements and each passes the admission gate
- **THEN** every admitted improvement is appended to the owning active change's `tasks.md` with the required evidence and completion fields
- **AND** no candidate is dropped merely because another candidate has higher ROI.

#### Scenario: Session provides no evidence for a cell
- **WHEN** the session contains no observation supporting an improvement in one target and direction
- **THEN** that cell reports `none`
- **AND** it does not manufacture a generic best practice or task.

#### Scenario: Kit improvement would distract from incomplete project work
- **WHEN** the original project goal remains incomplete and a non-blocking kit improvement is available
- **THEN** the next action remains the highest-value project-goal action
- **AND** the kit candidate stays recorded without mutation.

#### Scenario: Compaction cannot write the active task file
- **WHEN** automatic compaction admits one or more improvements but cannot call file tools
- **THEN** it emits each complete task record under `Pending Improvement Tasks`
- **AND** the next active session persists every still-admissible entry before substantial work.

#### Scenario: Kit improvement does not belong to the working change
- **WHEN** an `opencode-kit` candidate is observed while an unrelated project change is active
- **THEN** the agent does not mutate kit files or pretend the project change owns that implementation
- **AND** the active task record identifies the target/owner blocker that must be resolved before normal completion or explicit scope change.

### Requirement: New OpenSpec changes schedule one final history retrospective

The loaded global authority and maintained OpenSpec propose skill and command SHALL require every newly authored change `tasks.md` to contain exactly one unchecked final-history analysis task as its initially last task. The task SHALL be created once during proposal authoring and SHALL NOT be added by apply, archive, compaction, or its own execution.

The task SHALL require the existing compaction improvement analysis without adding or changing its algorithm: the matrix rows are `Quality`, `Cycle Speed`, and `Token Economy`; the columns are `Working Repository` and `opencode-kit`; each cell contains evidence, the smallest cheap improvement, expected benefit, and cost/risk, or `none`; candidate admission and `Session-Derived Improvements` persistence use the existing canonical rules. The evidence input SHALL be the complete change `history.md` rather than the current session.

#### Scenario: Propose authors the final task once

- **WHEN** the maintained propose workflow creates a new change and finishes authoring `tasks.md`
- **THEN** exactly one unchecked final-history analysis task is present as the last initial task
- **AND** the task names `history.md` and the existing compaction improvement contract.

#### Scenario: Existing change is not retrofitted

- **WHEN** an active or archived change predates this creation rule and its task inventory lacks the final-history analysis task
- **THEN** the workflow does not synthesize the task during apply or archive
- **AND** no historical artifact is rewritten solely to add it.

#### Scenario: Compaction behavior remains unchanged

- **WHEN** automatic compaction analyzes the current session
- **THEN** it retains its existing summary, matrix, admission, and pending-task behavior
- **AND** it does not create or schedule the final `history.md` analysis task.

### Requirement: Final history analysis uses the existing improvement contract

When the final-history analysis task becomes eligible, the loaded apply workflow SHALL analyze the complete `history.md` using the same canonical matrix, admission gate, target ownership, authority rules, and task fields used by compaction. The accepted change outcome SHALL remain the original-goal anchor, while the journal SHALL be the evidence source.

Every admitted candidate SHALL be appended as an unchecked `Session-Derived Improvements` task with `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. Apply SHALL immediately continue through those generated tasks. If no candidate passes, the analysis SHALL record `none` and SHALL NOT manufacture work.

#### Scenario: Journal evidence admits improvements

- **WHEN** the complete `history.md` supplies one or more candidates that pass the existing compaction admission gate
- **THEN** apply persists every admitted candidate in the existing task format
- **AND** immediately continues normal implementation, proof, validation, and checkoff for those tasks.

#### Scenario: Journal supplies no admissible evidence

- **WHEN** every matrix cell lacks supporting journal evidence or every candidate fails the existing admission gate
- **THEN** the final analysis records `none`
- **AND** creates no generic improvement task.

#### Scenario: Final analysis does not recur

- **WHEN** the final analysis appends one or more ordinary improvement tasks
- **THEN** neither apply nor those tasks append another final-history analysis task
- **AND** the original analysis is not rerun after generated work.

### Requirement: Structural validation and behavior evaluation have separate authority
The kit SHALL permit deterministic TypeScript validators, schemas, fixtures, inventories, and tests for explicit structural facts, official config shape, exact safety invariants, mirror drift, and stable machine-readable output. Such helpers SHALL NOT score, rank, infer, or optimize instruction or process effectiveness.

Instruction and process behavior changes SHALL use disposable same-model baseline/candidate workflows with the same input and environment, observable quality oracles, and recorded time/rework. A durable behavior instruction change SHALL be retained only when that workflow preserves required quality and demonstrates the accepted benefit or fixes a reproduced defect.

#### Scenario: Exact structural invariant needs enforcement
- **WHEN** a required OpenSpec field or protected-boundary marker can be checked deterministically
- **THEN** a focused validator and fixture MAY enforce its presence and failure output
- **AND** the validator does not claim that the model will behave correctly.

#### Scenario: Prompt effectiveness is under review
- **WHEN** an instruction change claims better spec quality, speed, or token economy
- **THEN** the claim is evaluated through a disposable baseline/candidate workflow
- **AND** no fuzzy TypeScript scoring harness is added.

### Requirement: Portable authority excludes personal runtime facts
Committed reusable global instructions SHALL contain portable behavior and safety authority only. Personal language preferences, availability assumptions, authenticated model inventories, and other machine-local facts SHALL live in a gitignored instruction source loaded through an official schema-supported mechanism.

#### Scenario: Another user installs the kit
- **WHEN** a user other than the current maintainer points OpenCode at the kit global directory
- **THEN** committed instructions do not force the maintainer's name, language, availability, or local model inventory
- **AND** portable routing remains complete.

### Requirement: Always-loaded reductions require workflow evidence
The kit SHALL prefer removing personal facts and exact duplicated detail before relocating safety authority. A reduction to the always-loaded lifecycle, delegation, owner-handoff, or compaction contract SHALL be retained only when its relevant disposable workflow passes every required quality oracle and its instruction or output surface is smaller.

#### Scenario: Faster compact candidate misses one safety oracle
- **WHEN** a compact instruction candidate is faster or shorter but misses any required safety or residual-risk oracle
- **THEN** the broad reduction is rejected
- **AND** only independently proved narrower reductions may proceed.

### Requirement: Reviewer agent contract reference

Each reusable reviewer agent under `global/agents/*.md` SHALL contain a `## Contract Reference` section that names `instructions/leaf-reviewer-agent-contract.md` instead of inlining the full Leaf Contract, Feedback Ledger, or Prevention Feedback block.

#### Scenario: reviewer agent body

- **WHEN** a reviewer agent is inspected
- **THEN** its body SHALL contain `## Contract Reference` followed by a single line naming `instructions/leaf-reviewer-agent-contract.md`
- **AND** it SHALL NOT contain the inline `## Leaf Contract` body that previously appeared in each agent.

#### Scenario: reviewer agent exception

- **WHEN** a reviewer agent describes role-specific output that the shared contract does not cover
- **THEN** the agent MAY include additional sections (e.g. `## Checks`, `## Severity Scale`) below the contract reference
- **AND** those sections SHALL NOT duplicate the shared contract text.

#### Scenario: validator enforces reference form

- **WHEN** `npm run validate` scans `global/agents/*.md`
- **THEN** the orchestrator SHALL fail if a reviewer agent contains the full Leaf Contract, Feedback Ledger, or Prevention Feedback block inline
- **AND** the orchestrator SHALL pass if the agent contains only the `## Contract Reference` section.

### Requirement: Single feedback README source

The repository SHALL have exactly one canonical feedback README at `docs/feedbacks/README.md`. The bootstrap template SHALL copy this file unchanged into the target project. The previously divergent `templates/project/docs/feedbacks/README.md` SHALL NOT exist.

#### Scenario: init-project copies kit README

- **WHEN** `tools/init-project.ts` writes bootstrap files
- **THEN** it SHALL read `docs/feedbacks/README.md` from the kit root
- **AND** write its contents to `<target>/docs/feedbacks/README.md`
- **AND** the written file SHALL be byte-equal to the kit source.

#### Scenario: template directory no longer has README

- **WHEN** the file system is inspected
- **THEN** `templates/project/docs/feedbacks/README.md` SHALL NOT exist
- **AND** `templates/project/docs/feedbacks/` MAY exist only if other feedback-related assets are present.

### Requirement: Repository-level instructions file has a non-runtime name

The repository-level instruction file that defines how to maintain the kit SHALL be named `REPO_AGENTS.md` (or any name other than `AGENTS.md`). The runtime global instructions file `global/AGENTS.md` SHALL continue to ship with the kit and SHALL be the only `AGENTS.md` reachable by OpenCode.

#### Scenario: contributor scans the root

- **WHEN** a contributor opens the repository root
- **THEN** they SHALL find `REPO_AGENTS.md` (or equivalent) describing maintenance rules
- **AND** they SHALL NOT find a root-level `AGENTS.md` that ships to downstream OpenCode instances.

#### Scenario: OpenCode loads only the runtime file

- **WHEN** `OPENCODE_CONFIG_DIR` is set to `global/`
- **THEN** OpenCode SHALL load only `global/AGENTS.md`
- **AND** the root `REPO_AGENTS.md` SHALL be ignored because it is outside the config directory.

### Requirement: Plain and concise user communication
The active global instructions SHALL require every user-facing message to be as short as practical while retaining the information needed to understand the situation or make a decision. They SHALL require plain, concrete wording without assumed specialist knowledge, immediate brief definitions for necessary specialist terms or acronyms, and preservation of material facts, constraints, risks, uncertainty, and exact technical identifiers.

#### Scenario: Necessary specialist term
- **WHEN** a response needs a specialist term that plain wording cannot replace accurately
- **THEN** the response SHALL define the term immediately in one short phrase or sentence
- **AND** it SHALL briefly state why the term matters when that is not obvious

#### Scenario: Accuracy under brevity
- **WHEN** shortening or simplifying a response could remove or distort a material fact, constraint, risk, uncertainty, or exact technical identifier
- **THEN** the response SHALL preserve that information
- **AND** it SHALL prefer short steps or a small example over inaccurate simplification

### Requirement: Decision-ready user questions
The active global instructions SHALL require concise answer options in plain language when options are useful. Every option SHALL state what selecting it does, its main advantage, and its main disadvantage. The recommended option SHALL appear first, be clearly marked, and include the reason for the recommendation.

#### Scenario: Question with multiple options
- **WHEN** the agent asks the user to choose between multiple actions
- **THEN** every option SHALL describe its result, main advantage, and main disadvantage
- **AND** the recommended option SHALL appear first with a clear recommendation marker and reason

### Requirement: Narrow generated OpenSpec workflow-warning exemption
The validator SHALL exempt a skill from the missing happy-path-first risk-driven testing warning only when the file is under `.opencode/skills/openspec-*/SKILL.md` and declares `generatedBy` metadata. The validator SHALL continue to apply every other Markdown and safety check to that file. Non-generated instruction artifacts SHALL retain the existing workflow-warning behavior.

#### Scenario: Generated OpenSpec skill contains implementation wording
- **WHEN** the validator scans an `.opencode/skills/openspec-*/SKILL.md` file with `generatedBy` metadata and implementation wording but no repository-owned risk-driven workflow guidance
- **THEN** it SHALL NOT report the missing happy-path-first risk-driven testing warning for that file
- **AND** it SHALL continue evaluating all unrelated validation rules

#### Scenario: Non-generated implementation guidance
- **WHEN** the validator scans an implementation-capable instruction artifact without generated OpenSpec metadata or path eligibility
- **THEN** the existing missing happy-path-first risk-driven testing warning SHALL remain active

#### Scenario: Body-only, flattened, or blank generated marker
- **WHEN** an eligible OpenSpec skill path contains `generatedBy` only in body text, at the wrong frontmatter level, as a literal top-level `metadata.generatedBy` key, or as a blank nested value
- **THEN** the file SHALL NOT receive the generated workflow-warning exemption
- **AND** implementation wording without risk-driven guidance SHALL retain the existing warning

### Requirement: OpenSpec authoring is sufficient for the next working increment
Loaded OpenSpec authoring guidance SHALL default each change to the next useful working increment rather than exhaustive resolution of the imagined final system. Actionable proposal, design, spec, and task content SHALL resolve decisions only when they can materially change the current increment's outcome, technically enforced operating envelope, non-deferrable invariants, observable proof, material residual risk, or stop line.

Every behavior-changing increment SHALL identify, directly or through an accepted project-native equivalent: `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line`. Implementation readiness SHALL require enough evidence for a capable cold-context implementer to build and prove that increment without guessing a user-owned decision or a decision that changes material risk. It SHALL NOT require future scaling, variants, integrations, compatibility, or edge behavior that cannot be reached inside the current envelope.

Tasks SHALL represent meaningful behavior, evidence, or gate outcomes and MAY group mechanical edits that share one owner and validation result. Requirement-to-test traceability SHALL cover accepted current-increment requirements rather than an imagined final product. Specification review SHALL stop when remaining findings are future-scope, unreachable, optional, or polish-only.

#### Scenario: Broad product idea becomes one working increment
- **WHEN** a requested capability includes future multi-user, scale, compatibility, and operational ambitions but one bounded useful slice can be delivered safely first
- **THEN** OpenSpec SHALL make that slice's outcome and envelope normative
- **AND** SHALL keep the unreachable ambitions as non-goals, context, or later changes rather than current acceptance work.

#### Scenario: Capable implementer can start without exhaustive future design
- **WHEN** the current slice has resolved its outcome, enforced envelope, invariants, proof, material risks, and user-owned decisions
- **THEN** implementation readiness SHALL be `ready` even when future-scope design questions remain
- **AND** those questions SHALL NOT trigger another specification-polish loop.

#### Scenario: Material current-slice decision remains blocking
- **WHEN** an unresolved decision can change current user-visible behavior, safety, data integrity, authorization, irreversible effects, or the enforceability of the operating envelope
- **THEN** implementation SHALL remain blocked on that exact decision
- **AND** the artifact SHALL NOT hide it as future scope merely to start coding.

#### Scenario: Mechanical edits stay grouped
- **WHEN** several instruction mirrors require the same accepted semantic update under one owner and one validation result
- **THEN** `tasks.md` MAY group them into one bounded task
- **AND** SHALL NOT create separate tasks solely for each mechanical file edit.

### Requirement: Loaded authority rejects process-only owner questions

The loaded global authority, Material qualification skill, OpenSpec author/apply/archive surfaces, portable project templates, and completion arbiter SHALL distinguish orchestrator-owned process controls from owner-owned outcome and protected-action decisions. They SHALL explicitly classify plan changes, task and path additions, OpenSpec artifact updates, candidate or revision creation, attempt-limit changes, and process stop-line changes as autonomous when accepted semantics remain unchanged.

Deterministic contracts SHALL require both the positive autonomy marker and the separate protected-action-authority marker on canonical surfaces. The completion arbiter SHALL classify a question asking only whether to modify those process controls as autonomous and SHALL return `continue`, not `owner_required`, while a bounded safe continuation exists.

#### Scenario: Fake choice between spec expansion and stopping is rejected

- **WHEN** a pending question asks the owner to choose between extending an OpenSpec change for a corrected successor attempt and stopping an unfinished accepted goal
- **AND** the successor remains inside accepted semantics and existing action authority
- **THEN** loaded authority treats the question as process-only and continues autonomously
- **AND** the owner is not presented with a choice that has no meaningful product or risk alternative.

#### Scenario: Completion arbiter preserves the exact action boundary

- **WHEN** artifact updates are autonomous but the next underlying action still needs credentials, physical/manual participation, remote/destructive authority, cost, release, or another protected decision
- **THEN** the arbiter permits autonomous preparation
- **AND** returns `owner_required` only for that exact action or decision.

#### Scenario: Historical records remain evidence

- **WHEN** archived changes contain earlier closed-world attempt or scope wording
- **THEN** validators and runtime routing SHALL treat those files as historical evidence rather than active authority
- **AND** this change SHALL NOT rewrite them merely to remove textual contradictions.

### Requirement: Loaded authority owns the simple stage model

`global/AGENTS.md` SHALL contain the complete portable `Development-Stage: development | MVP | RC<n> | stable` authority. `global/skills/change-ready-sdlc/SKILL.md` SHALL contain Material qualification detail. Roles and project-facing mirrors SHALL contain only proportional routing and role-specific deltas.

#### Scenario: Runtime authority has one stage owner
- **WHEN** lifecycle authority is inspected
- **THEN** `global/AGENTS.md` SHALL define the complete stage model
- **AND** the skill, roles, and mirrors SHALL contain only qualification or role-specific deltas.

### Requirement: Validators enforce explicit stage semantics

Deterministic contracts and validators SHALL require the exact Development-Stage field, representative proof before MVP, accepted-scope and validation gates before RC, stable-to-RC linkage, monotonic RC numbering, candidate-mutation invalidation, non-critical non-blocking wording, critical-only SDET stop, optional reviewer wording, and external-operation separation.

They SHALL reject active Change-Status/Done-Done aliases, RC assignment from happy-path proof alone, stable without an RC, mandatory reviewer evidence as a stage gate, non-critical polish as an unconditional blocker, reusable-agent model/variant pins, and any stage that implies external release authority.

#### Scenario: Validator rejects RC on proof alone
- **WHEN** an active artifact assigns RC immediately after happy-path proof without accepted-scope completion and validation
- **THEN** deterministic validation SHALL fail with a stage-semantics diagnostic.

### Requirement: Reusable agents inherit the primary model

Every reusable `global/agents/*.md` role SHALL omit model and variant pins and SHALL report Effective Model provenance when used as lifecycle evidence. A model differing from the portable default SHALL NOT be non-conforming by itself.

#### Scenario: Reusable role inherits model
- **WHEN** a reusable role omits `model` and `variant` and reports its effective model
- **THEN** it SHALL conform regardless of whether that effective model differs from the portable default.

### Requirement: SDET has least-privilege test-only authority

SDET SHALL require runtime approval for edits, remain production-denied, accept an exact test-only write scope, and return blocked when that scope or execution route is unavailable. SDET output SHALL use the critical-only action enum and SHALL NOT approve RC or stable.

#### Scenario: SDET cannot edit production
- **WHEN** an SDET attempt requests a production-path edit or lacks an exact test-only write scope
- **THEN** the attempt SHALL return blocked without modifying production.

### Requirement: Reviewer roles remain optional and non-authorizing

Reviewer roles SHALL remain read-only, return evidence-backed risk matrices or the code-quality reduction matrix, and SHALL NOT return acceptance verdicts, lifecycle blockers, or work-authoring actions. No reviewer launch count or output SHALL be a mandatory RC/stable requirement.

#### Scenario: Reviewer output cannot approve a stage
- **WHEN** an optional reviewer returns a risk matrix
- **THEN** main SHALL own reproduction and disposition
- **AND** the reviewer output SHALL NOT set or block Development-Stage by itself.

### Requirement: Active mirrors use the same terminology

`REPO_AGENTS.md`, reusable project instructions, project templates, Universal Development Loop, README, quality-gate docs, adapter docs, merge-request rendering, and lifecycle role text SHALL use Development-Stage/MVP/RC/stable semantics without retaining active compatibility aliases.

#### Scenario: Project-facing mirror uses current terminology
- **WHEN** a project-facing lifecycle mirror is rendered or validated
- **THEN** it SHALL use Development-Stage/MVP/RC/stable terminology
- **AND** it SHALL NOT expose an active compatibility lifecycle alias.

### Requirement: Historical evidence remains historical

Previously captured Change-Status, Done-Done, reviewer-recovery, and RC-on-proof events MAY remain in implementation evidence when clearly identified as superseded historical behavior. They SHALL NOT satisfy current-stage requirements.

#### Scenario: Historical RC evidence is not current proof
- **WHEN** implementation evidence contains a superseded RC-on-proof event
- **THEN** it MAY remain labeled as historical
- **AND** it SHALL NOT establish the current candidate's Development-Stage.

### Requirement: Architecture and diagnostic quality stay executable

The always-loaded global authority SHALL require responsibility-aware local comprehension, `split-or-justify` without a hard line quota, preservation of the original exception cause/stack, structured safe context at owning failure boundaries, and Runtime Proof capture of exit status, stdout/stderr, relevant logs/exceptions, and artifact paths. Project templates, reusable instructions, the canonical loop, production/testing roles, and relevant planning, architecture, code-quality, and qualification skills SHALL contain only the concise shared rule or their role-specific delta.

Deterministic validation SHALL use exact marker checks as drift tripwires for the global authority and an explicit maintained-mirror list. These checks SHALL NOT claim to prove semantic policy direction; canonical scenarios and semantic review retain that responsibility. Doctor inspection of the resolved active global config SHALL treat missing global architecture or diagnostic quality markers as incomplete runtime authority. The executable contract SHALL live in a focused validator module with its required-text lists under `tools/contracts/`, rather than enlarging an unrelated validator god file.

#### Scenario: Active authority loses diagnostic capture
- **WHEN** the resolved global `AGENTS.md` omits stdout/stderr, exception-chain, or artifact-path proof requirements
- **THEN** doctor and repository validation SHALL report incomplete architecture/diagnostic authority.

#### Scenario: Mirror drops split-or-justify
- **WHEN** an explicitly listed maintained project or role surface drops its required `split-or-justify` marker
- **THEN** deterministic repository validation SHALL fail and name the drifting artifact
- **AND** retaining the marker SHALL NOT replace semantic review of the surrounding policy.

### Requirement: Runtime authority orders quality autonomy and speed
The active global instructions SHALL define one ordered operating priority contract: quality and safety first, autonomy second, and speed third. A lower priority SHALL NOT waive a higher priority.

Quality and safety SHALL require the accepted outcome, protected boundaries, representative real-boundary proof, applicable validation, and honest residual-risk reporting. Autonomy SHALL require end-to-end progress when local evidence or a safe reversible default is sufficient and SHALL limit user questions to material ambiguity, protected decisions, unavailable capability, access, cost, or external action. Speed SHALL optimize time to a verified working result, owner interruptions, tokens and tool calls, repeated manual work, safe parallelism, and deterministic automation.

#### Scenario: Request asks to trade proof for speed
- **WHEN** a task asks the agent to finish faster by skipping representative proof or an applicable critical invariant
- **THEN** the agent SHALL preserve the proof or invariant
- **AND** SHALL seek speed through narrower scope, targeted context, reuse, automation, or safe parallelism instead.

#### Scenario: Safe reversible default exists
- **WHEN** a bounded task has enough local evidence and a safe reversible default
- **THEN** the agent SHALL continue without a routine preference or revision-approval question
- **AND** SHALL report the resulting evidence and any non-critical limitation at handoff.

#### Scenario: Owner-controlled decision is required
- **WHEN** progress requires a protected semantic decision, credential, destructive or remote action, owner-controlled cost, or unavailable external capability
- **THEN** the agent SHALL stop only the affected work
- **AND** SHALL ask one decision-ready owner question after exhausting safe local alternatives.

### Requirement: Priority contract has one complete runtime source
`global/AGENTS.md` SHALL be the only complete runtime source for the ordered priority definitions. The Universal Development Loop SHALL carry a concise conceptual statement, while maintained project, reviewer, skill, and documentation surfaces SHALL use pointers or role-specific deltas and SHALL NOT copy the complete priority block.

#### Scenario: Role artifact needs the priority policy
- **WHEN** a skill, agent, template, or project instruction needs to apply the operating priorities
- **THEN** it SHALL reference the active global authority or state only its role-specific delta
- **AND** SHALL NOT repeat all complete priority labels and definitions.

#### Scenario: Full priority block is copied
- **WHEN** deterministic validation finds the complete canonical priority labels outside `global/AGENTS.md`
- **THEN** validation SHALL fail with the canonical source and offending path
- **AND** the duplicate SHALL be replaced by a pointer or role delta.

### Requirement: Priority drift tripwires inspect operative text
Required priority markers SHALL live in `tools/contracts/skills.ts` and repository routing validation SHALL require them in operative, non-fenced `global/AGENTS.md` text. These checks SHALL be deterministic drift tripwires and SHALL NOT claim to prove semantic behavior.

#### Scenario: Required marker exists only in a fenced example
- **WHEN** a required priority marker is absent from operative text but appears in a supported fenced example
- **THEN** repository validation SHALL fail and name the missing marker
- **AND** the fenced example SHALL NOT satisfy runtime authority.

#### Scenario: Current authority is reviewed semantically
- **WHEN** all deterministic priority markers pass
- **THEN** runtime proof and instruction-artifact review SHALL still evaluate whether speed weakens quality or autonomy
- **AND** static success alone SHALL NOT establish behavioral compliance.

### Requirement: Priority contract does not increase instruction context
This change SHALL not increase the token proxy of `global/AGENTS.md` above 13,279 or the complete current instruction inventory above 84,513. New priority text SHALL be paid for by consolidating superseded automation, token-efficiency, or caution wording rather than deleting unrelated safety authority.

#### Scenario: Canonical priority text is added
- **WHEN** the complete priority contract is introduced
- **THEN** before/after instruction inventory SHALL show no growth at either required boundary
- **AND** semantic review SHALL confirm that removed text is superseded rather than an unrelated safety deletion.

### Requirement: Continuous improvement serves the operating priorities
Continuous learning, workflow feedback, and deterministic automation SHALL remain mechanisms serving quality, autonomy, and speed rather than a mandatory fourth stage or peer priority. A candidate that fails the improvement admission gate SHALL NOT delay the accepted outcome. A candidate that passes that gate during an active OpenSpec change becomes accepted completion scope through its evidence-rich task and SHALL be implemented before normal completion unless an exact protected-boundary or target-ownership blocker requires owner resolution.

#### Scenario: Repeated manual step is locally replaceable
- **WHEN** a small deterministic helper is necessary for the accepted outcome or directly replaces repeated in-scope manual work and passes the admission gate
- **THEN** the agent SHALL add and implement the corresponding session-derived task within the smallest sufficient dependency closure
- **AND** SHALL verify its explicit inputs, outputs, stable ordering, and failure behavior before checking the task.

#### Scenario: Broader reusable improvement is outside scope
- **WHEN** an improvement is useful but fails the no-scope-expansion or target-ownership admission condition
- **THEN** it SHALL NOT silently expand the product candidate or disappear as advisory prose
- **AND** its task record SHALL name the exact owner disposition needed before normal completion or an explicit change to accepted scope.

### Requirement: Repository maintainer authority requires portable workflow tooling

`REPO_AGENTS.md` SHALL require every workflow tool shipped into project context to use a project-neutral core with explicit root/config/argv inputs and a thin project adapter for technology-specific behavior. It SHALL prohibit hardcoded maintainer paths, repository identity, package manager, shell, service, and validation commands in reusable cores.

The authority SHALL require representative proof in an unrelated disposable project before a new or materially changed workflow tool is called reusable.

#### Scenario: Maintainer adds a project-specific helper

- **WHEN** a helper directly embeds one project's package command in reusable core logic
- **THEN** repository validation rejects the portability contract
- **AND** the command moves into a project adapter while the core remains reusable.

#### Scenario: Kit-schema validator is maintained

- **WHEN** a repository-maintenance validator explicitly targets the documented kit artifact schema and is not distributed as a generic project tool
- **THEN** it MAY retain kit-schema-specific contracts
- **AND** documentation SHALL not claim that validator is application-project-neutral.

### Requirement: Compaction switches stalled strategies and preserves strategy history

The active global instructions and compaction prompt SHALL identify stagnation when at least two materially similar cheap or local attempts since the last observable progress produce no new accepted artifact, decision-changing evidence, resolved blocker outside the same still-failing chain, or downstream boundary advancement. A new exception, log, failing line, or later failure in the same runner/evaluator chain SHALL be treated as diagnosis rather than outcome progress and SHALL NOT reset stagnation. On stagnation the agent SHALL select a different causal mechanism rather than retrying with only changed flags, wording, timeout, repetition count, or the first failing line.

One evidence-only failure after an external, physical, costly, destructive, or long-running attempt SHALL block another live attempt through the same proof path. The gate SHALL remain blocked until the candidate post-run/evaluator chain replays the preserved corpus without live effects through its terminal verdict and every downstream stage reachable for the actual run mode, including non-side-effecting finalization checks, or until the exact missing raw observation is identified. Fixing or testing only the first failing line, helper, or parser SHALL NOT clear the gate. If the missing observation can only be acquired live, the next attempt SHALL be classified in advance as bounded evidence capture rather than proof.

Every compaction summary SHALL emit `Live-Attempt Gate: clear | blocked | unknown`. A blocked or unknown gate SHALL also preserve the failure chain, raw bundles, offline replay coverage, terminal replay result, and unlock condition. Missing evidence SHALL produce `unknown`, not an inferred clear state, and SHALL block another high-cost live attempt. For a blocked or unknown gate, `Next Strategy` and `Next-Session Action` SHALL identify the same first gate-closing offline step; an improvement-matrix item SHALL NOT preempt it.

For an active OpenSpec change, each materially distinct attempted strategy SHALL be recorded in `openspec/changes/<change>/history.md` with objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. A later session SHALL read that history before substantial work and SHALL NOT repeat a recorded strategy unless new evidence satisfies its retry condition or invalidates the previous result.

If compaction cannot write files, its summary SHALL emit structured pending history entries and exactly one distinct next strategy. The next session SHALL persist those entries before substantial work.

#### Scenario: Similar retries make no progress

- **WHEN** two cheap or local attempts use the same causal mechanism and neither advances an accepted artifact, decision-changing evidence, a blocker outside the same failure chain, or a downstream boundary
- **THEN** the next attempt uses a materially different mechanism
- **AND** the attempted mechanism is recorded in the active change `history.md`.

#### Scenario: Costly run reaches a later evaluator failure

- **WHEN** a costly live run produces trustworthy product observations but post-run evaluation fails
- **AND** a first-line fix exposes another failure later in the same evaluator chain
- **THEN** the later failure does not count as outcome progress
- **AND** another costly live run remains blocked until preserved-corpus replay reaches the terminal verdict for the actual run mode.

#### Scenario: Offline replay cannot establish the gate state

- **WHEN** compaction lacks evidence that the complete post-run/evaluator chain reached its terminal result over the preserved corpus
- **THEN** it emits `Live-Attempt Gate: unknown` with the missing coverage and unlock condition
- **AND** `Next Strategy` and `Next-Session Action` select the same first offline gate-closing step instead of another high-cost live attempt.

#### Scenario: New evidence makes an old strategy viable

- **WHEN** later evidence satisfies a recorded retry condition or disproves the prior failure cause
- **THEN** the agent MAY retry the recorded strategy
- **AND** the new evidence and reason for retry are appended to `history.md` before execution.

#### Scenario: Automatic compaction cannot mutate files

- **WHEN** compaction detects stagnation but has no file-write capability
- **THEN** the summary includes a structured pending history entry and a different next strategy
- **AND** the next session persists the entry before continuing implementation.

### Requirement: Maintained planning surfaces preserve shift-left cadence

The canonical Universal Development Loop, reusable project instructions, project template, repository maintainer instructions, qualification skill, roadmap/planning skills, OpenSpec project context, evidence guidance, and quality-gate documentation SHALL route behavior slices toward the earliest safely reachable real boundary. Planning surfaces SHALL require a current fidelity rung, next real boundary, exact blocker and unblocking task when deferred, and a dependency-chain stop rule.

The complete policy SHALL remain in always-loaded `global/AGENTS.md`; other surfaces SHALL contain only concise shared markers or role-specific deltas.

#### Scenario: OpenSpec tasks are generated for a real-backed feature

- **WHEN** a proposal or task graph includes behavior that models, integrates with, or substitutes a real system
- **THEN** its first dependency-valid tasks minimize time-to-first-real-signal
- **AND** later dependent behavior does not precede an already reachable safe characterization task.

### Requirement: Shift-left markers are deterministic drift tripwires

The repository validator SHALL require exact shift-left markers in the canonical runtime authority and explicitly maintained mirror list. The validator SHALL report the missing marker and artifact, SHALL inspect operative text rather than fenced examples, and SHALL NOT claim that marker presence proves semantic model behavior.

#### Scenario: Project template drops the real-boundary cadence

- **WHEN** a maintained project template omits the earliest-safe-real-boundary marker
- **THEN** repository validation fails and names that template
- **AND** same-model workflow evaluation remains required for semantic adherence.

### Requirement: Behavior evaluation preserves safety and demonstrates cadence

The shift-left instruction change SHALL use a bounded same-model baseline/candidate workflow with identical prompt, model, variant, workspace, and active config. Candidate retention SHALL require preservation of baseline authorization, physical-safety, restoration, cleanup, equivalence, and dependency-stop behavior plus explicit fidelity-ladder and deferred-boundary-unblocker evidence.

#### Scenario: Candidate says test early but bypasses authorization

- **WHEN** candidate output moves a real test earlier but omits separate authorization or applicable safety and restoration gates
- **THEN** the candidate fails behavior evaluation
- **AND** the durable instruction change is not qualified.

### Requirement: Completion arbiter is a hidden machine adjudicator
The `session-completion-arbiter` SHALL be a hidden read-only subagent invoked only by the completion guard. It SHALL return the versioned completion verdict contract and SHALL not be governed as an optional reviewer, manually dispatched as a lifecycle gate, or permitted to edit, test, dispatch agents, ask the user, or approve Development-Stage.

#### Scenario: Arbiter agent is inspected
- **WHEN** repository validation reads the arbiter frontmatter and body
- **THEN** it SHALL require the guard-supplied bounded session-delivery evidence, deny all tool/mutation/orchestration/user-question capabilities, omit model pins, and define only completion-adjudication authority
- **AND** it SHALL not reference the optional leaf-reviewer output contract as its verdict authority.

### Requirement: Automatic guard replaces active delivery-reviewer routing
Loaded global authority, reusable project instructions, templates, README catalogs, agent inventories, profiles, validators, and current tests SHALL describe the automatic completion guard instead of instructing main to dispatch `session-delivery-reviewer`. The old active agent file SHALL be removed only after current guard proof.

#### Scenario: Active instruction inventory after migration
- **WHEN** instruction and agent inventories run on the migrated candidate
- **THEN** they SHALL find `session-completion-arbiter` and automatic guard routing in the maintained active surfaces
- **AND** they SHALL find no active `session-delivery-reviewer` agent, config key, profile key, validator binding, or invocation instruction.

### Requirement: Historical delivery-reviewer evidence remains attributable
Archived OpenSpec artifacts, implementation evidence, and feedback ledgers MAY retain `session-delivery-reviewer` references when they describe work that agent actually performed. Such references SHALL be treated as superseded historical evidence and SHALL not re-register or route the retired agent.

#### Scenario: Historical archive contains retired name
- **WHEN** validation encounters the retired name under archived change evidence or feedback history
- **THEN** it SHALL preserve the historical attribution
- **AND** it SHALL exclude that occurrence from active-agent and active-routing drift failures.

### Requirement: Main honors guard continuation without self-approval
Loaded main-session authority SHALL require a current completion-guard continuation to be processed as synthetic control evidence, while preserving main ownership of implementation, proof, specialist dispatch, and exact owner handoff. Main SHALL not mark guard todos complete, rewrite the root goal, or treat a prior Passed audit as approval of a changed revision.

#### Scenario: Guard resumes incomplete root
- **WHEN** main receives a current synthetic continuation with unresolved requirement refs
- **THEN** main SHALL continue the bounded work or invoke the required troubleshooter route
- **AND** a production mutation or new human requirement SHALL require a new completion audit.

### Requirement: Scoped deduplication artifacts preserve lazy routing
The global kit SHALL provide one `deduplication-audit` skill and one `/dedup` command with valid loader metadata, an explicit scoped trigger, and a read-only output contract. The workflow SHALL stay unloaded for unrelated trivial fixes and SHALL not duplicate the exhaustive `codebase-audit-loop` contract.

#### Scenario: Global loader discovers the new artifacts
- **WHEN** OpenCode starts with `OPENCODE_CONFIG_DIR` pointing at the kit `global/` source
- **THEN** its skill inventory SHALL include `deduplication-audit`
- **AND** its command inventory SHALL include `/dedup` after restart.

#### Scenario: Command carries the whole scope argument
- **WHEN** the user invokes `/dedup src one`
- **THEN** the command SHALL pass the complete argument text as scope intent to the lazy skill
- **AND** it SHALL not reinterpret the command as an exhaustive audit request.

### Requirement: Deduplication structural checks do not claim behavioral proof
Deterministic contract tests SHALL verify skill metadata, command routing, candidate classifications, recommendation/output fields, reviewer reuse, forbidden agent/upstream-skill artifacts, and trivial-fix opt-out wording. They SHALL NOT claim that those markers prove semantic classification or runtime behavior.

#### Scenario: Required safety marker is removed
- **WHEN** the skill omits the rule that clone output is not semantic-equivalence proof or the command permits automatic production editing
- **THEN** focused contract validation SHALL fail and name the affected artifact
- **AND** the failure SHALL remain structural evidence only.

### Requirement: Same-model evaluation covers deduplication decisions
The instruction change SHALL be evaluated with bounded same-model baseline/candidate workflows using identical model, input, workspace shape, and tool envelope for local existing owner, exact clone, near clone with different semantics, unique compatibility test, no-match helper, and trivial fix scenarios. Candidate retention SHALL require the expected scoped decision and absence of unauthorized source mutation.

#### Scenario: Candidate merges semantic near clones
- **WHEN** the candidate recommends merging the near-clone scenario solely because the text is similar
- **THEN** behavior evaluation SHALL fail that scenario
- **AND** the instruction candidate SHALL not qualify until corrected and re-proved.

#### Scenario: Candidate adds trivial-fix ceremony
- **WHEN** the candidate loads the skill, invokes `jscpd`, or dispatches a reviewer for the unrelated trivial-fix scenario
- **THEN** behavior evaluation SHALL fail the proportionality oracle
- **AND** the workflow SHALL remain at `development` or `MVP` rather than RC.

