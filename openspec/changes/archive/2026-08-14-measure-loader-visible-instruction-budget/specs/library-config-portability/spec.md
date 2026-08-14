## ADDED Requirements

### Requirement: Loader-visible instruction discovery SHALL be bounded and evidence-classified

Loader-visible instruction discovery SHALL reuse maintained runtime-source facts,
conventional instruction locations, and supported explicit local filesystem entries
from OpenCode `instructions` configuration. It SHALL read only the resulting
bounded instruction manifest and SHALL NOT recursively scan unrelated project,
vendor, generated, evidence, or build-output trees. Every source SHALL identify
whether it was runtime-observed, config-declared, conventional, or unknown.

#### Scenario: Explicit local instruction path is discovered
- **WHEN** project OpenCode config declares a supported local Markdown instruction path
- **THEN** discovery records the path as config-declared and inventories only that resolved file

#### Scenario: Vendor tree is not part of instruction discovery
- **WHEN** a project contains a large vendor tree with Markdown files that are not instruction sources
- **THEN** loader-visible inventory does not walk or count that tree

#### Scenario: Presence does not prove precedence
- **WHEN** more than one instruction source is discovered without current loader evidence establishing a winner
- **THEN** every source remains reported and the inventory does not claim precedence or final prompt inclusion
