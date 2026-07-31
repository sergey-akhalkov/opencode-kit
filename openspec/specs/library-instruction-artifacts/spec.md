# library-instruction-artifacts Specification

## Purpose
TBD - created by archiving change deduplicate-instruction-artifacts. Update Purpose after archive.
## Requirements
### Requirement: Canonical Universal Development Loop source

The repository SHALL have exactly one file that defines the Universal Development Loop step list and its supporting sections (Token/Time Rules, Quality Defaults, Output Shape). The canonical file SHALL be `instructions/universal-development-loop.md`. Every other artifact in the repository that previously restated the step list SHALL contain only a reference to the canonical file.

#### Scenario: kit docs pointer

- **WHEN** a reader opens `docs/universal-development-loop.md`
- **THEN** the file SHALL contain a `## Universal Development Loop` heading
- **AND** the body SHALL be at most 10 lines and SHALL point to `instructions/universal-development-loop.md` for the canonical definition.

#### Scenario: project template pointer

- **WHEN** `tools/init-project.ts` writes `AGENTS.md` into a target project
- **THEN** the written file SHALL contain a `## Universal Development Loop` section
- **AND** the section SHALL point to `instructions/universal-development-loop.md` instead of restating the step list.

#### Scenario: reusable project instructions pointer

- **WHEN** `instructions/reusable-project-agent-instructions.md` is rendered
- **THEN** the file SHALL NOT inline the 11-step Universal Development Loop list
- **AND** it SHALL contain a reference paragraph that names the canonical file.

#### Scenario: validator rejects inline duplication

- **WHEN** `npm run validate` scans the repository
- **THEN** the orchestrator SHALL fail with a clear error if any artifact other than `instructions/universal-development-loop.md` contains the full 11-step loop body
- **AND** the error message SHALL name the offending file and the canonical source.

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
