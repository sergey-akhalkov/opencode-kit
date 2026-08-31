## ADDED Requirements

### Requirement: Core and all expose one Kaizen lifecycle surface
The maintained `core` and `all` runtime profiles SHALL include the canonical `complain` routing, Kaizen status and triage commands, and the complete self-contained plugin module required by the configured global entry point. Profile resolution SHALL include each owner exactly once and SHALL fail before installation when a selected config or command references a missing Kaizen artifact. Optional domain profiles SHALL not create another Kaizen store, skill, or lifecycle owner.

#### Scenario: Core profile is installed
- **WHEN** a fresh core manifest is resolved
- **THEN** feedback capture, Kaizen status, and explicit triage entrypoints are loader-visible with their complete plugin dependency closure
- **AND** no domain profile is required to use the shared inbox.

#### Scenario: All profile is installed
- **WHEN** the all compatibility manifest is resolved
- **THEN** the same canonical Kaizen owners appear exactly once
- **AND** no duplicate command, skill, plugin module, or store authority is materialized.

#### Scenario: Profile omits a referenced module
- **WHEN** a profile includes the Kaizen command or configured plugin entry but omits a required module or skill
- **THEN** profile validation fails before installation
- **AND** identifies the selecting profile and missing portable source identity.
