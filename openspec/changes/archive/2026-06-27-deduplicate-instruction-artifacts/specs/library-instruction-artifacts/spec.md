## ADDED Requirements

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