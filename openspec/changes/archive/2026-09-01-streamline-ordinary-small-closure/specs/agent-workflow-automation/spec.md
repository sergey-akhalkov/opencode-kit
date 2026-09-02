## MODIFIED Requirements

### Requirement: Eligible changes declare one automation dividend

A full or legacy-strict OpenSpec proposal SHALL declare `Automation Dividend` as `required - <candidate>` or retain its compatible reviewed legacy exemption. A full Material proposal SHALL declare `required`. A compact proposal with current `riskDisposition.kind: ordinary-small-exact` SHALL omit the declaration when its accepted outcome neither introduces nor materially extends repeated operator, agent, proof, or workflow behavior; omission is the compact contract's project-native not-applicable state. If a compact accepted outcome introduces repeated-use behavior, it SHALL explicitly declare `required - <candidate>`. `material` and `unknown` SHALL not use compact omission. Deterministic tooling SHALL validate only explicit profile, disposition, declaration shape, and correlated evidence; it SHALL NOT infer risk, recurrence, value, or exemption from prose, changed files, counts, measurements, or model output.

A required candidate SHALL name one deterministic sequence observed at least twice in current attributable tool evidence or in one maintained feedback, audit, or prior source that records at least two occurrences. Proposal and tasks remain mutable process controls: apply MAY replace the candidate with a better observed sequence without owner approval when accepted product semantics and protected boundaries remain unchanged.

#### Scenario: Material change declares a candidate

- **WHEN** a full Material change reaches proposal readiness
- **THEN** its proposal declares one required automation dividend and names the repeated sequence or maintained recurrence source
- **AND** the declaration does not authorize any protected effect performed by that sequence.

#### Scenario: Ordinary Small change remains proportional

- **WHEN** a compact bounded local reversible change with current `ordinary-small-exact` disposition neither introduces repeated-use behavior nor has an accepted automation outcome
- **THEN** its proposal omits the automation-dividend declaration
- **AND** no automation task, exemption record, retrospective, or helper is required for complete archive.

#### Scenario: Compact change introduces repeated behavior

- **WHEN** a compact Ordinary Small exact accepted outcome introduces or materially extends a repeated deterministic workflow
- **THEN** the proposal declares one required automation dividend
- **AND** apply and archive retain existing task, consumer-proof, and completion gates.

#### Scenario: Unknown or Material compact omission is rejected

- **WHEN** a compact proposal records `material` or `unknown`, or current evidence makes its Ordinary Small disposition stale
- **THEN** operation readiness fails before treating dividend omission as not applicable
- **AND** requires full artifacts without selecting a semantic candidate.

#### Scenario: Tooling cannot infer eligibility

- **WHEN** a full/legacy proposal omits or malforms a required declaration, a compact proposal malforms an explicit declaration, or supplied recurrence evidence is unsupported
- **THEN** deterministic validation reports the exact profile, disposition, declaration, or evidence gap
- **AND** does not classify the change, select a candidate, or manufacture an exemption.
