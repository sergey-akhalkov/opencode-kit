## MODIFIED Requirements

### Requirement: Core and all expose one Kaizen lifecycle surface
The maintained `core` and `all` runtime profiles SHALL include the canonical `complain` routing, Kaizen status and triage commands, `/enable-kaizen-grind`, `/disable-kaizen-grind`, `/kaizen-grind-status`, and the complete self-contained plugin/controller command closure required by the configured global entry point. Profile resolution SHALL include each portable owner exactly once and SHALL fail before installation when a selected config or command references a missing Kaizen artifact. Protected installed task/controller material and machine-local project/data configuration SHALL remain derived workstation artifacts rather than portable profile content. Optional domain profiles SHALL not create another Kaizen store, command, controller, skill, or lifecycle owner.

#### Scenario: Core profile is installed
- **WHEN** a fresh core manifest is resolved
- **THEN** feedback capture, Kaizen status/triage, and Grind enable/disable/status entrypoints are loader-visible with their complete portable dependency closure
- **AND** no domain profile is required to use the shared inbox or controller commands.

#### Scenario: All profile is installed
- **WHEN** the all compatibility manifest is resolved
- **THEN** the same canonical Kaizen owners appear exactly once
- **AND** no duplicate command, skill, plugin module, controller source, or store authority is materialized.

#### Scenario: Profile omits a referenced module
- **WHEN** a profile includes a Kaizen command or configured plugin entry but omits a required portable module or skill
- **THEN** profile validation fails before installation
- **AND** identifies the selecting profile and missing portable source identity.

#### Scenario: Portable profile is present without host activation
- **WHEN** source/profile installation makes Grind commands discoverable but no explicit protected enable operation has completed
- **THEN** signal capture retains its configured behavior while Grind status reports not installed or disabled
- **AND** source presence alone creates no Scheduled Task, controller process, migration, restart, provider call, or project mutation.
