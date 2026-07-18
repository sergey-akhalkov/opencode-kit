## ADDED Requirements

### Requirement: Prevention Signal has one canonical instruction source
The complete Prevention Signal field and routing contract SHALL have exactly one canonical runtime instruction source. Reviewer, worker, SDET, delivery, and orchestration artifacts SHALL reference that source or carry only role-specific deltas and SHALL NOT copy the full block.

#### Scenario: Reviewer agents use the shared contract
- **WHEN** a reusable reviewer agent is inspected
- **THEN** its existing contract reference SHALL remain the source of shared Prevention Signal behavior
- **AND** the agent body SHALL not duplicate the complete field list or adapter workflow

#### Scenario: Validator detects copied signal block
- **WHEN** an agent or skill outside the canonical source repeats the complete Prevention Signal contract
- **THEN** `npm run validate` SHALL fail with the canonical source and offending artifact

### Requirement: Runtime instruction corpus has a non-growth budget
The repository SHALL emit a complete stable JSON baseline manifest for `global/AGENTS.md`, `global/agents/**/*.md`, `global/skills/**/*.md`, and `instructions/**/*.md`. The manifest SHALL record baseline Git ref, exact existing paths, explicitly authorized added paths with zero baseline contribution, per-file and total token proxy, algorithm version, and content hash. This change SHALL authorize only `global/skills/continuous-sdlc-learning/SKILL.md` as a new runtime path. It SHALL NOT increase the combined union-corpus token proxy, and `global/AGENTS.md` SHALL NOT increase independently. Added learning guidance SHALL replace or consolidate existing duplicated guidance.

#### Scenario: New on-demand learning skill is added
- **WHEN** the change adds a new learning skill or expands an existing one
- **THEN** validation SHALL show equal or greater token-proxy removal or consolidation elsewhere in the runtime corpus
- **AND** `instruction-artifact-reviewer` SHALL verify that removed text is genuinely superseded rather than an unrelated safety deletion

#### Scenario: Global hook adds context without replacement
- **WHEN** `global/AGENTS.md` grows relative to the captured baseline
- **THEN** the instruction budget gate SHALL fail
- **AND** implementation SHALL merge or replace existing routing text instead of adding an override paragraph

#### Scenario: Baseline scope or algorithm changes
- **WHEN** current validation uses a different path set or token-proxy algorithm version than the immutable baseline manifest
- **THEN** comparison SHALL fail as incompatible
- **AND** a new baseline SHALL be explicitly captured before runtime instruction mutation rather than silently rewriting historical evidence

#### Scenario: Declared learning skill is added
- **WHEN** comparison sees `global/skills/continuous-sdlc-learning/SKILL.md`
- **THEN** it SHALL include that file's full token proxy against its declared zero baseline contribution
- **AND** total corpus non-growth SHALL still be required

#### Scenario: Undeclared runtime path is added
- **WHEN** comparison sees a new runtime path absent from both baseline paths and `authorizedAddedPaths`
- **THEN** the budget gate SHALL fail even when total token proxy decreases

### Requirement: Prevention candidates declare authority placement
Every instruction-oriented prevention candidate SHALL identify why its target is the narrowest correct authority among validator/tool, workflow/skill, role agent, global instructions, or project-local instructions. Incident narrative and provenance SHALL remain outside runtime prompt text.

#### Scenario: Checkable rule is proposed as prose
- **WHEN** a prevention recommendation can be fully enforced by an existing validator boundary but proposes only an instruction reminder
- **THEN** instruction review SHALL request automation-first placement or evidence that automation is infeasible

#### Scenario: Project detail appears in reusable global text
- **WHEN** a global candidate names a source project's path, command, framework, or domain without a portable contract reason
- **THEN** instruction review SHALL reject reusable placement
- **AND** the detail SHALL be routed to project-local guidance

### Requirement: Feedback storage ownership is unambiguous
`docs/feedbacks/` SHALL remain the canonical Git fallback for privacy-safe local complaints when the exact accepted adapter binding is unavailable. `docs/feedbacks/curated-prevention-ledger.json` SHALL implement the exact strict root, record variants, ids, owners, source/target/replay records, bounds, conditional fields, sorting, link integrity, transition, and 2 MiB size contract defined by this change's design. It SHALL be the canonical compact Git lifecycle record for accepted prevention work. Adapter-owned raw events and workflow state SHALL remain outside this repository. `.opencode/state/instruction-feedback-ledger.json` SHALL NOT be presented as a second durable source of truth.

#### Scenario: Adapter accepts a signal
- **WHEN** a conforming background adapter returns accepted submission
- **THEN** the kit SHALL retain opaque correlation as needed
- **AND** it SHALL not copy the raw event into `docs/feedbacks/` solely to duplicate storage

#### Scenario: Adapter is absent
- **WHEN** local fallback capture is permitted outside candidate freeze or qualification
- **THEN** `complain` SHALL append a privacy-safe record under `docs/feedbacks/`
- **AND** the record SHALL identify unknown recurrence or cause explicitly when evidence is absent

#### Scenario: Candidate is frozen
- **WHEN** fallback is needed during candidate freeze or qualification
- **THEN** `complain` SHALL return a `Feedback Candidate` without writing the repository
- **AND** candidate identities SHALL remain unchanged

#### Scenario: Curated state advances
- **WHEN** accepted prevention work moves from open to applied, replayed, or resolved
- **THEN** a failure-atomic update SHALL validate `opencode-kit.curated-prevention-ledger.v1` and the allowed transition
- **AND** raw event content SHALL not be copied into the curated record

#### Scenario: Duplicate and superseded records are linked safely
- **WHEN** a curated record has status duplicate or superseded
- **THEN** it SHALL carry exactly its required different-record linkage and no applied/replay fields
- **AND** missing, self, cyclic, or unknown linkage SHALL fail validation

#### Scenario: Still-failing replay creates linked successor
- **WHEN** a replay result is still-failing and creates a new open prevention record
- **THEN** the successor SHALL carry exact predecessor/replay lineage and a replay source reference
- **AND** the predecessor SHALL retain the referenced still-failing replay without rewriting history

### Requirement: Prevention provenance stays out of active prompt prose
Signal ids, incident histories, timestamps, source-project details, replay logs, and rationale archives SHALL live in feedback, OpenSpec, fixture, or validation artifacts rather than inline global/agent/skill instructions. Runtime prose SHALL contain only the minimal current rule and routing contract.

#### Scenario: Accepted rule has multiple source signals
- **WHEN** several feedback signals support one accepted prevention rule
- **THEN** their ids and evidence SHALL be recorded outside the runtime instruction
- **AND** the instruction SHALL not grow a per-incident history section
