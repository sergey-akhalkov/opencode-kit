# fixture-capability Specification

## Purpose

Defines a stable disposable capability used to prove configured OpenSpec archive and trajectory routing without external effects.

## Requirements

### Requirement: Fixture capability remains observable

The fixture SHALL preserve one locally observable capability through canonical OpenSpec archive processing.

#### Scenario: Fixture is ready

- **WHEN** the disposable fixture is validated
- **THEN** its capability remains locally observable.
