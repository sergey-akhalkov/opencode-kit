## ADDED Requirements

### Requirement: JSON format flag
The CLI SHALL emit `{"status":"ok","count":1}` when invoked with `--format json`.

#### Scenario: JSON output
- **WHEN** the user runs `node src/report.ts --format json`
- **THEN** stdout contains `{"status":"ok","count":1}`
