## ADDED Requirements

### Requirement: Parent campaigns hand off one exact frozen mission
The roadmap mission SHALL accept an optional versioned parent-campaign correlation
containing the campaign id and definition digest, frozen wave id and digest, ordered
work-item refs, expected campaign transition, and parent evidence location. When this
correlation is present, mission preflight SHALL verify that its exact ordered slices,
dependencies, owned paths, outcomes, effects, and parent refs match the frozen wave
before a model, session, source writer, archive, or checkpoint starts.

The mission SHALL remain immutable after launch and SHALL NOT read campaign report
prose, discover work items, regroup findings, alter campaign phase, generate another
wave, or launch a successor mission after its declared slices are exhausted.

#### Scenario: Campaign-produced mission matches its frozen wave
- **WHEN** the parent campaign and mission definitions are current and every ordered slice matches the durable frozen wave
- **THEN** ordinary mission preflight may return the first eligible slice
- **AND** subsequent execution uses the existing serialized propose/apply/archive/checkpoint lifecycle unchanged.

#### Scenario: Frozen wave and mission differ
- **WHEN** any work-item ref, slice, dependency, owned path, outcome, effect, order, or digest differs between the mission and parent campaign records
- **THEN** mission preflight blocks before session creation or mutation
- **AND** neither side is rewritten automatically to match the other.

### Requirement: Campaign and mission ownership remain separated and correlated
The mission SHALL remain the sole source-mutation owner while a frozen wave is active.
Campaign observation state MAY be written only under a separate non-overlapping
runtime owner and SHALL NOT grant source, OpenSpec, archive, checkpoint, session, or
mission-state mutation authority. Mission launch SHALL record the parent transition
and process/session refs, and its terminal result SHALL expose one bounded correlated
handoff containing disposition, writer and cleanup closure, checkpoint, archives,
evidence refs, definition/wave digests, and retry/owner condition.

The parent campaign SHALL NOT consume that handoff as terminal while mission writer,
session, process, cleanup, checkpoint, or correlation is unknown. Mission run/resume/
status/stop SHALL remain usable without a parent campaign and preserve existing manual
behavior.

#### Scenario: Mission completes one parent wave
- **WHEN** all declared slices archive and checkpoint with terminal writer and cleanup closure
- **THEN** the mission emits one correlated completed-wave handoff for the exact parent campaign transition
- **AND** only the parent campaign may decide whether verification or another wave follows.

#### Scenario: Parent campaign process disappears
- **WHEN** the campaign controller exits while a correlated mission remains active
- **THEN** the mission continues or stops only under its own existing lifecycle and stop policy
- **AND** it does not infer parent completion, start another mission, or release unknown source ownership.
