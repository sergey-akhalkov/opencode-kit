## ADDED Requirements

### Requirement: Beads installation is pinned, explicit, protected, and reversible
The Windows workstation SHALL provide preview, disposable-spike, install, check, and rollback operations for the reviewed Beads `v1.2.2` Windows amd64 archive and exact checksum. Preview SHALL show source URL, version, platform, digests, protected destination, profile/config effects, project-registration envelope, rollback ownership, and required restart boundary without downloading, executing, installing, or activating the tool. The disposable spike SHALL use a proof-owned temporary root and isolated environment before protected installation is eligible.

Installed executable, release manifest, registration, adapter closure, bridge-lock artifact, and rollback metadata SHALL be derived from version-controlled kit source and stored under the existing protected workstation lifecycle so unelevated processes cannot replace them. The workstation lifecycle SHALL own the protected bridge-lock artifact's storage, identity, and deletion. Install SHALL NOT initialize a project, edit OpenCode configuration directly, enable a runtime profile, restart OpenCode, install a task/service/hook, configure a remote, or start a persistent process. Check and rollback SHALL verify exact installed identities and preserve drift, project data, and unrelated workstation state. Before rollback removes or revokes managed material referenced by a project registration, it SHALL acquire the same bridge-writer lease used by project mutations and prove every child `bd`/Dolt writer terminal or write-isolated. A held lease or unknown writer liveness SHALL preserve the lock and every referenced managed item and return a partial unknown result.

#### Scenario: Preview inspects the selected release
- **WHEN** a maintainer invokes Beads install preview from current kit source
- **THEN** it reports the pinned archive identity, protected destination, expected derived artifacts, activation prerequisites, and rollback plan without host mutation
- **AND** it does not download, execute, initialize, configure, or start Beads.

#### Scenario: Disposable spike fails
- **WHEN** version, checksum, command capability, embedded Dolt, concurrency, recovery, Git-effect, or cleanup proof fails in the isolated root
- **THEN** protected install and project activation remain ineligible
- **AND** diagnostics preserve the exact failed invocation, effects, process state, and cleanup result.

#### Scenario: Protected installation succeeds
- **WHEN** the disposable spike is green and the maintainer invokes install with the exact reviewed asset
- **THEN** only the matching executable and derived protected manifest/adapter material are installed and read back
- **AND** no OpenCode process, project, profile, hook, task, service, remote, or unrelated package is changed.

#### Scenario: Installed identity drifts before rollback
- **WHEN** rollback finds a managed executable, manifest, registration, adapter, or profile artifact whose current identity differs from its install record
- **THEN** it preserves that item and reports the drift
- **AND** removes no project evidence or unrelated machine material to force completion.

#### Scenario: Writer closure is unknown before rollback
- **WHEN** rollback targets registration-referenced managed material and the bridge lease is held or child writer closure cannot be proven
- **THEN** it preserves the lock and all referenced binary, profile, adapter, config, and registration material and reports rollback as partial and unknown
- **AND** it does not infer safety from timeout, cancellation acknowledgement, elapsed time, or an absent process identifier.

### Requirement: Project activation is separate from workstation installation
The workstation SHALL keep binary installation, exact full `core-beads` profile materialization, and project registration/activation as three explicit operations with independent current status. A successful binary install SHALL not imply that a running OpenCode process discovered the bridge or that any project contains a Beads store. A successful profile materialization SHALL require a fresh OpenCode process before loader availability is claimed. A successful project enablement SHALL remain confined to the one registered pilot root.

#### Scenario: Binary is installed but profile is absent
- **WHEN** the protected executable passes check while the optional Beads profile is not selected
- **THEN** workstation status reports the binary available and the OpenCode bridge unavailable
- **AND** no project activation or always-loaded instruction is inferred.

#### Scenario: Profile changes while OpenCode is running
- **WHEN** the full `core-beads` profile is materialized after an OpenCode process has started
- **THEN** that existing process is not claimed to have discovered the bridge
- **AND** validation uses a fresh proof-owned OpenCode process without stopping or reconfiguring user-owned processes.
