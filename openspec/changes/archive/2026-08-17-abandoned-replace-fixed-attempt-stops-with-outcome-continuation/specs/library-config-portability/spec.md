## ADDED Requirements

### Requirement: Portable helper source resolution follows active loader identity

Kit workflow instructions and deterministic adapters SHALL use one documented
source-resolution contract for portable helpers. `OPENCODE_CONFIG_DIR`, when set,
SHALL identify the first candidate kit global source; otherwise the workflow SHALL
inspect the supported host-default global location and current runtime-source
inventory. A candidate source SHALL be accepted only when the exact required helper
exists under its `bin` directory and source-collision policy is satisfied.

Resolution SHALL emit privacy-safe source and helper identities, SHALL preserve an
actionable unsupported or missing result, and SHALL NOT infer a repository parent
from the global directory name. Presence of another loader-visible source SHALL
remain visible and SHALL block only when existing canonical-collision requirements
make precedence unknown.

#### Scenario: Environment selects the kit global directory

- **WHEN** `OPENCODE_CONFIG_DIR` points to a directory containing the canonical OpenSpec skill and `bin/openspec-operation-gate.ts`
- **THEN** that directory is the resolved global source for the operation gate
- **AND** the target project's current working directory does not alter the helper path.

#### Scenario: Configured source lacks the helper

- **WHEN** `OPENCODE_CONFIG_DIR` is set but the required helper is absent
- **THEN** resolution reports the exact missing kit-relative helper and checks only documented fallback sources
- **AND** it returns blocked or unsupported only after those sources are exhausted or canonical precedence is unknown.
