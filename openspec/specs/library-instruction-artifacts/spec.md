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

An improvement candidate SHALL be considered only when it is local, reversible, low-cost, causally linked to an observed loss or opportunity, and does not expand accepted outcome. Every evidence-backed candidate SHALL identify `Impact Horizon`, `Concrete Consumers`, `Execution Class`, `Earliest Safe Point`, `Invalidated Evidence`, and `Observable Payback`; the summary SHALL NOT invent timing, recurrence, savings, consumers, or root cause.

A candidate SHALL be admitted into the active change only when it has an exact remaining current-change consumer and directly accelerates or protects the accepted outcome. `Impact Horizon: Working Repository` SHALL additionally require at least one other exact repository consumer from source or active artifacts, reuse or extension of an existing shared owner, and current-change proof of that shared behavior. Other consumers SHALL NOT be silently implemented by the current change.

When an identifiable writable active OpenSpec change owns an admitted improvement, the main session SHALL immediately append an unchecked item under `## Session-Derived Improvements` in that change's `tasks.md`. The item SHALL state `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, the six classification fields, plus `Owner Blocker` only when applicable. It SHALL remain unchecked until implementation and its stated proof and validation are complete.

An evidence-backed candidate with no exact remaining current-change consumer SHALL be deferred rather than admitted. Automatic compaction SHALL emit it under `Deferred Improvement Candidates`; the next session SHALL persist it as a non-checkbox record in the active change `history.md` with its evidence, target, why it was not admitted, and exact re-evaluation condition. A deferred record SHALL NOT become accepted scope or block RC, stable, or complete archive.

Automatic compaction SHALL emit every not-yet-persisted admitted candidate under `Pending Improvement Tasks` because compaction cannot call tools. The next session SHALL reconcile all admitted and deferred entries against `Original User Goal`, persist every still-valid entry before substantial work, and SHALL NOT silently select one candidate and discard the remainder.

An improvement targeting another repository or crossing a protected boundary SHALL NOT be silently implemented in the active change. If it is required by the current accepted outcome, the entry SHALL identify the exact target or `Owner Blocker` and the affected chain SHALL wait for an authorized scoped implementation path. If it has no current consumer, it SHALL remain a non-blocking deferred record rather than blocking normal completion.

#### Scenario: Current-path improvement executes before its consumer
- **WHEN** observed evidence supports an improvement consumed by remaining current-change tasks
- **THEN** the admitted task identifies those exact consumers and the earliest safe execution point
- **AND** its execution class places it before the first consumer rather than merely at the physical end of `tasks.md`.

#### Scenario: Repository multiplier has concrete reuse
- **WHEN** an existing shared owner can serve one remaining current-change task and at least one additional exact repository consumer
- **THEN** the candidate uses `Impact Horizon: Working Repository`, names every evidenced consumer, and is admitted for current-change implementation and proof
- **AND** the current change does not silently implement the additional consumers.

#### Scenario: Evidence-backed future work has no current consumer
- **WHEN** a local reversible candidate has observed evidence but no exact remaining current-change consumer
- **THEN** compaction emits a non-blocking deferred record with `Execution Class: separate-change` and a re-evaluation condition
- **AND** it does not append an unchecked current-change task or block completion.

#### Scenario: Session provides no evidence for a cell
- **WHEN** the session contains no observation supporting an improvement in one target and direction
- **THEN** that cell reports `none`
- **AND** it does not manufacture a generic best practice, consumer, or task.

#### Scenario: Compaction cannot write active files
- **WHEN** automatic compaction classifies admitted and deferred improvements but cannot call file tools
- **THEN** it emits complete admitted records under `Pending Improvement Tasks` and complete deferred records under `Deferred Improvement Candidates`
- **AND** the next active session persists each record in its correct owning artifact before substantial work.

#### Scenario: Kit improvement does not belong to the working change
- **WHEN** an `opencode-kit` candidate is observed while an unrelated project change is active
- **THEN** the agent does not mutate kit files or pretend the project change owns that implementation
- **AND** it blocks only a current dependency chain that requires the kit correction, otherwise preserving the candidate as non-blocking deferred evidence.

### Requirement: New OpenSpec changes schedule one final history retrospective

The loaded global authority and maintained OpenSpec propose skill and command SHALL require every newly authored change `tasks.md` to contain exactly one unchecked final-history analysis task as its initially last task. The task SHALL be created once during proposal authoring and SHALL NOT be added by apply, archive, compaction, or its own execution.

The task SHALL require the existing compaction improvement analysis: the matrix rows are `Quality`, `Cycle Speed`, and `Token Economy`; the columns are `Working Repository` and `opencode-kit`; each cell contains evidence, the smallest cheap improvement, expected benefit, and cost/risk, or `none`; candidate classification, admission, deferral, and persistence use the existing canonical rules. The evidence input SHALL be the complete change `history.md` rather than the current session.

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

When the final-history analysis task becomes eligible, the loaded apply workflow SHALL analyze the complete `history.md` using the same canonical matrix, classification, admission/deferral gate, target ownership, authority rules, and record fields used by compaction. The accepted change outcome SHALL remain the original-goal anchor, while the journal SHALL be the evidence source.

Every admitted current-consumer candidate SHALL be appended as an unchecked `Session-Derived Improvements` task with the canonical fields and apply SHALL immediately continue through those generated tasks. Every evidence-backed no-current-consumer candidate SHALL be preserved as a non-checkbox deferred history record. If no admitted or deferred candidate passes, the analysis SHALL record `none` and SHALL NOT manufacture work.

#### Scenario: Journal evidence admits improvements

- **WHEN** the complete `history.md` supplies one or more candidates that pass the existing compaction admission gate
- **THEN** apply persists every admitted candidate in the canonical task format and every deferred candidate in the canonical history format
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

The loaded global authority, Material qualification skill, OpenSpec author/apply/archive surfaces, portable project templates, and completion arbiter SHALL distinguish orchestrator-owned process controls from owner-owned outcome and protected-action decisions. They SHALL explicitly classify plan changes, task and path additions, OpenSpec artifact updates, candidate or revision creation, attempt-limit changes, process stop-line changes, task ordering, task-range batching, implementation/reviewer choice, and current-cycle size as autonomous when accepted semantics remain unchanged.

For one already selected active OpenSpec change, pending ordinary tasks and admitted improvement tasks SHALL be treated as accepted implementation work unless the user explicitly bounded the current request to a smaller task set. The main session SHALL choose the smallest dependency-valid next slice that reaches the earliest safe real boundary, using declared dependencies and safety/proof gates before file order, and SHALL continue after current proof and validation instead of asking the owner to select a task range or optional review detour.

Deterministic contracts SHALL require both the positive autonomy marker and the separate protected-action-authority marker on canonical surfaces. The completion arbiter SHALL classify a question asking only whether to modify those process controls or which in-scope task batch to execute as autonomous and SHALL return `continue`, not `owner_required`, while a bounded safe continuation exists.

#### Scenario: Fake choice between spec expansion and stopping is rejected

- **WHEN** a pending question asks the owner to choose between extending an OpenSpec change for a corrected successor attempt and stopping an unfinished accepted goal
- **AND** the successor remains inside accepted semantics and existing action authority
- **THEN** loaded authority treats the question as process-only and continues autonomously
- **AND** the owner is not presented with a choice that has no meaningful product or risk alternative.

#### Scenario: Task-range menu is rejected

- **WHEN** an apply session has multiple pending in-scope task ranges and an optional read-only review path
- **AND** the user did not bound the current request more narrowly and no next-slice action crosses an owner boundary
- **THEN** main selects the smallest dependency-valid slice that reaches the earliest safe real boundary
- **AND** it does not ask the owner to choose the batch, review detour, or amount of work for the current cycle.

#### Scenario: Completion arbiter preserves the exact action boundary

- **WHEN** artifact updates and task sequencing are autonomous but the next underlying action still needs credentials, physical/manual participation, remote/destructive authority, cost, release, or another protected decision
- **THEN** the arbiter permits autonomous preparation
- **AND** returns `owner_required` only for that exact action or decision.

#### Scenario: Explicit user task limit is preserved

- **WHEN** the user explicitly asks to stop after a named task or bounded task range
- **THEN** that current-request limit controls execution
- **AND** the autonomy rule does not silently continue into later tasks.

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

SDET SHALL receive scalar tool-level edit authorization without a runtime approval
prompt, remain contractually prohibited from production edits, accept an exact
test-only write scope, and return blocked when that scope or execution route is
unavailable. SDET output SHALL use the critical-only action enum and SHALL NOT
approve RC or stable. Its other explicit denied permissions SHALL remain denied.

#### Scenario: Authorized test edit is unattended

- **WHEN** a fresh SDET attempt receives current Runtime Proof and an exact local
  test-only write scope
- **THEN** its effective `edit` permission SHALL resolve to `allow`
- **AND** it SHALL be able to write within that scope without an operator permission
  reply.

#### Scenario: SDET cannot edit production

- **WHEN** an SDET attempt requests a production-path edit or lacks an exact
  test-only write scope
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

### Requirement: Repeated-use repository CLIs SHALL be self-discoverable

The loaded portable instruction contract SHALL require every repository-owned CLI
introduced or materially extended for repeated operator, agent, or proof use to
support `--help` and `-h` before ordinary command, required-value, output-root, or
side-effect validation. Both help forms SHALL perform no product, evidence,
network, credential, process-owner, or other declared operational effect; SHALL
print the available commands or modes plus required and optional arguments; and
SHALL exit `0` through the actual installed or loaded entry point before project
documentation recommends them.

The contract SHALL allow one conventional help probe when discovering an existing
CLI. When help is unsupported or returned as a usage failure, the caller SHALL
inspect the project-native inventory, source, or schema and SHALL NOT guess flags
or retry help variants. Unsupported help SHALL be classified as a product defect
only when the accepted product contract promised help.

True one-shot scripts and third-party or historical CLIs that are not being
introduced or materially extended SHALL NOT acquire a retrofit obligation solely
from this requirement.

#### Scenario: Agent authors a repeated-use proof CLI

- **WHEN** an implementation-capable agent introduces a repository-owned CLI that
  later operators or agents will invoke repeatedly
- **THEN** the installed `--help` and `-h` paths exit `0`, enumerate commands and
  arguments, and create no declared output or operational effect
- **AND** the maintained inventory documents only that proven interface.

#### Scenario: Existing CLI rejects help

- **WHEN** one bounded `--help` probe returns unknown-command, positional-argument,
  unsupported-command, or usage-failure output
- **THEN** the agent stops probing and discovers the invocation from maintained
  inventory, source, or schema without inventing flags
- **AND** it does not call the CLI broken unless its accepted contract promised
  successful help.

#### Scenario: Tiny one-shot script has no repeated consumer

- **WHEN** a scenario-local script is not intended for repeated operator, agent,
  proof, or maintained project use
- **THEN** the instruction contract does not require a help interface solely for
  that script
- **AND** all existing safety, effect, and cleanup rules still apply.

### Requirement: Mechanical structured artifacts SHALL be materialized deterministically

Before an agent authors or materially changes a durable structured artifact, the
loaded contract SHALL require it to identify whether the artifact contains hashes,
byte lengths, counts, indexes, or ordering mechanically derived from named inputs;
mirrored rows or identifiers that must remain synchronized; or more than one
variant generated from the same closed shape. When any such trigger is present,
the authoritative artifact SHALL be materialized or validated by the smallest
repository-owned deterministic helper from a compact reviewable semantic seed.

The helper SHALL have explicit inputs and outputs, stable ordinal ordering,
privacy-safe cause-preserving diagnostics, closed failure behavior, output
readback/schema validation, and a deterministic regeneration or drift check. It
MUST NOT infer semantic values, requirements, policy, risk, priority,
classification, or correctness. The reviewed seed SHALL remain the owner of every
semantic choice.

A small one-off semantic record with no mechanical trigger MAY remain manually
authored. File length alone SHALL NOT force a generator, and intentionally
generated raw evidence SHALL NOT be prohibited by this requirement.

#### Scenario: Durable plan contains derived identities and variants

- **WHEN** an authoritative plan contains source hashes and byte lengths, requires
  ordinal identifier ordering, and produces multiple guard variants
- **THEN** the agent creates or extends a deterministic materializer/validator and
  keeps semantic values in a compact reviewable seed
- **AND** regeneration produces stable validated output without model-authored
  copies of the complete plan.

#### Scenario: Generator cannot derive a semantic decision

- **WHEN** a required field represents policy, classification, risk, or another
  judgment not derivable from explicit input facts
- **THEN** the helper reports that input as unsupported or blocked instead of
  selecting a value
- **AND** the semantic decision remains in the agent or owner layer.

#### Scenario: Small one-off JSON is fully semantic

- **WHEN** one bounded record has no derived identity, synchronized mirror, or
  variant-family trigger and is clearer as direct data
- **THEN** the agent may author and validate it without adding a generator
- **AND** the absence of helper code is not treated as a quality failure.

### Requirement: Tooling ergonomics instruction changes SHALL prove behavior without fuzzy scoring

The kit SHALL retain a tooling-ergonomics instruction change only after bounded
disposable same-model baseline and candidate workflows use identical non-sensitive
prompts, model/profile, tool permissions, and environment and preserve candidate,
runner, evaluator, and cleanup identities. The workflow SHALL cover repeated-use
CLI help and mechanical structured-artifact materialization, with maintained source
placement and small-one-off proportionality as no-regression controls.

The evaluator SHALL derive exact facts from produced files, command invocations,
exit status, stdout/stderr, hashes, locations, and cleanup. It MUST NOT score prose,
infer intent, rank quality, or use a model to evaluate the model output. Baseline
evidence SHALL reproduce the decision gap for every claimed improvement; candidate
evidence SHALL demonstrate the specified behavior without losing safety, role, or
no-overengineering oracles. Structural marker validation alone SHALL NOT establish
behavior improvement.

When baseline already satisfies a proposed behavior, the evaluator SHALL record it
as a control, the candidate SHALL preserve it, and the change MUST NOT add policy
for that behavior from plausibility alone.

#### Scenario: Candidate creates a self-documenting CLI

- **WHEN** baseline and candidate receive the same repeated-use CLI authoring
  scenario through the installed OpenCode boundary
- **THEN** the evaluator executes the produced help paths and records exact exit,
  usage, effect, source-placement, and cleanup facts
- **AND** only a candidate with exit-zero effect-free complete help satisfies that
  scenario.

#### Scenario: Candidate materializes variants from a semantic seed

- **WHEN** baseline and candidate receive the same hash/order/variant-heavy
  structured-artifact scenario
- **THEN** the evaluator reruns the produced materializer/validator and compares
  stable output identities and schema facts
- **AND** handwritten duplicated complete variants do not satisfy the candidate
  oracle.

#### Scenario: Baseline does not reproduce a claimed decision gap

- **WHEN** the frozen baseline already satisfies one proposed behavioral oracle or
  the raw output cannot distinguish the decision
- **THEN** that instruction claim remains unproved and is revised, discarded, or
  reported blocked
- **AND** the change is not retained from structural plausibility alone.

#### Scenario: Maintained-source behavior is already effective

- **WHEN** baseline keeps repeated generator source outside ignored output, invokes
  it, creates exact disposable cases, and leaves the tiny semantic record manual
- **THEN** source placement and proportionality are recorded as controls rather
  than claimed instruction improvements
- **AND** the candidate must preserve those exact controls.

#### Scenario: Instruction context remains bounded

- **WHEN** the canonical clauses and role deltas are added
- **THEN** deterministic inventory confirms the candidate does not increase either
  frozen baseline token proxy
- **AND** any inherited normative-ceiling breach is reported rather than repaired
  by deleting unrelated safety authority.

### Requirement: Reuse discovery has one compact loaded owner and one lazy detail owner

`global/AGENTS.md` SHALL be the canonical loaded owner for the proportional new-mechanism trigger and compact `reuse | extend | build-minimal` disposition requirement. One `reuse-discovery` skill SHALL own search order, explicit cross-project scope, source verification, degraded behavior, total-cost selection, and output fields. Other maintained instruction artifacts SHALL use pointers or role-specific deltas rather than copying the complete workflow.

#### Scenario: Triggered work loads detail once

- **WHEN** a fresh OpenCode session proposes a new mechanism
- **THEN** loaded authority routes it to the reuse-discovery skill before production code
- **AND** no second skill or command owns a competing search protocol.

#### Scenario: Trivial work keeps the skill unloaded

- **WHEN** a fresh OpenCode session receives a trivial owner-local correction with no reuse trigger
- **THEN** it uses targeted local evidence without loading reuse-discovery detail
- **AND** performs no cross-project discovery call.

### Requirement: Portable reuse instructions do not own private registry or inventory behavior

The active global command catalog, skill catalog, package scripts, profiles, documentation, and proof inventory SHALL NOT expose `/reuse-inventory`, a private reuse-registry client, generated project inventory, cache, outbox, capability promotion, or registry synchronization as current behavior. Machine-local tool names, project groups, paths, and refresh procedures SHALL remain in schema-supported machine-local instructions and SHALL NOT enter committed portable authority.

#### Scenario: Fresh loader inventory after simplification

- **WHEN** a fresh OpenCode process loads the retained global source
- **THEN** its skill inventory includes `reuse-discovery`
- **AND** its command inventory does not include `/reuse-inventory`.

#### Scenario: Machine-local layer selects a cross-project source

- **WHEN** a machine-local instruction source requires a specific cross-project provider for an explicit project family
- **THEN** the portable skill follows that stricter configured cross-project gate
- **AND** committed global artifacts do not copy the provider name, machine path, private project names, or refresh command.

### Requirement: Loaded reuse behavior is proved with matched triggered and trivial scenarios

The instruction change SHALL use fresh OpenCode processes with the same configured model/profile and a bounded no-product-mutation environment for one triggered new-mechanism scenario and one trivial-fix scenario. Retention SHALL require the triggered scenario to load reuse detail, search proportionally, inspect current-repository candidates, explicitly report an unavailable cross-project layer as `degraded`, avoid registry calls, and record the compact disposition, while the trivial scenario loads no reuse detail and makes no cross-project call.

#### Scenario: Triggered and trivial behavior remain distinct

- **WHEN** candidate evaluation compares the matched fresh scenarios
- **THEN** only the triggered scenario performs reuse-discovery work
- **AND** both scenarios preserve safety, cleanup, and honest evidence.

### Requirement: Instruction inventory SHALL expose explicit source scopes

The instruction inventory SHALL preserve the current repository catalog as the
default `catalog` source scope and SHALL expose a separate `loader-visible` source
scope for one explicitly selected project. It SHALL report startup-visible
instruction candidates, discovery metadata, and on-demand artifact bodies as
separate categories and SHALL NOT combine them into one claimed prompt size.

#### Scenario: Existing catalog inventory remains stable
- **WHEN** the inventory runs without an explicit source scope
- **THEN** it reports the kit catalog using the existing classification and does not reinterpret all skill bodies as startup-loaded prompt text

#### Scenario: Consumer runtime categories remain separate
- **WHEN** loader-visible inventory finds project instructions and global and project skill catalogs
- **THEN** it reports instruction candidates, skill-description metadata, and skill bodies in separate totals

### Requirement: Loader-visible inventory SHALL preserve privacy and uncertainty

Loader-visible inventory SHALL emit aggregate counts, token proxies, evidence
classes, and redacted source identities only. It SHALL NOT emit instruction text,
repeated-line samples, config values outside supported instruction paths, provider
options, credentials, or secret-bearing content. Unsupported, unreadable, remote,
dynamic, or precedence-ambiguous sources SHALL be reported as `unknown` rather
than silently omitted or treated as loaded.

#### Scenario: External local instruction is counted without disclosure
- **WHEN** project config declares a readable local instruction file outside the project root
- **THEN** the report includes its aggregate size and redacted identity without any content-derived excerpt

#### Scenario: Unsupported instruction source remains visible
- **WHEN** a configured instruction source cannot be safely resolved as a supported local file
- **THEN** the report records one cause-preserving unknown row and does not infer its size or loaded state

### Requirement: Instruction budgets SHALL have one enforceable seed owner

The repository SHALL maintain one versioned checked-in budget seed containing only
reviewed maximum token proxies for the kit catalog and committed global startup
authority. Measured counts, hashes, lengths, ordering, and drift SHALL be derived
from source. Strict validation SHALL fail when a measured boundary exceeds its
reviewed maximum or when the seed is malformed. Historical lower targets SHALL
remain documented as reduction debt until separately achieved or superseded.

#### Scenario: Instruction growth exceeds the reviewed maximum
- **WHEN** a catalog or committed global-authority token proxy is greater than its checked-in maximum
- **THEN** strict validation fails with the boundary name, maximum, actual value, and deterministic regeneration command

#### Scenario: Derived values are not duplicated into the seed
- **WHEN** the budget seed is reviewed
- **THEN** it contains no current hash, measured total, source ordering, or generated drift field

#### Scenario: Consumer has no project-owned budget
- **WHEN** loader-visible inventory runs for a project without a compatible budget seed
- **THEN** it reports measurements without imposing the kit's catalog maximum on that project

### Requirement: Main performs bounded recovery before blocker escalation
The active global instructions SHALL require main, immediately before its first user question for a blocker, to preserve the original accepted outcome and operating envelope and distinguish an outcome-required protected action from a protected prerequisite introduced only by the current task, OpenSpec artifact, proof path, or fidelity rung. Owner-only status SHALL require an exact protected action that is necessary for the still-current original accepted outcome, evidence that no unused safe goal-preserving real route can advance that outcome, and a self-contained explanation of why only the owner can act.

A protected action required only by an agent-chosen path SHALL NOT establish owner-only status. Main SHALL keep that path and its Live-Attempt Gate blocked, SHALL NOT assign, bypass, simulate, or authorize the protected state, and SHALL autonomously reconcile conflicting proposal, design, specification, and task controls before executing an available safe real route with a claim no broader than the accepted effect it observes. Pending tasks SHALL remain required work only while they are consistent with the current user-bounded outcome and SHALL NOT become owner scope by their existence.

When owner-only status is not proven, main SHALL execute an unused safe local mechanism that is causally distinct from the failed strategy when one remains. If no such mechanism remains and the blocker is technical or uncertain, main SHALL invoke at most one diagnosis-only `troubleshooter` consultation for the current failure chain before asking the user. Main SHALL verify the report and execute any authorized goal-preserving recovery itself, and SHALL NOT ask the user when that recovery advances the original accepted outcome.

An equivalent consultation for the same failure chain SHALL require new decision-changing evidence or a distinct causal mechanism. An unavailable or unusable `troubleshooter` SHALL cause main to perform the same bounded classification and unused-mechanism pass itself, record the capability gap, and SHALL NOT become a Development-Stage, RC, or stable blocker by itself.

#### Scenario: A safe distinct local route remains
- **WHEN** a blocker occurs and evidence identifies an unused safe local mechanism that preserves the accepted outcome and differs causally from the failed strategy
- **THEN** main executes that mechanism instead of asking the user or invoking `troubleshooter`
- **AND** main continues the original accepted outcome when the mechanism advances it.

#### Scenario: A protected prerequisite belongs only to a stale proof path
- **WHEN** the current task or proof path requires a protected action, the original accepted outcome and non-goals do not require that action, and an unused safe real route can observe the accepted effect
- **THEN** main records the current path and its Live-Attempt Gate as blocked, reconciles conflicting agent-authored artifacts, and executes the safe real route without an owner question or `troubleshooter` consultation
- **AND** main neither performs nor simulates the protected action and makes no claim that depends on the blocked higher-fidelity path.

#### Scenario: Owner clarification conflicts with pending artifacts
- **WHEN** a current owner clarification changes the accepted outcome, operating envelope, non-goals, or observable proof and an existing proposal, design, specification, or task remains stricter or inconsistent
- **THEN** main treats the conflicting artifact as a revisable process control rather than owner scope
- **AND** main reconciles the smallest coherent artifact set before further implementation or proof.

#### Scenario: A technical blocker has exhausted local mechanisms
- **WHEN** no unused safe causally distinct local mechanism remains for a technical blocker and owner-only status is not proven
- **THEN** main invokes exactly one diagnosis-only `troubleshooter` consultation with the current failure-chain evidence before any user question
- **AND** main verifies and executes an authorized recovery returned by that consultation.

#### Scenario: Recovery removes the need for user action
- **WHEN** the verified `troubleshooter` report identifies a safe local route that advances the original accepted outcome
- **THEN** main executes the route under its existing authority
- **AND** main does not escalate that blocker to the user.

#### Scenario: Owner action is proven
- **WHEN** the still-current original accepted outcome requires an exact credential, elevation, destructive or remote action, deployment or release action, owner-controlled cost, protected semantic decision, unavailable external capability, or another protected owner action
- **AND** evidence establishes that no unused safe goal-preserving real route can advance that outcome without the protected action
- **THEN** main proceeds directly to the self-contained owner handoff without invoking `troubleshooter`
- **AND** the handoff names the exact owner action, attempted alternatives, preserved state, consequences, and next continuation.

#### Scenario: Owner-only classification is uncertain
- **WHEN** a blocker resembles an owner boundary but available evidence does not prove that the exact protected action is necessary for the original accepted outcome or that safe goal-preserving real routes are absent
- **THEN** main treats the blocker as technical or uncertain rather than owner-only
- **AND** it completes the bounded recovery pass before asking the user.

#### Scenario: Equivalent consultation would repeat
- **WHEN** `troubleshooter` has already completed for the current failure chain and no new decision-changing evidence or distinct causal mechanism exists
- **THEN** main does not invoke an equivalent consultation again
- **AND** it either executes the established continuation or presents the exact remaining owner handoff.

#### Scenario: Troubleshooter is unavailable
- **WHEN** the task adapter or installed `troubleshooter` is unavailable
- **THEN** main performs the owner-only classification and unused-distinct-mechanism pass itself
- **AND** the missing specialist alone does not block lifecycle progression or create a process-approval question.

### Requirement: Troubleshooter returns one goal-preserving continuation route
The `troubleshooter` role SHALL remain diagnosis-only and SHALL receive a case file containing the original user goal, accepted outcome and operating envelope, blocker symptoms, preserved raw diagnostics, materially distinct prior attempts, remaining candidate mechanisms, allowed diagnostic scope, forbidden paths, protected boundaries, and expected validation gate.

The role SHALL identify missing decision-changing evidence, compare only realistic routes that preserve the accepted outcome, and return one best bounded continuation route with rejected alternatives and owner routing. It SHALL distinguish an autonomous route from an exact unavoidable owner action and SHALL NOT author production corrections, test artifacts, user questions, lifecycle verdicts, or protected decisions. Main SHALL independently verify the report before using it and remains the correction, proof, validation, and handoff owner.

#### Scenario: Autonomous continuation is available
- **WHEN** safe diagnostic evidence identifies a local recovery that main is authorized to execute
- **THEN** the report selects that recovery as the best goal-preserving route and identifies its validation observation
- **AND** it does not request user action or implement the correction itself.

#### Scenario: More evidence can resolve the blocker
- **WHEN** the available evidence cannot distinguish realistic recovery hypotheses and a safe bounded diagnostic observation can do so
- **THEN** the report identifies the smallest decision-changing observation and how main can acquire it
- **AND** it does not classify the blocker as owner-only merely because the current cause is unknown.

#### Scenario: Only an owner action remains
- **WHEN** diagnostic evidence proves that every safe autonomous route is unavailable or cannot advance the accepted outcome and progress requires an exact protected action
- **THEN** the report names that action, the evidence proving it unavoidable, and the preserved continuation after owner action
- **AND** it does not simulate, authorize, or weaken the protected boundary.

#### Scenario: Case file is insufficient
- **WHEN** the invocation omits prior-attempt evidence or the goal and operating envelope needed to assess goal preservation
- **THEN** the role remains read-only and reports the missing evidence or whether escalation is justified
- **AND** it does not guess a correction or owner.

### Requirement: Pre-escalation behavior is qualified at the loaded entry point
The complete pre-escalation policy SHALL have one canonical always-loaded owner in `global/AGENTS.md`. The `troubleshooter` artifact SHALL contain only its role-specific contract, and maintained templates, reusable instructions, commands, skills, and documentation SHALL use concise pointers or routing deltas instead of copying the complete policy.

Deterministic contract checks SHALL enforce critical owner-boundary, one-consultation, diagnosis-only, and canonical-owner markers but SHALL NOT claim semantic compliance. Candidate retention SHALL additionally require bounded same-model baseline/candidate scenarios through the actual loaded OpenCode main, task, and question paths with identical model, prompts, permissions, and disposable environment. Raw evidence SHALL preserve tool calls, outputs, source identity, candidate identity, cleanup, and the observed final route.

#### Scenario: Deterministic markers pass
- **WHEN** canonical and role-specific required-text checks pass
- **THEN** validation reports structural contract integrity
- **AND** implementation readiness still requires loaded same-model behavior evidence.

#### Scenario: Proven owner-only scenario is evaluated
- **WHEN** the loaded candidate receives a synthetic blocker that requires an exact protected owner action and has no safe local substitute
- **THEN** evidence shows one self-contained owner handoff and zero `troubleshooter` calls
- **AND** the candidate does not claim or execute the protected action.

#### Scenario: Recoverable technical scenario is evaluated
- **WHEN** the loaded candidate receives a synthetic technical blocker with an unused safe distinct route or a valid diagnosis-only continuation
- **THEN** evidence shows the route is executed by main and no blocker question is sent to the user
- **AND** `troubleshooter` does not author production or test corrections.

#### Scenario: Exhausted technical scenario is evaluated
- **WHEN** no safe unused local route remains and owner-only status is not proven
- **THEN** evidence shows exactly one current-chain `troubleshooter` consultation before any owner handoff
- **AND** a second equivalent consultation is suppressed without new evidence or a distinct mechanism.

#### Scenario: Completion guard mutation is considered
- **WHEN** loaded grind-on evidence does not reproduce a bypass caused by the guard's troubleshooter detection or failure-chain identity
- **THEN** this increment does not modify completion-guard runtime behavior
- **AND** any future guard mutation requires its own reproduced cause, scoped invalidation, and runtime proof.

### Requirement: Loaded recovery evaluation distinguishes path blockers from outcome blockers
The maintained pre-escalation recovery proof SHALL exercise the actual loaded primary entry point with a bounded same-model baseline/candidate scenario in which a stale agent-authored proof path requires a protected action while the original accepted outcome and non-goals admit an unused safe real local observation. Candidate retention SHALL require outcome-relative replan behavior without weakening the paired true-owner scenario.

The scenario SHALL use the existing disposable project, explicit tool permissions, redacted capture, immutable bundle, evaluator, replay, session cleanup, and source-identity owners. It SHALL NOT grant edit, external-directory, arbitrary shell, credential, remote, machine, destructive, deployment, installation, publication, or protected-effect authority merely to obtain a passing result.

#### Scenario: Stale path is replanned without owner escalation
- **WHEN** the loaded primary receives the stale-path scenario and the allowed real local observation command is available
- **THEN** it executes that command, reports the current proof path as blocked, selects autonomous replan, and emits no user question or specialist consultation
- **AND** the evaluator rejects any protected or bypass command, synthetic or end-to-end success claim, disallowed file mutation, missing route observation, or `OWNER_REQUIRED` result.

#### Scenario: True outcome-required action remains owner-controlled
- **WHEN** the same candidate receives the paired scenario whose original accepted outcome itself requires an exact protected action and no safe real substitute exists
- **THEN** it emits the existing owner-required handoff without executing or weakening that action
- **AND** no stale-path success can qualify a candidate that fails this paired safety oracle.

#### Scenario: Static markers pass but loaded behavior is wrong
- **WHEN** deterministic contracts and instruction-budget checks pass but the candidate asks the user, invokes `troubleshooter`, bypasses the protected action, or claims the blocked higher-fidelity outcome in the stale-path scenario
- **THEN** behavior evaluation fails and the instruction candidate remains in `development`
- **AND** another loaded capture requires a causal instruction or evaluator correction rather than a wording-only retry.

