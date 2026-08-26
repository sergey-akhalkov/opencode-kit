## ADDED Requirements

### Requirement: Autonomous campaign tooling has a portable deterministic core
The shipped autonomous campaign core SHALL accept explicit project, global-source,
campaign-definition, adapter, and operation inputs; emit versioned stable machine-
readable output; use argument-vector process invocation with finite timeouts; and
contain no consumer checkout name, absolute maintainer path, package manager, product
rubric, validation command, provider credential, Windows path, or host installation
assumption. Project-specific validation, scope, rubric, checkpoint, and authority
SHALL remain in contained project definitions/adapters. Host lifecycle SHALL remain a
thin adapter around the same core.

#### Scenario: Unrelated project uses the campaign core
- **WHEN** a disposable project with a different build system supplies a valid campaign definition and validation argv
- **THEN** the same core performs provider-free preflight and returns its exact current phase
- **AND** no opencode-kit package script, project name, or workstation path is required.

### Requirement: Campaign helpers materialize explicit facts without semantic inference
Deterministic campaign helpers SHALL validate schemas, paths, inventories, digests,
stable ids/order, state transitions, coverage counts, refs, severity enum values,
producer identities, effect declarations, DAGs, mission correlation, validation
results, and report projections. They SHALL report missing, unreadable, unsupported,
stale, ambiguous, or mismatched facts as explicit non-complete states and SHALL NOT
infer scope, severity, materiality, reachability, cause, work-item confirmation,
remediation grouping, proof quality, or campaign completion from prose, file names,
similarity, scores, aggregate counts, or model output.

Seed records SHALL be the single reviewed source for derived indexes, totals, report
sections, hashes, and order. Generated projections SHALL receive regeneration and
drift checks instead of becoming manually maintained independent variants.

#### Scenario: Report is regenerated from current seed records
- **WHEN** a reviewed work-item seed changes status and the report materializer runs
- **THEN** every affected index, total, section, and digest is deterministically updated in stable order
- **AND** helper code does not rewrite the finding narrative or decide its severity.

#### Scenario: Semantic result omits a required evidence ref
- **WHEN** a discovery or reconciliation result lacks a schema-required candidate, source, producer, or evidence identity
- **THEN** the helper marks the row non-admissible with the missing field
- **AND** it does not infer the ref from transcript or nearby files.

### Requirement: Campaign runtime owners are cohesive and non-overlapping
Portable campaign definition/contracts, append-only state and leases, phase controller,
semantic-root executor, mission handoff, ledger/report materialization, and controller
process/adapter responsibilities SHALL have explicit cohesive owners. The campaign
implementation SHALL reuse existing portable process, OpenSpec gate/archive, roadmap
mission, session-delivery, and evidence/proof libraries rather than copy their process,
writer, archive, configured-session, redaction, or cleanup mechanisms.

A host adapter MAY supervise the campaign process and selected OpenCode runtime but
SHALL NOT contain campaign phase, work-item, severity, wave, mission, or completion
semantics. If a touched current file already mixes responsibilities, the change SHALL
extract one campaign/host responsibility or record a current main-owned
`split-or-justify`; it SHALL NOT add the responsibility to a workstation or mission
god file for convenience.

#### Scenario: Windows host recovery is added
- **WHEN** the first host adapter needs logon, process identity, protected material, and restart integration
- **THEN** it invokes the portable campaign status/resume/stop boundary with explicit campaign refs
- **AND** campaign policy and mission execution remain outside the workstation lifecycle owner.

### Requirement: Campaign proof tooling is replayable and discoverable
The repository SHALL maintain one project-neutral campaign proof family under
`tools/proofs/` that exercises provider-free schema/state/report paths, bounded
configured semantic partitions, actual OpenSpec mission handoff, Windows supervisor
re-entry, interruption, protected stop, and cleanup. Its inventory entry SHALL state
exact invocation, candidate/environment identity, model and host effects, immutable raw
bundle, evaluator/replay modes, restoration, cleanup, and maximum claim.

After a configured, host, or long-running attempt fails in evaluator/finalization,
the proof family SHALL replay the complete reachable non-side-effecting chain from the
preserved bundle before another unchanged live attempt. Provider-free replay SHALL NOT
claim a required live process, checkpoint, restoration, or host effect occurred.

#### Scenario: Preserved campaign bundle is replayed
- **WHEN** a configured campaign capture reaches source effects but its report evaluator fails
- **THEN** the evaluator and every reachable non-side-effecting finalization check can replay the immutable bundle to a terminal result
- **AND** another live capture remains blocked until replay is green or names the exact missing raw observation.
