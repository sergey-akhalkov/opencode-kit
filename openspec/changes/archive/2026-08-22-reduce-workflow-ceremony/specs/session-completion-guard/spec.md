## ADDED Requirements

### Requirement: Certified terminal roots bypass model arbitration
The completion guard SHALL support a versioned deterministic terminal certificate issued by an explicitly configured owning workflow. The certificate SHALL bind the issuer, root, current revision, async lease generation, accepted requirement identifiers, terminal disposition, and evidence references. The guard SHALL accept it only after its existing deterministic preflight proves the same root and revision are idle, unpaused, question-free, and async-clear. A valid certificate SHALL produce terminal `allow_stop` behavior without creating an arbiter child or invoking an arbiter model.

#### Scenario: Owning workflow certifies terminal completion
- **WHEN** a trusted configured owner supplies a current certificate whose root, revision, lease generation, requirements, and terminal evidence match deterministic preflight
- **THEN** the guard records a deterministic passed state with zero arbiter prompt
- **AND** the certificate and evidence references remain observable in privacy-safe status.

#### Scenario: Certificate is stale or mismatched
- **WHEN** a certificate has an unknown issuer, wrong root, stale revision, stale lease generation, missing requirement, malformed disposition, or invalid evidence reference
- **THEN** the guard does not stop from that certificate
- **AND** proceeds through normal bounded arbitration or fail-closed status according to the current root state.

#### Scenario: Root remains ambiguous
- **WHEN** no valid terminal certificate exists for an otherwise async-clear grind root
- **THEN** the guard invokes the existing hidden arbiter
- **AND** preserves structured requirement mapping, owner boundaries, retries, and continuation behavior.

### Requirement: Completion guard preserves resolved permissions
The completion guard config hook SHALL NOT replace or widen the merged top-level OpenCode permission policy. Ordinary OpenCode source precedence SHALL control main permissions, and explicit per-agent restrictions SHALL remain effective. The guard SHALL expose a privacy-safe capability diagnostic when its required operation is denied and SHALL not convert that denial into permission mutation.

#### Scenario: Project main permissions require ask
- **WHEN** project and global configuration resolve an ask-level main permission while the guard plugin is loaded
- **THEN** runtime config retains the ask-level permission
- **AND** the guard neither writes a persistent approval nor changes it to allow.

#### Scenario: Hidden arbiter remains denied
- **WHEN** the hidden arbiter is invoked under any main permission policy
- **THEN** its explicit edit, bash, task, question, skill, and external restrictions remain denied
- **AND** its model prompt receives no enabled tools.

## REMOVED Requirements

### Requirement: Main permission requests default to allow
**Reason**: A completion plugin must not override project or managed permission policy merely to avoid operator prompts.
**Migration**: Configure permissive main permissions explicitly in the intended config layer when desired; the guard only diagnoses missing capability.

### Requirement: Main permission normalization preserves specialist restrictions
**Reason**: Permission normalization itself is removed; specialist restrictions continue through ordinary config precedence.
**Migration**: Validate the resolved main and specialist policies without mutating either one.
