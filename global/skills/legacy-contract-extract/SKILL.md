---
name: legacy-contract-extract
description: Extract behavior contracts from legacy applications, clients, protocols, logs, tests, or source code and turn them into modern requirements/spec evidence.
license: MIT
---

# Legacy Contract Extract

Use this skill when migrating or replacing legacy software and behavior must be preserved, clarified, or intentionally changed.

## Evidence Rules

- Legacy docs and comments are navigation aids, not proof.
- Prefer source, tests, schemas, IDL, protocol captures, binaries with stable public contracts, logs, and live/manual output.
- Record when evidence is docs-only, ambiguous, untested, or blocked by missing hardware/access.
- Distinguish compatibility requirements from implementation accidents.

## Safety

- Default to read-only source, test, schema, capture, and redacted log inspection.
- Do not run legacy apps, clients, hardware/device probes, installers, network captures, or live/manual checks against shared systems unless the user approves target, command, limits, side effects, and stop/rollback criteria.
- Redact secrets, credentials, private data, and unrelated log snippets from evidence and output.

## Workflow

- Identify legacy sources and entry points.
- Map public APIs, commands, configuration, states, error codes, timing assumptions, and compatibility expectations.
- Extract observed behavior into requirement scenarios.
- Mark unsupported, intentionally changed, unknown, and future-scope behavior.
- Add traceability from requirement to legacy evidence and the observable modern happy path; after that path is implemented and proven, proposed migration tasks route characterization and compatibility test authoring to a separate fresh-context testing subagent.

## Output

Return legacy evidence map, extracted contracts, confidence, open questions, compatibility risks, and proposed spec/tasks/tests.
