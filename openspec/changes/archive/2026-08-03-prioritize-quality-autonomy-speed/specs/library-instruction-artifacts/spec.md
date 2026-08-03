## ADDED Requirements

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
Continuous learning, workflow feedback, and deterministic automation SHALL remain mechanisms serving quality, autonomy, and speed rather than a mandatory fourth stage or peer priority. Improvement capture SHALL NOT delay the current accepted outcome unless the current defect itself is critical or non-deferrable.

#### Scenario: Repeated manual step is locally replaceable
- **WHEN** a small deterministic helper is necessary for the accepted outcome or directly replaces repeated in-scope manual work
- **THEN** the agent MAY implement it within the smallest sufficient dependency closure
- **AND** SHALL verify its explicit inputs, outputs, stable ordering, and failure behavior.

#### Scenario: Broader reusable improvement is outside scope
- **WHEN** an improvement is useful but not necessary for the current outcome or invariant
- **THEN** it SHALL be captured through the approved follow-up mechanism without delaying handoff
- **AND** SHALL NOT silently expand the product candidate.
