## ADDED Requirements

### Requirement: Qualifying SDLC returns emit a future-prevention signal
The portable SDLC SHALL create a Prevention Signal for every mandatory-gate or reproducible P0/P1 finding that routes work from a later lifecycle stage to an earlier owner, and for production-worker process blockers that route back to briefing, scope, permission, validation-contract, or ownership decisions. Severity without a return or supported recurrence path SHALL not qualify by itself.

#### Scenario: Final review returns candidate to production
- **WHEN** final review reports a reproducible P1 production defect and requests correction
- **THEN** the orchestrator SHALL preserve the normal production correction route
- **AND** it SHALL create one Prevention Signal with `fromStage = final-review` and `toStage = production`

#### Scenario: P2 note remains residual
- **WHEN** a reviewer reports only a nonblocking P2 wording or optional-evidence note
- **THEN** the orchestrator SHALL route it to Residual Risks or an approved follow-up
- **AND** it SHALL not automatically emit a serious-return Prevention Signal

#### Scenario: Worker reports deficient brief
- **WHEN** a production worker returns `blocked` because the authoritative brief lacks a required scope or owner decision
- **THEN** the orchestrator SHALL create a Prevention Signal for `production -> briefing`
- **AND** the worker SHALL not guess or expand its scope

### Requirement: Current correction and future prevention remain separate
A Prevention Signal SHALL NOT replace, weaken, or delay correction of the current candidate. Failure or absence of a background adapter SHALL not make a serious current finding nonblocking, and future-prevention processing SHALL not invalidate current evidence unless it mutates the current candidate.

#### Scenario: Background submission succeeds
- **WHEN** a serious finding is submitted to a background adapter
- **THEN** current-task correction and affected gate replay SHALL continue under the existing Change-Ready contract
- **AND** the originating session SHALL not wait for prevention analysis or candidate completion

#### Scenario: Background submission fails
- **WHEN** the adapter rejects or cannot accept a Prevention Signal
- **THEN** the orchestrator SHALL record the adapter outcome or local fallback
- **AND** it SHALL continue current-task owner routing without claiming that future prevention was submitted

### Requirement: Prevention Signals separate known evidence from unknowns
The canonical Prevention Signal SHALL require a stable Source Event ID, Source Role, stage return, trigger, severity, observed failure, violated invariant, root-cause status, recurrence-path status, scope hint, prevention target, intervention hint, replay-oracle status, and privacy-safe evidence references. Root cause, recurrence path, or replay oracle MAY be explicitly unknown; the agent SHALL not invent missing values.

#### Scenario: Unknown root cause is retained
- **WHEN** evidence proves a serious return but does not establish root cause
- **THEN** the signal SHALL record unknown cause and route investigation
- **AND** it SHALL not contain a guessed draft rule

#### Scenario: Report omits required uncertainty status
- **WHEN** a qualifying Prevention Signal omits root-cause, recurrence-path, or replay-oracle status
- **THEN** deterministic validation SHALL reject the signal as incomplete

#### Scenario: Dream Team binding maps identity and role
- **WHEN** the exact v1 binding submits a canonical Prevention Signal
- **THEN** `Source Event ID` SHALL map to `idempotencyKey` and `Source Role` SHALL map to `sourceRole`
- **AND** the remaining fields SHALL map according to the exact table and fixture hash in this change's design

#### Scenario: Source lacks stable identity
- **WHEN** a qualifying source report lacks report/finding/run/check identity required by the canonical recipe
- **THEN** deterministic identity derivation SHALL return `blocked`
- **AND** the model SHALL not invent a random idempotency key or copy unstable prose into identity

#### Scenario: Unsafe or ambiguous source ids remain distinct
- **WHEN** valid source ids contain spaces, Unicode, colons, separators, long values, or different length-framed component boundaries
- **THEN** the domain-separated length-framed SHA-256 recipe SHALL emit fixed `srcv1-<64 lowercase hex>` ids
- **AND** distinct component tuples SHALL not collapse through string concatenation

#### Scenario: Every qualifying source has a frozen identity tuple
- **WHEN** signal identity is derived for reviewer, worker, validation, SDET, delivery, correction-budget, unchanged-candidate, or explicit-friction source
- **THEN** the helper SHALL use the exact event kind and ordered component tuple from this change's exhaustive matrix
- **AND** an unknown event kind SHALL return blocked rather than reuse another source recipe

### Requirement: V1 learning adapter binding is exact and optional
The orchestrator SHALL use only a kit-owned binding that names exact accepted submit/status/retro tools; signal, acknowledgement, status, result, and retro-request versions; fixture hashes; and `dream-team.learning-qualification-profile.v1`. V1 SHALL bind these only after the coordinated Dream Team Contract Checkpoint is frozen. It SHALL not infer durability, storage ownership, mutation safety, or qualification roles from arbitrary tool names or descriptions. Portable SDLC SHALL continue without this binding.

#### Scenario: Dream Team adapter is available
- **WHEN** all three Dream Team tools expose the coordinated accepted public versions and fixture hashes
- **THEN** the on-demand learning skill SHALL map the canonical Prevention Signal to the tool
- **AND** Dream Team's tool schema SHALL remain the machine source of truth for `dream-team.sdlc-learning-signal.v1`

#### Scenario: Terminal status contains result
- **WHEN** `dream_team_learning_status` reports a terminal workflow
- **THEN** the binding SHALL validate its embedded `dream-team.sdlc-learning-result.v1`
- **AND** it SHALL not search for or invent a separate result tool

#### Scenario: Retro binding is used
- **WHEN** an explicit retro is requested and `dream_team_learning_retro` is available at the accepted contract
- **THEN** the binding SHALL submit the accepted bounded selector request and poll its opaque id through `dream_team_learning_status`

#### Scenario: Exact binding is unavailable
- **WHEN** either exact tool is absent or the accepted version is unsupported
- **THEN** the orchestrator SHALL not select a different tool by heuristic
- **AND** it SHALL use phase-safe fallback without inventing background execution or blocking solely on binding absence

#### Scenario: Future adapter has no capability descriptor
- **WHEN** an unrelated feedback tool is visible but no separately accepted versioned capability descriptor exists
- **THEN** V1 SHALL ignore that tool
- **AND** generic third-party adapter discovery SHALL remain out of scope

### Requirement: Kit-owned qualification agents honor the exact profile conditionally
The `sdet-quality-engineer`, `instruction-artifact-reviewer`, `final-candidate-reviewer`, and `session-delivery-reviewer` agent definitions SHALL preserve their native contracts and SHALL additionally honor `dream-team.learning-qualification-stage-input.v1` by emitting the strict identity-bound stage envelope requested by the accepted profile. They SHALL remain fresh/read-only/test-only according to their native role and SHALL deny nested Dream Team tools.

#### Scenario: Qualification profile is available
- **WHEN** Dream Team checks required agent availability before candidate mutation
- **THEN** all profile-required kit agents SHALL be visible under their exact names
- **AND** each SHALL accept the profile input without changing its native ownership or permissions

#### Scenario: Normal direct invocation remains compatible
- **WHEN** one of the four agents is invoked without a Dream Team qualification-stage input
- **THEN** it SHALL return its existing native report format and verdict semantics
- **AND** the new conditional envelope SHALL not be required

#### Scenario: SDET conditional preserves provisional-to-final lifecycle
- **WHEN** Dream Team invokes `sdet-quality-engineer` with the qualification profile and SDET authors tests
- **THEN** the agent SHALL first return the profile's provisional pending-recapture result with immutable pre-SDET/current input pairs and actual session hash
- **AND** after orchestrator identity recapture, post-test proof, and validation it SHALL return final output from the same session linked by provisional report hash, preserving the pre-SDET pair and exact recaptured current pair

### Requirement: Local fallback is candidate-phase safe
Local fallback SHALL append through `complain` only when that write cannot mutate a frozen or qualifying candidate. During freeze, proof, SDET, validation, final review, or delivery qualification, fallback SHALL return a privacy-safe `Feedback Candidate` for later capture and SHALL leave Semantic Candidate Identity and Package Identity unchanged.

#### Scenario: Fallback before candidate mutation
- **WHEN** no exact adapter binding exists and fallback occurs before first candidate mutation
- **THEN** `complain` MAY append a local privacy-safe record

#### Scenario: Fallback during final review
- **WHEN** no exact adapter binding exists and a qualifying signal arises during final review
- **THEN** fallback SHALL not write `docs/feedbacks/**` or any scoped candidate path
- **AND** the returned `Feedback Candidate` SHALL preserve both recorded candidate identities

### Requirement: Reusable and repository-specific prevention are routed separately
Learning triage SHALL classify prevention ownership as `reusable`, `repository`, `both`, `investigation`, or `no durable action`. Reusable recommendations SHALL be technology-neutral; repository recommendations MAY name local commands, paths, schemas, and domain constraints; `both` SHALL retain two owner-scoped outputs.

#### Scenario: General invariant with local enforcement
- **WHEN** evidence supports a portable ownership invariant and a repository-specific validator change
- **THEN** triage SHALL route the invariant to `opencode-kit` and the validator change to the source repository
- **AND** neither output SHALL absorb the other's project-specific details

#### Scenario: Product-only bug has no learning candidate
- **WHEN** a defect requires current product correction but no durable process recurrence path is supported
- **THEN** triage SHALL return `no durable action`
- **AND** it SHALL not add an instruction merely because the defect was severe

### Requirement: Reusable promotion passes a generalization gate
A prevention recommendation SHALL be promoted to reusable global guidance only when it is understandable without the source project, avoids project-specific identifiers, targets a supported recurrence class, preserves known valid exceptions, and has a representative project-neutral replay oracle. A single incident with uncertain generality SHALL route to proposal or investigation.

#### Scenario: Cross-project recurrence supports promotion
- **WHEN** two projects exhibit the same supported recurrence path and prevention target
- **THEN** a reusable candidate MAY be proposed with both opaque signal references and neutral replay cases

#### Scenario: Project command stays local
- **WHEN** a recommendation depends on a repository-specific command or layout
- **THEN** that detail SHALL remain in the repository route
- **AND** the reusable rule SHALL state only the portable invariant, if one is independently supported

### Requirement: Mechanically checkable prevention uses automation first
When a failure can be detected or prevented deterministically, the prevention candidate SHALL prefer a validator, schema, hook, tool, generator, or deterministic helper over a prose reminder. Judgment-heavy behavior SHALL use the narrowest existing skill or role authority.

#### Scenario: Invalid schema field caused the return
- **WHEN** a deterministic schema or validator can reject the invalid field before mutation
- **THEN** the candidate SHALL implement or strengthen that executable boundary
- **AND** global prose SHALL be limited to routing or evidence policy not enforceable by the validator

#### Scenario: Helper cannot determine root cause
- **WHEN** deterministic input lacks enough evidence to determine cause or generality
- **THEN** the helper SHALL return `unknown`, `unsupported`, or `blocked`
- **AND** it SHALL not encode fuzzy inference

### Requirement: Background candidates cannot mutate active configuration
Any behavior-changing prevention candidate SHALL be produced in an isolated workspace through the existing Change-Ready lifecycle. The process SHALL not edit the active source workspace, current frozen candidate, loaded `OPENCODE_CONFIG_DIR`, or remote state, and SHALL not activate itself.

#### Scenario: Global instruction candidate is ready
- **WHEN** an isolated `opencode-kit` candidate passes applicable proof, fresh SDET, validation, final review, and required delivery review
- **THEN** the result SHALL remain a local retained candidate or proposal
- **AND** a machine-owned detached candidate commit MAY retain it without updating a primary/user ref
- **AND** activation SHALL require separately accepted integration and a new or restarted OpenCode session

### Requirement: Prevention lifecycle closes only after replay
Curated prevention work SHALL be persisted in `docs/feedbacks/curated-prevention-ledger.json` under `opencode-kit.curated-prevention-ledger.v1` and SHALL use `open -> applied -> replayed -> resolved`. Updates SHALL be failure-atomic and strictly validate allowed transitions. `resolved` SHALL require fresh replay evidence against the accepted intervention and representative neutral cases. A `still-failing` replay SHALL create a new finding against the applied intervention.

#### Scenario: Rule edited without replay
- **WHEN** a prevention target has been changed but no accepted replay exists
- **THEN** its state SHALL remain `applied`
- **AND** it SHALL not be reported resolved

#### Scenario: Replay still fails
- **WHEN** the original recurrence or a representative neutral case still fails
- **THEN** the original replay result SHALL be recorded as `still-failing`
- **AND** a new owner-routed finding SHALL identify the applied intervention

#### Scenario: Restart reads curated state
- **WHEN** a new process resumes prevention work after restart
- **THEN** it SHALL read and validate the tracked curated ledger
- **AND** it SHALL not depend on ignored `.opencode/state` data

### Requirement: Retro reports evidence without hidden ranking
Retro SHALL group unresolved signals only through evidence-backed judgment and SHALL report exact occurrence, return-edge, project-count, severity, and replay-cost evidence. It SHALL not encode a hidden combined score. Its decisions SHALL be limited to candidate, OpenSpec, local, investigation, duplicate, or no durable action.

#### Scenario: Similar symptom has different causes
- **WHEN** two signals share wording but have different supported root causes
- **THEN** retro SHALL keep them in separate recurrence groups

### Requirement: Learning records remain privacy-safe
Prevention Signals, local fallback records, OpenSpec artifacts, and reusable candidates SHALL not contain secrets, credentials, raw private prompts, raw transcripts, unbounded logs, or source content copied solely for feedback. Cross-project records SHALL use bounded summaries, relative references when safe, hashes, and opaque signal ids.

#### Scenario: Evidence contains a suspected secret
- **WHEN** source evidence appears to contain a credential or sensitive value
- **THEN** the signal SHALL exclude and redact that value
- **AND** it SHALL retain only a safe evidence category or reference

### Requirement: Learning metrics measure SDLC return reduction
Learning reports SHALL measure first-pass acceptance, return edges by stage pair, invalidated gate replays, repeated recurrence ids, affected project counts, instruction budget, and replay outcomes. Complaint count alone SHALL not be presented as the success metric.

#### Scenario: More signals are captured after rollout
- **WHEN** signal count rises because capture becomes reliable
- **THEN** the system SHALL not classify that increase alone as process regression
- **AND** it SHALL evaluate return and replay metrics separately
