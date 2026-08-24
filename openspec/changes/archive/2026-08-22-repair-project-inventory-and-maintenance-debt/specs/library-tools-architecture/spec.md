## ADDED Requirements

### Requirement: Project inventory recognizes analyzable root-level code and tests
Project inventory SHALL classify production and test ownership from explicit build/config manifests, maintained path patterns, and analyzable file evidence rather than requiring conventional source/test directory names. Root-level or `tools/test*.ts` tests SHALL be represented, and the inventory SHALL NOT report `Test Roots: none` when matching non-ignored test files exist.

#### Scenario: The kit repository is inventoried
- **WHEN** inventory scans this repository
- **THEN** it reports maintained production/tool roots and `tools/test*.ts` test ownership
- **AND** does not classify only `tools/proofs/lib` as source or report no tests

#### Scenario: Conventional project is inventoried
- **WHEN** a fixture uses `src/` and `tests/`
- **THEN** those roots remain reported with stable output
- **AND** the broader detection does not duplicate files across root classes

#### Scenario: No analyzable tests exist
- **WHEN** neither explicit manifests nor maintained test patterns find a test file
- **THEN** inventory reports no test root with the evidence basis
- **AND** does not invent one from documentation text

### Requirement: Inventory scope and unknowns are visible
Inventory output SHALL report scanned, ignored, generated/evidence/vendor, unreadable, and unsupported path counts in stable order. It SHALL exclude `.git`, dependencies, generated output, and configured evidence trees from source/test classification while retaining explicit notes that those exclusions are not proof of absence.

#### Scenario: Evidence tree contains test-like files
- **WHEN** archived or active evidence contains files named like tests
- **THEN** inventory excludes them from maintained test roots
- **AND** reports the evidence exclusion count

#### Scenario: Root cannot be read
- **WHEN** an explicit candidate root is unreadable
- **THEN** inventory returns non-zero with the safe root identity and original cause
- **AND** does not emit a partial success map as complete

### Requirement: Deletion and reuse require consumer proof
Repository-maintenance reduction SHALL delete a module only after literal, graph, loader/runtime, package/config, and dynamic-resolution checks find no consumer inside the supported envelope. Helper reuse SHALL require identical input/output/error/privacy/order contracts and preservation of every unique test/proof oracle. Unsupported dynamic loading SHALL keep the candidate or block deletion.

#### Scenario: Primitive has no consumer
- **WHEN** all maintained source, loader, config, and installed inventory checks find no consumer for a named primitive
- **THEN** the module may be deleted
- **AND** focused/full/installed validation must remain green

#### Scenario: Similar helpers have different errors
- **WHEN** two helpers are textually similar but expose different error or redaction behavior
- **THEN** they remain separate
- **AND** the reduction matrix records why reuse is unsafe

### Requirement: Large-file findings remain responsibility-driven
A file at or above the split-candidate threshold SHALL receive a responsibility map, but line count alone SHALL NOT authorize refactor. The current change SHALL split only when it otherwise adds responsibility to a mixed owner or when a reproduced navigation/testability defect has one cohesive extraction and representative proof. Other files SHALL retain a `split-or-justify` disposition without becoming completion work.

#### Scenario: Unrelated workstation god file is found
- **WHEN** maintenance inventory reports the workstation controller as large but this change does not alter workstation behavior
- **THEN** the file remains unchanged and owner-deferred
- **AND** its line count does not block this change
