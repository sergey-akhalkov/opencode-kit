## Why

Operators need machine-readable report output without changing the default text path.

## Outcome Capsule

- **Outcome**: The report CLI can emit one JSON object when `--format json` is supplied.
- **Operating Envelope**: Local Node 24 CLI, one request, no network.
- **Non-Goals**: Remote delivery, commit, or additional formats.
- **Non-Deferrable Invariants**: Default text output remains unchanged.
- **Observable Proof**: `node src/report.ts --format json` prints `{"status":"ok","count":1}`.
- **Material Residual Risks**: None beyond local fixture scope.
- **Stop Line**: Finish when JSON output and the focused test pass.

## What Changes

- Add `--format json` to the report CLI.

## Capabilities

### New Capabilities

- `report-json-output`: JSON emission for the local report CLI.

### Modified Capabilities

None.

## Impact

- Local CLI only.
