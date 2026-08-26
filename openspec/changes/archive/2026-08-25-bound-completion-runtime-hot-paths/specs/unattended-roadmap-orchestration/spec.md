## ADDED Requirements

### Requirement: Every synchronous mission command has a finite timeout
Every synchronous child process invoked by roadmap preflight, checkpoint, Git/OpenSpec inspection, validation, or finalization SHALL receive an explicit finite timeout from a reviewed command class. Defaults SHALL be 30 seconds for read-only inspection, 120 seconds for Git mutation and OpenSpec operations, and 600 seconds for project validation/finalization. A project adapter MAY set validation/finalization from 1 second through 1800 seconds. No production caller SHALL pass an undefined or infinite timeout. Timeout SHALL terminate only the owned process tree, preserve argv identity, signal/status, bounded stdout/stderr, original timeout cause, and cleanup state, then pause or block the affected mission without retrying an unchanged command automatically.

#### Scenario: Git inspection hangs
- **WHEN** a Git inspection fixture exceeds its command-class timeout
- **THEN** the owned process tree is terminal before the controller returns
- **AND** the mission records a timeout failure without advancing state

#### Scenario: Validation needs a longer bound
- **WHEN** an adapter declares a valid validation timeout within the supported maximum
- **THEN** the controller applies that explicit value
- **AND** all other command classes retain their reviewed defaults

#### Scenario: Timeout cleanup is unknown
- **WHEN** the runner cannot prove the timed-out process tree is terminal
- **THEN** writer ownership remains blocked
- **AND** no checkpoint, retry, proof, or qualification proceeds
