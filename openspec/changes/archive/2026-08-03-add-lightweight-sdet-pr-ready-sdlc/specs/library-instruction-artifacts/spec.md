## MODIFIED Requirements

### Requirement: Reviewer agent contract reference

Each reusable reviewer agent under `global/agents/*.md` SHALL contain exactly one `## Contract Reference`
heading that names `instructions/leaf-reviewer-agent-contract.md` instead of inlining the full Leaf Contract,
Feedback Ledger, or Prevention Feedback block. That reference SHALL be repository validation provenance and
the canonical maintenance source; runtime correctness SHALL NOT depend on a target project reading the
non-global path. Zero, duplicate, or malformed `## Contract Reference` headings SHALL fail validation.

The always-loaded `global/AGENTS.md` SHALL provide the compact shared runtime reviewer invariants required
by every reviewer: read-only leaf behavior, no user questions or nested orchestration, no source/config/test
mutation, no lifecycle completion authority, evidence-backed findings, blocker escalation to the
main/general orchestrator, and report-only handoff. Each reviewer agent SHALL contain its role-specific
inputs, checks, verdict/output contract, and permissions. Together those global Markdown artifacts SHALL be
operational when only the active global config directory and target project are available.

#### Scenario: reviewer agent body

- **WHEN** a reviewer agent is inspected
- **THEN** its body SHALL contain exactly one `## Contract Reference` heading, a blank line, the sole
  standalone path line `` `instructions/leaf-reviewer-agent-contract.md` ``, a blank line, and then the next
  `##` heading or EOF
- **AND** it SHALL NOT use a verbose explanatory sentence in place of that standalone path line
- **AND** it SHALL NOT contain the inline `## Leaf Contract` body that previously appeared in each agent
- **AND** it SHALL contain the role-specific inputs, checks, and output needed for runtime operation.

#### Scenario: reviewer agent exception

- **WHEN** a reviewer agent describes role-specific output that the shared contract does not cover
- **THEN** the agent MAY include additional sections below the contract reference
- **AND** those sections SHALL NOT duplicate the shared contract text.

#### Scenario: global runtime does not depend on the external reference

- **GIVEN** OpenCode loads `global/AGENTS.md` and a reviewer agent from the active global config directory
- **AND** the target project does not expose the kit-root `instructions/` directory
- **WHEN** the reviewer is dispatched
- **THEN** its shared safety/authority rules SHALL come from the always-loaded global instructions
- **AND** its role-specific judgment and report SHALL come from its agent body
- **AND** missing runtime access to the provenance file SHALL NOT weaken or block the reviewer contract.

#### Scenario: validator enforces reference form and cardinality

- **WHEN** the repository validator scans registered reusable reviewer agents and final-candidate-reviewer
- **THEN** it SHALL fail if a reviewer agent contains the full Leaf Contract, Feedback Ledger, or Prevention
  Feedback block inline
- **AND** it SHALL fail if the number of exact `## Contract Reference` headings is not exactly one, with a
  file-specific diagnostic
- **AND** it SHALL fail if the single `## Contract Reference` section is not the exact standalone backticked
  form
- **AND** it SHALL pass when the agent contains exactly one exact standalone compact reference plus
  role-specific runtime contract.

#### Scenario: porting checklist matches reference-based reviewer contract

- **WHEN** `instructions/porting-checklist.md` is inspected for reusable reviewer guidance
- **THEN** it SHALL require exactly one standalone `## Contract Reference` to
  `instructions/leaf-reviewer-agent-contract.md` plus role-specific body content
- **AND** it SHALL prohibit inlining shared `## Leaf Contract`, `## Feedback Ledger`, or
  `## Prevention Feedback` sections
- **AND** it SHALL NOT instruct authors to paste those shared blocks into reusable reviewer agents.
