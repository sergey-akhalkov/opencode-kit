## REMOVED Requirements

### Requirement: Loaded instruction artifacts preserve the closed-world scope firewall

**Reason**: The closed-world file/task firewall and Change-Ready output model are superseded by accepted-outcome authority, protected boundaries, and Development-Stage semantics.

**Migration**: Use the new loaded-authority, explicit-stage, and optional-review requirements below.

### Requirement: Outcome-first policy has canonical authority and minimal role deltas

**Reason**: Its canonical Pilot-Ready/Change-Ready contract is replaced by the Development-Stage lifecycle while preserving minimal role deltas.

**Migration**: Use `Loaded authority owns the simple stage model` and the current role-specific requirements below.

### Requirement: Reviewer contracts separate finding validity from current disposition

**Reason**: The Pilot-Ready/Change-Ready reviewer disposition split is superseded by optional, evidence-only, non-authorizing review.

**Migration**: Use `Reviewer roles remain optional and non-authorizing`.

### Requirement: Existing validators prevent policy duplication and contradiction

**Reason**: Pilot-Ready/Change-Ready validator markers are superseded by exact Development-Stage semantics and alias rejection.

**Migration**: Use `Validators enforce explicit stage semantics`.

## ADDED Requirements

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
