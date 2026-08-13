## MODIFIED Requirements

### Requirement: Completion guard options use schema-valid plugin configuration
The portable global config and installer SHALL configure the completion guard through an official plugin tuple and supported option values. Defaults SHALL include default-off per-root grind mode, the hidden arbiter name, `maxCycles: -1`, single-model exponential retry, per-session docs fallback, retain-all audit sessions, and status/toast reporting. The plugin SHALL register `/enable-grind` and `/disable-grind` through its supported config hook; the config SHALL NOT add unsupported OpenCode top-level fields. Startup SHALL verify the installed client capabilities required by the enabled guard, including official question reply and reject APIs, and SHALL fail closed on a missing capability.

The maintained proof inventory SHALL include one installed-runtime autonomous-question runner that records OpenCode, plugin source, SDK, agent/model route, question event, official reply, original tool continuation, terminal root state, diagnostics, and cleanup. A private controller call, mocked SDK adapter, owner-only question fixture, or model response without a real question tool event SHALL not satisfy that runtime boundary.

#### Scenario: Portable config is validated
- **WHEN** the global template containing the guard plugin tuple is checked against the current OpenCode schema and live loader
- **THEN** OpenCode SHALL start without `ConfigInvalidError`
- **AND** the plugin SHALL receive the documented option object.

#### Scenario: Commands are loaded
- **WHEN** OpenCode starts with the enabled guard plugin
- **THEN** command inventory SHALL include `/enable-grind` and `/disable-grind` with bounded confirmation templates
- **AND** the presence of those commands SHALL NOT enable grind for any root.

#### Scenario: Question reply capability is unavailable
- **WHEN** the loaded OpenCode client does not expose the official question reply method required for autonomous selection
- **THEN** the guard SHALL fail startup with an actionable capability mismatch
- **AND** it SHALL not silently fall back to rejecting questions.

#### Scenario: Installed autonomous-question proof runs
- **WHEN** the maintained runner uses a disposable root with the actual loaded guard and a real interactive question tool request
- **THEN** evidence SHALL show an exact offered label returned through the official reply boundary and observed by the original tool caller without human input
- **AND** the runner SHALL preserve stdout, stderr, status/log evidence, environment identity, and terminal cleanup.
