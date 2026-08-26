## ADDED Requirements

### Requirement: Status communication preserves exact subject and evidence scope

The active global instructions, user-facing handoffs, and compaction prompt SHALL attach status words such as `blocked`, `unknown`, `unavailable`, `ready`, and `complete` to the exact subject and evidence scope they describe. They SHALL keep resource availability, action authority, path or runner readiness, evidence completeness, operational consequence, and accepted-outcome state separate when those facts differ. A supported status in one dimension SHALL NOT be broadened, inverted, or silently applied to another dimension, and a known adjacent fact SHALL be stated when omitting it could reasonably cause that inference. Responses SHALL remain concise and SHALL NOT enumerate irrelevant dimensions when no ambiguity is plausible.

#### Scenario: Available resource has an unknown proof path
- **WHEN** current evidence establishes that a resource is available and authorized while the current change lacks evidence needed to classify one proof path
- **THEN** the response states the known resource and authority facts separately and applies `unknown` only to the named proof path or its evidence
- **AND** it does not describe the resource, authority, environment, or accepted outcome as unavailable or blocked without separate supporting evidence.

#### Scenario: Resource availability is genuinely unknown
- **WHEN** proof-path state is known but current evidence does not establish whether the required resource is available
- **THEN** the response applies `unknown` to resource availability and preserves the independently known path state
- **AND** it does not manufacture an available resource merely to make the wording symmetrical.

#### Scenario: Compaction reconstructs mixed status dimensions
- **WHEN** a session is compacted after recording different supported states for resource, authority, path readiness, evidence, operational consequence, and accepted outcome
- **THEN** the continuation summary preserves each material state with its subject and evidence scope
- **AND** a fresh session can reconstruct the same states without converting a path-scoped restriction into a broader resource, authority, or outcome claim.

#### Scenario: Status dimensions do not materially differ
- **WHEN** a short response has one unambiguous subject and no adjacent known fact would be negated or broadened by omission
- **THEN** the response may state that subject and status directly without a multi-field checklist
- **AND** the communication remains as short as practical while preserving accuracy.

### Requirement: Scoped-status wording has bounded loaded-behavior evidence

The repository SHALL retain deterministic source and mirror checks plus a finite installed loaded-behavior pack for subject-scoped status communication. The behavior pack SHALL compare a frozen baseline and readable candidate under matched source, model, prompt, fixture, permission, OpenCode, and environment identities; SHALL preserve privacy-safe response and compaction evidence; and SHALL validate exact expected status dimensions without scoring prose quality or inferring correctness from marker presence alone. Its reported claim SHALL remain limited to the maintained scenario population and recorded environment.

#### Scenario: Candidate preserves every reviewed status dimension
- **WHEN** the installed candidate is captured for every maintained main-response and compaction status-scope scenario
- **THEN** provider-free evaluation confirms the exact expected resource, authority, path, evidence, operational-consequence, and outcome fields with no forbidden effects
- **AND** retained response and reconstruction evidence contains no conflicting cross-dimension claim.

#### Scenario: Source marker is present but behavior is wrong
- **WHEN** deterministic instruction checks pass but a candidate broadens `unknown`, `blocked`, or `unavailable` beyond the expected subject in a maintained scenario
- **THEN** the behavior evaluation fails and the candidate is not represented as satisfying the scoped-status change
- **AND** the marker check remains a drift tripwire rather than semantic proof.

#### Scenario: Maintained population passes
- **WHEN** every candidate scenario and cleanup oracle is green under the recorded environment
- **THEN** the result states only the finite maximum claim declared by CSA-001
- **AND** it does not claim universal wording quality, language coverage, or compliance by unobserved models and contexts.
