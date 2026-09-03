## Purpose

Provides one opt-in machine-local portfolio graph for admitted work while preserving Kaizen evidence, OpenSpec semantics, current-session gates, and source-writer authority.

## ADDED Requirements

### Requirement: The bridge uses one exact supported Beads release
The capability SHALL accept only the reviewed Beads `v1.2.2` Windows amd64 release archive whose SHA-256 is `1f00c29cd9599e182a4a4e829f5210daca2da14155920aee2836d8bc613b2feb`. Preview, spike, install, check, and execution SHALL verify version, platform, archive digest, extracted executable identity, and required command capabilities before trusting the binary. Repository source presence SHALL NOT download, execute, install, or activate Beads.

The capability SHALL treat online documentation, release notes, and generated vendor instructions as navigation rather than runtime capability evidence. It SHALL NOT rely on work leases, events journal, federation, HTTP server, or another feature absent from the selected recovery release.

#### Scenario: Selected release is verified
- **WHEN** the reviewed Windows archive is supplied to the disposable spike or installer
- **THEN** archive digest, executable identity, `bd version`, and required command help are read back before any project initialization
- **AND** a mismatch fails before protected installation, profile mutation, or project effects.

#### Scenario: Online documentation describes a newer feature
- **WHEN** current documentation names a command or behavior not observed from the pinned executable
- **THEN** the bridge reports that capability as unavailable
- **AND** does not synthesize, emulate, or silently route through that feature.

### Requirement: Project activation is explicit, bounded, and local
The bridge SHALL remain disabled until one exact machine-local registration enables one canonical Git root, one semantic owner class from `current-project | opencode-kit`, one derived privacy-safe project ref, and one unique safe Beads prefix. This increment SHALL accept at most one enabled project registration. Activation SHALL use embedded project-local Dolt and non-interactive initialization with agent-file and Git-hook setup skipped, auto-export and auto-staging disabled, and no configured remote, shared server, federation, or global `BEADS_DIR`.

Before activation, the bridge SHALL require the exact observed Beads/Dolt ignore block within the project's existing tracked `.gitignore` without requiring or replacing the project's complete file identity. Before and after activation, the bridge SHALL inspect the canonical root, whole tracked Git bytes, index, worktree, hooks, remotes, relevant Git config, `.git/info/exclude`, and created `.beads` paths. It SHALL accept only the reviewed local Beads data and exclude effects and SHALL fail closed on an unexpected tracked, hook, remote, config, instruction, or external-path mutation.

#### Scenario: One clean project is enabled
- **WHEN** the disposable spike passed and an explicit registration selects one clean canonical Git root and unused prefix
- **THEN** the bridge initializes one embedded project-local Beads store with skipped agents and hooks
- **AND** tracked Git bytes, existing hooks, remotes, loaded OpenCode instructions, and unrelated files remain unchanged.

#### Scenario: A second project is requested
- **WHEN** an enabled pilot registration already exists and activation targets another root
- **THEN** activation fails before invoking Beads or modifying either project
- **AND** reports that multi-project adoption is outside `BPB-001`.

#### Scenario: Initialization produces an unexpected effect
- **WHEN** initialization writes a tracked file, agent instruction, hook, remote, auto-export, auto-stage setting, or path outside the reviewed project-local envelope
- **THEN** activation reports the exact effect and remains disabled
- **AND** rollback removes only attributable matching effects while preserving drift and unrelated work.

### Requirement: The vendor adapter exposes bounded Beads operations rather than lifecycle orchestration
The vendor adapter SHALL invoke the pinned executable directly without a shell and with an explicit canonical working directory. It SHALL expose only closed Beads operations required by project check/enable/disable, bounded list/ready/show, atomic create-feature, exact add-dependency/update-feature, assign-feature, and close-feature. Inputs SHALL use closed schemas and privacy-safe refs; output SHALL be bounded, schema-versioned JSON with executable/root identity, exit status, safe stdout/stderr facts, side effects, and diagnostics.

The adapter SHALL NOT install or roll back the executable/profile, select Kaizen eligibility, write a Kaizen lifecycle transition, decide OpenSpec terminal state, accept arbitrary argv or shell fragments, pass through raw issue payloads, invoke remote operations, install hooks or agent setup, run `bd prime` or `bd setup opencode`, activate MCP, perform destructive repair, or emit unbounded output. The workstation owner SHALL own binary install/check/rollback and the Kaizen owner SHALL own promote/link/terminal orchestration that calls the adapter. Read-only status and check SHALL remain provider-free and SHALL not mutate project or Beads state.

#### Scenario: Agent requests ready work
- **WHEN** the enabled project invokes bridge ready with a valid bounded limit
- **THEN** the adapter returns the pinned CLI identity and stable bounded Beads refs, status, priority, dependency, assignee, and truncation facts
- **AND** performs no source, Kaizen, OpenSpec, hook, config, remote, or lifecycle mutation.

#### Scenario: Arbitrary Beads command is supplied
- **WHEN** an invocation supplies an unsupported operation or free-form argv
- **THEN** the adapter rejects it before starting `bd`
- **AND** reports the unsupported operation without executing a shell fallback.

### Requirement: Eligible Kaizen evidence creates one recoverable Beads feature
Only one current evidence-triaged Kaizen decision with a known owner and matching enabled registration SHALL be eligible for promotion. A `project-change` SHALL require `ownerClass=current-project` and the enabled registration's derived `projectRef` in the signal's recorded project refs. A `kit-candidate` SHALL require `ownerClass=opencode-kit` and an enabled registration whose semantic owner class is `opencode-kit`; the triaging session's project ref alone SHALL not establish either match. Promotion SHALL acquire one project-scoped bridge-writer lease outside `.beads`, query open and closed Beads states for an exact bridge schema, `kaizenSignalRef`, `projectRef`, and decision correlation, and create one feature only when no match exists. One match SHALL be reused; more than one SHALL fail as a duplicate-correlation repair gate.

The Beads feature SHALL hold privacy-safe signal, decision, project, and later OpenSpec change refs in exact metadata plus a stable external reference. The initial external ref and complete create-time bridge metadata SHALL be committed by the same observed `bd create` operation; if the pinned release cannot provide that atomic boundary, promotion SHALL remain unsupported. The feature SHALL not store absolute consumer roots, transcripts, credentials, raw session content, or signal occurrence details beyond the bounded reviewed feature context. Beads creation and readback SHALL complete before Kaizen transitions to `promoted` with the Beads ref. A repeated invocation or lost create response SHALL recover the existing feature rather than create another.

#### Scenario: Eligible signal is promoted
- **WHEN** one eligible triaged signal has no exact Beads correlation and the bridge writer lease is clear
- **THEN** one feature is atomically created and read back with its external ref and complete exact privacy-safe correlation
- **AND** only after that readback does Kaizen transition to promoted with the returned Beads ref.

#### Scenario: Create response is lost
- **WHEN** Beads commits the feature but the bridge stops before returning or promoting the Kaizen signal
- **THEN** the next invocation finds exactly one correlation and reuses its full Beads ID
- **AND** creates no duplicate before completing the missing Kaizen transition.

#### Scenario: Two correlations exist
- **WHEN** exact lookup returns more than one Beads item for the same signal and project identity
- **THEN** promotion and downstream dispatch fail with a duplicate-correlation diagnostic
- **AND** no candidate is selected, closed, merged, or deleted automatically.

#### Scenario: Kit candidate originated in a consumer project
- **WHEN** a consumer-project signal is triaged as `kit-candidate`, the enabled registration is the `opencode-kit` owner, and the triaging session has a different project ref
- **THEN** eligibility uses the `opencode-kit` owner class and enabled registration rather than requiring the triage-session project ref to match
- **AND** the consumer project remains evidence rather than a hidden second portfolio root.

#### Scenario: Project change belongs to another project
- **WHEN** a `project-change` signal's recorded project refs do not contain the enabled registration's derived project ref
- **THEN** promotion fails as a project-owner mismatch
- **AND** does not admit the signal into the enabled project's Beads store.

#### Scenario: Signal frequency increases
- **WHEN** another occurrence raises the Kaizen signal count or another agent adds evidence
- **THEN** the existing Beads feature remains the one admitted identity and the current evidence may be displayed
- **AND** count, source cardinality, and agent statements do not change priority, readiness, admission, or mutation authority automatically.

### Requirement: Dependencies and readiness are coarse portfolio projections
The bridge SHALL use only the pinned `blocks`, `parent-child`, and `supersedes` dependency types for admitted coarse portfolio work. A `supersedes` relation SHALL require an explicit evidence-confirmed semantic-identity predicate; the bridge SHALL NOT infer duplicates. It SHALL NOT mirror OpenSpec tasks, `grind_frontier` items or gates, Campaign waves, Mission slices, validation steps, or runtime proof records into Beads.

A Beads-ready item SHALL remain advisory until the current root independently establishes accepted scope, protected gates, current project identity, OpenSpec state, and source-writer authority. A blocked or stale Beads item SHALL not relabel an independently current OpenSpec or writer state.

#### Scenario: Beads reports an item ready
- **WHEN** the pinned CLI reports an admitted feature has no active Beads blockers
- **THEN** the bridge exposes it as portfolio-ready
- **AND** does not start source work or clear a current product, safety, capability, live-attempt, or writer-liveness gate.

#### Scenario: OpenSpec contains implementation tasks
- **WHEN** a linked OpenSpec change defines its own task dependency graph
- **THEN** that graph remains canonical inside OpenSpec and the current session frontier
- **AND** no Beads child item is generated merely to mirror those tasks.

### Requirement: OpenSpec linking is exact, idempotent, and recoverable
The Kaizen-side bridge orchestrator SHALL link one canonical Beads feature to one OpenSpec change only while project ref, change ref, Beads correlation metadata, and current project root agree. The same bridge-writer lease used for promotion and close SHALL cover lookup, exact update, and readback. Repeating the same link after a lost response SHALL return the existing link without another mutation. An existing different `spec_id`, `changeRef`, project ref, or multiple exact correlation SHALL fail before overwrite or terminal projection.

#### Scenario: Change link response is lost
- **WHEN** Beads commits the exact `spec_id` and `changeRef` but the orchestrator stops before returning
- **THEN** the next link invocation reads back and returns the same project/change association
- **AND** does not create another feature or overwrite the existing link.

#### Scenario: Feature is already linked to another change
- **WHEN** a link invocation names a change that differs from the feature's exact existing project/change association
- **THEN** linking and close remain blocked with a mismatch diagnostic
- **AND** neither Beads nor OpenSpec metadata is rewritten automatically.

### Requirement: Assignment never grants writer authority
The Kaizen-side bridge orchestrator MAY use the vendor adapter to set one bounded assignee plus privacy-safe OpenCode child task/session refs on an admitted Beads item. Assignment SHALL represent coordination only. Production use of atomic Beads claim is excluded from this increment; claim SHALL be exercised only in the disposable contention proof because the pinned release has no accepted work-lease recovery contract.

Before source mutation, the active primary SHALL still acquire and verify the existing Campaign/Mission or direct-main writer authority required by the accepted workflow. Missing, stale, conflicting, or unknown source-writer evidence SHALL block mutation without rewriting Beads assignment as completion or failure.

#### Scenario: Feature is assigned to an agent
- **WHEN** main assigns an admitted feature to one bounded child task/session identity
- **THEN** Beads records the assignee and privacy-safe refs for coordination
- **AND** no source file, OpenSpec artifact, provider, protected host state, or remote state becomes writable by that assignment.

#### Scenario: Assigned agent lacks a source-writer lease
- **WHEN** the assigned item is portfolio-ready but current writer authority is absent or unknown
- **THEN** source execution remains blocked at the existing owner boundary
- **AND** the Beads item remains open with the exact gate rather than being treated as claimed execution authority.

### Requirement: Terminal projection is fail closed and ordered
A Beads item linked to an OpenSpec change SHALL close only after the bridge verifies the exact project, change identity, completed accepted tasks, canonical runtime proof, applicable validation, successful archive identity, terminal source-writer/cleanup ownership, and no undeclared external effect. The bridge SHALL close Beads before transitioning the correlated Kaizen signal to `resolved`, so interruption can leave a repairable closed-item/unresolved-signal state but never a resolved signal with an open or unproved item.

Missing, stale, conflicting, truncated acceptance-critical, or unknown terminal evidence SHALL leave the Beads item open and Kaizen signal unresolved. Reconciliation SHALL be idempotent and SHALL not repeat archive, source mutation, commit, or proof to repair projection state.

#### Scenario: Linked change completes with current evidence
- **WHEN** the exact linked OpenSpec change is archived after current proof and validation and all writer/cleanup ownership is terminal
- **THEN** the bridge closes the canonical Beads feature and then resolves the correlated Kaizen signal
- **AND** records only privacy-safe terminal refs without replaying implementation effects.

#### Scenario: Close succeeds but Kaizen transition is interrupted
- **WHEN** Beads closes the item and the bridge stops before resolving the signal
- **THEN** reconciliation recognizes the same closed correlated item and appends only the missing Kaizen resolution
- **AND** does not create, reopen, reimplement, rearchive, or close another item.

#### Scenario: Terminal evidence is incomplete
- **WHEN** the linked change lacks current proof, validation, archive, or writer-closure evidence
- **THEN** close fails with the exact missing boundary
- **AND** the Beads item remains open and the Kaizen signal remains unresolved.

### Requirement: Disable and rollback preserve evidence and unrelated state
Disable SHALL prevent new bridge writes and promotion while retaining read-only status for the exact installed binary, registration, store, correlation, and open repair gates. The bridge-writer lease SHALL live under protected workstation-owned project state outside `.beads`, SHALL serialize every project-local Beads mutation including enable/disable/rollback coordination, and SHALL not be released while its child `bd`/Dolt writer is live, of unknown liveness, or not write-isolated. The workstation lifecycle SHALL be the sole owner of the lock artifact's protected storage, identity, and deletion. Disable SHALL report unknown rather than disabled-safe while a bridge-writer process or project-local Dolt write may still be active. The workstation's binary/profile rollback and the bridge's project disable SHALL remain separate owner operations, but any rollback that would remove or revoke binary, profile, adapter, config, registration, or lock material referenced by a project registration SHALL acquire the same bridge-writer lease first. If the lease is held or writer liveness is unknown, rollback SHALL preserve the lock and every referenced managed item and SHALL report a partial unknown result. Otherwise rollback SHALL remove only matching kit-installed material and attributable project enablement effects after exact identity checks. It SHALL preserve Beads history, Kaizen records, OpenSpec artifacts, project source, and unrelated machine state.

Diagnostics SHALL preserve the original local process, filesystem, Git, schema, Dolt, CLI, correlation, OpenSpec, or Kaizen cause once at its owning boundary without printing credentials, absolute consumer roots in shared output, signal payloads, or unrelated issue content.

#### Scenario: Disable runs with no active writer
- **WHEN** the enabled project has no active or unknown bridge writer
- **THEN** new promote, assign, link, and close operations are rejected while bounded status remains available
- **AND** existing Beads, Kaizen, OpenSpec, and project evidence remains unchanged.

#### Scenario: Rollback encounters drift
- **WHEN** a managed binary, profile artifact, registration, exclude entry, or project-local enablement identity no longer matches its install record
- **THEN** rollback preserves the drifted item and reports it for exact disposition
- **AND** does not delete, overwrite, reset, restore, or clean unrelated work.

#### Scenario: Workstation rollback encounters an active or unknown bridge writer
- **WHEN** rollback would remove registration-referenced managed material while the bridge lease is held or a child `bd`/Dolt writer is live, of unknown liveness, or not write-isolated
- **THEN** rollback preserves the lock plus every referenced binary, profile, adapter, config, and registration item and reports a partial unknown result
- **AND** performs no forced lock deletion, stale takeover, project disable claim, or referenced-material cleanup.

### Requirement: Context-cost claims use matched outcome evidence
The bridge SHALL keep complete workflow guidance on demand and SHALL not inject Beads command reference, `bd prime` output, or managed vendor instruction blocks into default startup context. Any claim that the bridge reduces context or tool use SHALL compare the current Kaizen/OpenSpec workflow and candidate bridge with the same model/profile, permissions, environment, initial state, accepted outcome, proof, safety, diagnostics, and cleanup oracles.

The candidate SHALL receive no improvement credit when it loses a required fact, weakens an owner boundary, increases any maintained friction field, or lacks current comparable samples. A neutral or worse result SHALL remain truthful evidence and SHALL not block the functional one-project claim.

#### Scenario: Candidate reduces one matched workflow cost
- **WHEN** matched baseline and bridge runs satisfy every outcome and safety oracle and at least one maintained scenario uses fewer total tool calls without another friction regression
- **THEN** the result may claim only that observed scenario and candidate/environment identity
- **AND** does not generalize to all projects, agents, models, or token usage.

#### Scenario: Candidate uses fewer calls but loses authority evidence
- **WHEN** the bridge loads less context but omits a current gate, proof, validation, or writer fact
- **THEN** context-improvement evaluation fails
- **AND** the functional result is assessed independently at its narrower claim boundary.
