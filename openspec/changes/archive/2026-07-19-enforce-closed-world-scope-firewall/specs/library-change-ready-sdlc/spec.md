## MODIFIED Requirements

### Requirement: SDLC-002 Scope expansion requires explicit user approval

Autonomous work MAY include only changes that directly satisfy a frozen acceptance criterion inside the frozen artifact/write scope. After the first candidate mutation, the scope SHALL be closed-world and MAY only shrink. No reviewer, SDET, validation result, delivery gate, severity label, P0/P1 finding, mandatory-gate failure, unknown, or missing capability SHALL authorize a new acceptance criterion, task, gate, write path, artifact, evidence tool, or implementation action.

A serious finding MAY bind readiness and require `Change-Ready: no` without authorizing correction. A current-change correction SHALL be allowed only when the finding references a frozen criterion, has a concrete reproducer, is attributable to the current candidate relative to baseline, is completely correctable inside the frozen scope without persistent evidence infrastructure, and the single predeclared correction wave remains unused.

Any user-approved expansion after freeze SHALL create an explicit new revision or separate change with a new scope capsule and invalidated prior qualification evidence; it SHALL NOT silently enlarge the frozen revision. P2/note/theoretical/coverage-only items SHALL remain residual or separately approved follow-up.

#### Scenario: post-mutation polish is residual

- **GIVEN** final review or delivery reports only P2/note wording or coverage polish
- **WHEN** the orchestrator routes the finding
- **THEN** it SHALL place the item in Residual Risks or a separately approved follow-up
- **AND** SHALL NOT treat it as `Blocking Evidence` or autonomous scope expansion solely for polish.

#### Scenario: candidate-attributable defect receives one in-scope correction

- **WHEN** a reproducer proves that the current candidate violates frozen criterion `AC-2`, baseline evidence attributes the violation to the candidate, the complete fix fits the frozen write scope, and the correction wave is unused
- **THEN** the orchestrator MAY route exactly one bounded correction
- **AND** SHALL replay only the affected frozen gates.

#### Scenario: out-of-scope P0 blocks without expanding work

- **WHEN** a reviewer finds a reproducible P0 defect whose complete correction requires an unfrozen path, artifact, criterion, gate, or capability
- **THEN** the finding SHALL bind `Change-Ready: no`
- **AND** SHALL route an owner decision or separate prerequisite/follow-up change
- **AND** SHALL NOT authorize mutation of the frozen candidate.

#### Scenario: unknown does not become implementation authority

- **WHEN** a post-freeze risk, cause, ownership decision, or validation result is unknown
- **THEN** the orchestrator MAY perform bounded read-only investigation
- **AND** SHALL otherwise record residual risk or a terminal external blocker
- **AND** SHALL NOT create implementation work from the unknown alone.

#### Scenario: broad all-tasks request uses the frozen snapshot

- **WHEN** the user requested implementation of all OpenSpec tasks and the task IDs were frozen before candidate mutation
- **THEN** only that frozen task-ID snapshot SHALL define the current revision
- **AND** later task additions SHALL require a new user-approved revision or separate change.

#### Scenario: owner expansion creates a new revision

- **WHEN** the user approves a new acceptance criterion, task, gate, path, artifact, or domain after freeze
- **THEN** the current qualification attempt SHALL terminate
- **AND** the expansion SHALL be recorded as a new revision or separate change with a new scope capsule and fresh evidence.

### Requirement: SDLC-005 Static contracts and validators enforce the new model

Static contracts and validators SHALL require Ordinary Small direct-main path wording, happy path before edge testing, closed-world post-freeze scope, exclusive user scope authority, non-authorizing blockers, named Material triggers, explicit Change-Ready routing, `Change-Ready: not requested`, role separation when SDET/final review is invoked, finite qualification waves, and protection of unrelated work and remote/destructive authority.

Static validators SHALL reject old universal anti-patterns including exact phrases equivalent to: `Any false or unknown condition selects Material`; `Every behavior change still receives fresh independent SDET assessment`; universal direct-main prohibition for all behavior-changing work; mandatory Identity Recipe dual-identity wording; P0/P1 or mandatory-gate findings authorizing new acceptance scope; reviewer/SDET output containing `Required Next Actions` or `Actionable Continuation Items`; persistent evidence tooling added because a current gate cannot run; and correction replay beyond the single frozen correction wave.

Active-authority ordered skill headings SHALL match the simplified qualification lifecycle and SHALL NOT require identity-specific headings/tokens. Helper code SHALL NOT encode fuzzy risk classification, semantic scope inference, or reviewer severity judgment.

#### Scenario: validator accepts Ordinary Small default

- **GIVEN** global AGENTS defines Ordinary Small default and `Change-Ready: not requested`
- **WHEN** `validate:strict` runs after this change
- **THEN** the routing validators SHALL pass the new positive tokens
- **AND** SHALL fail if old universal anti-pattern needles are reintroduced.

#### Scenario: skill authority uses Candidate Reference heading

- **GIVEN** the canonical skill body is validated structurally
- **WHEN** ordered lifecycle headings are checked
- **THEN** Candidate Reference SHALL appear in the qualification sequence
- **AND** dual-identity Identity Recipe headings SHALL NOT be required.

#### Scenario: validator accepts closed-world authority

- **WHEN** `validate:strict` scans the loaded global routing, canonical skill, qualification roles, and project-facing mirrors
- **THEN** every authority surface SHALL state that rejection may bind readiness but never authorize scope expansion
- **AND** the validation SHALL pass when the exact frozen-scope and finite-wave markers are present.

#### Scenario: validator rejects P0 scope authorization

- **WHEN** an authority surface states that a P0/P1 finding or mandatory-gate failure may add a criterion, task, path, evidence tool, or correction outside frozen scope
- **THEN** deterministic validation SHALL fail and name the offending surface.

#### Scenario: validator rejects reviewer and SDET action lists

- **WHEN** a reviewer or SDET output contract contains `changes_requested`, `Required Next Actions`, `Actionable Continuation Items`, or an equivalent action-authoring field
- **THEN** deterministic validation SHALL fail
- **AND** SHALL require accept-or-reject plus `Blocking Evidence` and non-authorizing `Follow-up Candidates`.

#### Scenario: helper remains deterministic

- **WHEN** the validator evaluates the scope-firewall contract
- **THEN** it SHALL check explicit headings, fields, markers, forbidden phrases, and configured surfaces
- **AND** SHALL NOT infer severity, root cause, semantic scope, or correction eligibility from fuzzy text.

## ADDED Requirements

### Requirement: SDLC-006 Qualification is finite and cannot create evidence products

Before candidate mutation, Material work SHALL freeze acceptance IDs, task IDs, write roots, exact allowed additions, forbidden artifacts, mandatory gate IDs and procedures, baseline gate outcomes, one initial fresh SDET, one correction wave, at most one fresh corrected-candidate SDET when that correction is consumed, one final review, one delivery review, and a stop line in a readable project-native scope capsule.

A mandatory gate SHALL be current-change authority only when it was frozen with its trusted source and baseline outcome. A baseline failure, later-discovered gate, or missing prerequisite capability MAY block readiness but SHALL NOT authorize baseline cleanup or new current-change work.

Persistent infrastructure introduced solely to qualify the current candidate, including a reusable harness, validator framework, benchmark system, simulator, ledger, generator, or cross-repository runner, SHALL require a separate prerequisite change. Final and delivery review SHALL be accept-or-reject gates and SHALL NOT initiate autonomous correction or replay.

#### Scenario: baseline gate failure remains external

- **WHEN** a proposed mandatory gate already failed on the recorded baseline and baseline remediation is not the frozen primary outcome
- **THEN** the gate SHALL NOT attribute the failure to the candidate
- **AND** SHALL route a user decision or separate prerequisite change instead of baseline cleanup inside the current change.

#### Scenario: missing evidence infrastructure becomes a prerequisite

- **WHEN** qualification would require a new persistent harness, validator framework, benchmark system, simulator, ledger, generator, or cross-repository runner
- **THEN** the current change SHALL report the missing prerequisite and `Change-Ready: no` when the evidence is mandatory
- **AND** SHALL NOT add that infrastructure to the current candidate.

#### Scenario: second serious failure terminates the attempt

- **WHEN** the single correction wave has been consumed and another serious or mandatory failure remains or appears
- **THEN** the current qualification attempt SHALL terminate with `Change-Ready: no`
- **AND** SHALL NOT dispatch another autonomous correction or replay wave.

#### Scenario: corrected-candidate SDET cannot reopen correction

- **WHEN** the single correction wave is consumed
- **THEN** one new fresh SDET MAY assess the corrected candidate
- **AND** any serious finding from that assessment SHALL terminate the attempt rather than authorize a second correction.

#### Scenario: final review rejection is terminal

- **WHEN** Final Candidate Review returns `rejected` or `blocked`
- **THEN** the current qualification attempt SHALL terminate
- **AND** the reviewer SHALL provide `Blocking Evidence` and non-authorizing `Follow-up Candidates` only
- **AND** correction SHALL require a new user-approved revision or separate change.

#### Scenario: delivery rejection is terminal

- **WHEN** the Material delivery review rejects or blocks the candidate
- **THEN** the candidate SHALL remain `Change-Ready: no`
- **AND** the delivery reviewer SHALL NOT authorize candidate mutation or gate replay.
