## ADDED Requirements

### Requirement: All project missions share one project-scoped mutation lease
Before any campaign-produced Roadmap Mission creates a mutation-capable session, it SHALL acquire one project-scoped lease shared across campaign ids, mission ids, playbooks, and host supervisors for the canonical Git root. The lease SHALL correlate project/candidate/process/session/campaign/mission identities and remain held until source writer and cleanup ownership are terminal or project write authority is isolated. A dirty-tree check without this lease SHALL not establish exclusive writer ownership.

#### Scenario: Audit and Kaizen campaigns start from one clean project
- **WHEN** two different campaign/playbook identities concurrently pass read-only preflight for the same canonical root
- **THEN** exactly one acquires the project-scoped mutation lease and may create a writer session
- **AND** the other persists an ownership gate without relying on its own campaign- or mission-scoped lock.

### Requirement: Kaizen missions use one visible owner-project root session
When a mission carries Kaizen parent correlation, its mutation-capable executor SHALL create one ordinary root session on the exact authenticated managed OpenCode server and session store used by the user's UI, with `directory` equal to the registered project root. The title and metadata SHALL expose bounded project, Grind run/cycle, execution-record, signal, campaign, mission, slice, change, phase, attempt, and writer refs. The same root session SHALL execute canonical proposal and apply commands for one change; correlated read-only reviewers MAY use child sessions.

Preflight SHALL prove the managed runtime, data/session store, project root, parentage, current session list, commands, global source, project instructions, and collision state before launch. A separately isolated or hidden runtime MAY be used for tests but SHALL NOT satisfy production session visibility.

#### Scenario: Kaizen mission launches development
- **WHEN** the correlated project mission passes preflight against the managed runtime
- **THEN** one ordinary root session appears in that project's normal session list with current bounded correlation metadata
- **AND** proposal and apply execute in that same session rather than an invisible worker-only store.

#### Scenario: Managed session identity is uncertain
- **WHEN** the executor cannot prove that the API endpoint and UI use the same runtime and session store
- **THEN** mission launch blocks before session creation or project mutation
- **AND** an isolated proof server or successful API response is not substituted for user-visible production identity.

### Requirement: User takeover transfers one writer safely
The mission SHALL expose a correlated takeover operation for an active Kaizen root session. A takeover request SHALL stop new executor commands, record parent/controller and mission stop intent, and wait until automation process/session/source-writer/cleanup ownership is terminal or its project write authority is isolated before recording user ownership. Unexpected human input in an automation-owned active session SHALL trigger the same fail-closed takeover reconciliation.

Submitting human input while an executor request is in flight SHALL immediately request abort or isolate that request's project write authority. Session abort acknowledgement, non-busy API status, timeout, cancellation acknowledgement, or missing PID alone SHALL remain unknown and SHALL not transfer ownership.

Opening or reading the session SHALL not request takeover. After transfer, automation SHALL NOT resume, checkpoint, archive, commit, or launch a replacement writer until a later explicit correlated return/resume preflight proves user ownership closed and the project candidate is current.

#### Scenario: User observes without input
- **WHEN** the user opens an automation-owned session and submits no message or command
- **THEN** ownership and automatic execution remain unchanged
- **AND** session status and conversation remain visible.

#### Scenario: User submits input during automation
- **WHEN** a new human message appears in an automation-owned active session
- **THEN** the executor launches no subsequent automatic command and begins correlated takeover closure
- **AND** neither user nor automation is represented as sole writer until closure or isolation is proven.

#### Scenario: User returns work to automation
- **WHEN** a user-owned session is terminal or explicitly returned and project/session/candidate/cleanup identities pass current preflight
- **THEN** mission may resume from the first incomplete durable lifecycle boundary
- **AND** it does not repeat a completed propose, apply, archive, or commit transition.
