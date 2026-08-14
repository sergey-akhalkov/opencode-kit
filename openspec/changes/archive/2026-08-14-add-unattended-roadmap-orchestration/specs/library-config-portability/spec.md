## MODIFIED Requirements

### Requirement: Completion guard options use schema-valid plugin configuration
The portable global config and installer SHALL configure the completion guard through an official plugin tuple and supported option values. Defaults SHALL include default-off per-root grind mode, the hidden arbiter name, finite continuation and retry limits suitable for recovery, one configured model, exponential retry capped by delay and attempt count, bounded arbiter prompt timeout, bounded wait recheck, bounded final request bytes, finite retained-child policy, per-session strategy fallback, and status/toast reporting. The plugin SHALL register `/enable-grind` and `/disable-grind` through its supported config hook; the config SHALL NOT add unsupported OpenCode top-level fields. Startup SHALL verify the installed client capabilities required by the enabled guard, including official question reply APIs, and SHALL fail closed on a missing capability.

The maintained proof inventory SHALL include one installed-runtime autonomous-question runner that records OpenCode, plugin source, SDK, agent/model route, question event, official reply, original tool continuation, terminal root state, diagnostics, and cleanup. A private controller call, mocked SDK adapter, owner-only question fixture, or model response without a real question tool event SHALL not satisfy that runtime boundary.

#### Scenario: Portable config is validated
- **WHEN** the global template containing the guard plugin tuple is checked against the current OpenCode schema and live loader
- **THEN** OpenCode SHALL start without `ConfigInvalidError`
- **AND** every guard option SHALL be inside the plugin tuple with a supported value.

#### Scenario: Commands are loaded
- **WHEN** OpenCode starts with the enabled guard plugin
- **THEN** command inventory SHALL include `/enable-grind` and `/disable-grind` with bounded confirmation templates
- **AND** the presence of those commands SHALL NOT enable grind for any root.

#### Scenario: Question reply capability is unavailable
- **WHEN** OpenCode starts with the enabled guard plugin
- **AND** the installed SDK/client lacks a required session, question reply, event, or tool capability
- **THEN** the guard SHALL fail startup with an actionable capability mismatch
- **AND** it SHALL not reject the question, invoke an arbiter, or inject a continuation.

#### Scenario: Installed autonomous-question proof runs
- **WHEN** the maintained runner uses a disposable root with the actual loaded guard and a real interactive question tool request
- **THEN** the guard SHALL select only a validated offered label through the official reply API, resume the original tool call, preserve synthetic provenance, and reach a terminal correlated audit
- **AND** the runner SHALL preserve stdout, stderr, status/log evidence, and environment identity
- **AND** it SHALL delete its root and child sessions in `finally`.

## ADDED Requirements

### Requirement: Runtime diagnostics expose unattended workflow and guard identity
Privacy-safe runtime diagnostics SHALL report resolved standard OpenSpec command/skill locations, project same-name collisions, mission-controller/helper identities, relevant finite guard limits, active guard plugin origin, and whether startup/recovery capability checks passed. They SHALL not print prompts, provider options, credentials, mission payload values, or sensitive command output.

#### Scenario: Target project has stale overlays
- **WHEN** runtime diagnostics inspect a target project with same-name OpenSpec project and global sources
- **THEN** diagnostics identify each safe location and unattended collision status
- **AND** they do not claim precedence from source presence alone.
