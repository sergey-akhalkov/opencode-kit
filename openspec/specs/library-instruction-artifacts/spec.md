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

### Requirement: Loaded instruction artifacts preserve the closed-world scope firewall

The loaded global routing, canonical Change-Ready skill, qualification role agents, shared reviewer contract, reusable project guidance, project template, and repository maintenance guidance SHALL preserve one non-contradictory authority model: post-freeze scope may only shrink; only the user may approve expansion through a new revision or separate change; rejection may bind readiness but SHALL NOT authorize implementation; and qualification SHALL be finite.

The repository SHALL enforce this model through existing deterministic contract modules and focused tests. It SHALL NOT add a new validator framework, runtime state store, lifecycle service, or evidence subsystem for this requirement.

#### Scenario: canonical and mirrored surfaces agree

- **WHEN** existing validation scans the configured scope-firewall instruction surfaces
- **THEN** every surface SHALL preserve closed-world scope, non-authorizing blockers, terminal external findings, and finite review semantics
- **AND** no surface SHALL retain the superseded P0/P1 expansion exception.

#### Scenario: role output cannot grant scope or author actions

- **WHEN** a reviewer, SDET, final-review, or delivery output contract is inspected
- **THEN** its findings MAY state readiness impact through `Blocking Evidence` and propose separate work through non-authorizing `Follow-up Candidates`
- **AND** SHALL NOT contain `Required Next Actions`, `Actionable Continuation Items`, `changes_requested`, or authority to add criteria, tasks, gates, paths, evidence infrastructure, candidate fixes, or replay waves.

#### Scenario: current validator architecture is reused

- **WHEN** the scope-firewall checks are implemented
- **THEN** they SHALL extend existing files under `tools/contracts/`, `tools/validators/`, and focused existing test files
- **AND** SHALL NOT create a new support file or general-purpose validation subsystem.

#### Scenario: historical artifacts remain historical

- **WHEN** validation encounters prior OpenSpec change artifacts that record superseded policy
- **THEN** those historical artifacts SHALL remain unchanged and SHALL NOT be treated as current loaded authority
- **AND** current global/project-facing authority surfaces SHALL satisfy the new policy.

