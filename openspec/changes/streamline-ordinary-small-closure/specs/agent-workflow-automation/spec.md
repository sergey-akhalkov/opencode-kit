## MODIFIED Requirements

### Requirement: Eligible changes declare one automation dividend

A `material` or legacy-strict OpenSpec proposal SHALL declare `Automation Dividend` as `required - <candidate>` or retain its compatible reviewed legacy exemption. Material changes SHALL declare `required`. A new `ordinary-small` proposal SHALL omit the declaration when its accepted outcome neither introduces nor materially extends repeated operator, agent, proof, or workflow behavior; omission is the profile-selected project-native equivalent of not applicable. If an Ordinary Small accepted outcome does introduce repeated-use behavior, it SHALL explicitly declare `required - <candidate>`. The selected profile and any declaration are reviewed semantic decisions; deterministic tooling SHALL validate only profile, shape, and correlated evidence and SHALL NOT infer profile, recurrence, value, or exemption from prose, changed files, task count, measurements, or model output.

A required candidate SHALL name one deterministic sequence observed at least twice in current attributable tool evidence or in one maintained feedback, audit, or prior evidence source that records at least two occurrences. The proposal and tasks remain mutable process controls: apply MAY replace the candidate with a better observed sequence without owner approval when accepted product semantics and protected boundaries remain unchanged.

#### Scenario: Material change declares a candidate

- **WHEN** a Material change reaches proposal readiness
- **THEN** its proposal declares one required automation dividend and names the repeated sequence or maintained recurrence source
- **AND** the declaration does not authorize any protected effect performed by that sequence.

#### Scenario: Ordinary Small change remains proportional

- **WHEN** a new `ordinary-small` bounded local reversible change neither introduces repeated-use behavior nor has an accepted automation outcome
- **THEN** its proposal omits the automation-dividend declaration
- **AND** no automation task, exemption record, retrospective, or helper is required for complete archive.

#### Scenario: Ordinary Small change introduces repeated behavior

- **WHEN** an `ordinary-small` accepted outcome introduces or materially extends a repeated deterministic workflow
- **THEN** the proposal declares one required automation dividend
- **AND** apply and archive retain the existing task, consumer-proof, and completion gates.

#### Scenario: Tooling cannot infer eligibility

- **WHEN** a Material/legacy proposal omits or malforms a required declaration, an Ordinary Small proposal malforms an explicit declaration, or supplied recurrence evidence is unsupported
- **THEN** deterministic validation reports the exact profile, declaration, or evidence gap
- **AND** does not classify the change, select a candidate, or manufacture an exemption.
