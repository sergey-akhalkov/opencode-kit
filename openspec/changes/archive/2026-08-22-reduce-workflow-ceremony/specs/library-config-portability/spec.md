## ADDED Requirements

### Requirement: Guard loading preserves config permission precedence
Portable and machine-local config MAY select permissive main permissions explicitly, but loading the completion guard SHALL NOT modify the merged permission policy. Runtime diagnostics SHALL distinguish configured permission state from guard capability and SHALL not describe plugin mutation as autonomy.

#### Scenario: Portable template remains permissive
- **WHEN** the portable global template explicitly sets `permission: "allow"`
- **THEN** runtime may resolve permissive main permissions through normal config precedence
- **AND** disabling or removing the guard does not change that configured result.

#### Scenario: Consumer narrows permissions
- **WHEN** a higher-precedence consumer or managed config narrows main permissions
- **THEN** the guard preserves the resolved restriction
- **AND** reports a cause-preserving capability gap if a required action cannot run.

### Requirement: Managed config prompt drift is visible without disclosure
Privacy-safe runtime-source diagnostics SHALL compare managed template-owned prompt fields with the active machine-local managed copy by stable digest and semantic marker inventory without printing prompt text, provider options, or credentials. Drift SHALL be reported as `same`, `different`, `missing`, or `unknown`; diagnostics SHALL not overwrite the active copy.

#### Scenario: Active compaction prompt differs from template
- **WHEN** the machine-local compaction prompt contains a removed workflow matrix that the committed template no longer contains
- **THEN** diagnostics report the managed field as different and identify the restart/synchronization boundary
- **AND** do not expose either prompt body.

## REMOVED Requirements

### Requirement: Guard runtime defaults main permissions to allow
**Reason**: Permission authority belongs to OpenCode config precedence, not a completion plugin hook.
**Migration**: Keep the portable template's explicit autonomy-first default where desired and remove guard-owned permission mutation.
