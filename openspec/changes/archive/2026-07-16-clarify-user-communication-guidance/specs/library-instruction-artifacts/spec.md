## ADDED Requirements

### Requirement: Plain and concise user communication
The active global instructions SHALL require every user-facing message to be as short as practical while retaining the information needed to understand the situation or make a decision. They SHALL require plain, concrete wording without assumed specialist knowledge, immediate brief definitions for necessary specialist terms or acronyms, and preservation of material facts, constraints, risks, uncertainty, and exact technical identifiers.

#### Scenario: Necessary specialist term
- **WHEN** a response needs a specialist term that plain wording cannot replace accurately
- **THEN** the response SHALL define the term immediately in one short phrase or sentence
- **AND** it SHALL briefly state why the term matters when that is not obvious

#### Scenario: Accuracy under brevity
- **WHEN** shortening or simplifying a response could remove or distort a material fact, constraint, risk, uncertainty, or exact technical identifier
- **THEN** the response SHALL preserve that information
- **AND** it SHALL prefer short steps or a small example over inaccurate simplification

### Requirement: Decision-ready user questions
The active global instructions SHALL require concise answer options in plain language when options are useful. Every option SHALL state what selecting it does, its main advantage, and its main disadvantage. The recommended option SHALL appear first, be clearly marked, and include the reason for the recommendation.

#### Scenario: Question with multiple options
- **WHEN** the agent asks the user to choose between multiple actions
- **THEN** every option SHALL describe its result, main advantage, and main disadvantage
- **AND** the recommended option SHALL appear first with a clear recommendation marker and reason

### Requirement: Narrow generated OpenSpec workflow-warning exemption
The validator SHALL exempt a skill from the missing happy-path-first risk-driven testing warning only when the file is under `.opencode/skills/openspec-*/SKILL.md` and declares `generatedBy` metadata. The validator SHALL continue to apply every other Markdown and safety check to that file. Non-generated instruction artifacts SHALL retain the existing workflow-warning behavior.

#### Scenario: Generated OpenSpec skill contains implementation wording
- **WHEN** the validator scans an `.opencode/skills/openspec-*/SKILL.md` file with `generatedBy` metadata and implementation wording but no repository-owned risk-driven workflow guidance
- **THEN** it SHALL NOT report the missing happy-path-first risk-driven testing warning for that file
- **AND** it SHALL continue evaluating all unrelated validation rules

#### Scenario: Non-generated implementation guidance
- **WHEN** the validator scans an implementation-capable instruction artifact without generated OpenSpec metadata or path eligibility
- **THEN** the existing missing happy-path-first risk-driven testing warning SHALL remain active

#### Scenario: Body-only, flattened, or blank generated marker
- **WHEN** an eligible OpenSpec skill path contains `generatedBy` only in body text, at the wrong frontmatter level, as a literal top-level `metadata.generatedBy` key, or as a blank nested value
- **THEN** the file SHALL NOT receive the generated workflow-warning exemption
- **AND** implementation wording without risk-driven guidance SHALL retain the existing warning
