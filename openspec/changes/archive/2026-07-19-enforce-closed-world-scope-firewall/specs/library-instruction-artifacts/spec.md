## ADDED Requirements

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
