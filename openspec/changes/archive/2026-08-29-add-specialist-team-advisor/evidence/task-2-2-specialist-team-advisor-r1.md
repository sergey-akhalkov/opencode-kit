# Task 2.2 Specialist Team Advisor R1

## Candidate

- Agent: `global/agents/specialist-team-advisor.md`
- Agent SHA-256: `328351c98e458d2a85d33b097fe714300170a830e52e0720dd274d65a87be316`
- Model route: inherited from the invoking primary through `INHERIT_FROM_PRIMARY_AGENTS`
- Activation: none; no active config, installation, profile materialization, or restart occurred.

The agent uses the exact discovery description, one bounded team-topology responsibility, wildcard deny with exact `read`, `glob`, `grep`, and `specialist_catalog` allows, and a `main-alone | team-recommended | unknown` report. It denies nested dispatch, mutation, user questions, skills, feedback/reviewer authority, and protected decisions by both permission and operative contract.

## Focused Validation

```text
npm.cmd run test:focused:library
```

Result: `OK: library tests=183`.

The dedicated validator branch accepts the complete advisor without generic reviewer privileges, rejects a widened `task` allow, and rejects a missing catalog-call contract. The first focused run exposed a missing export for the existing fixture-profile helper; after exporting that helper, the next run showed that fenced report fields were incorrectly checked against the operative-body-only surface. The corrected validator keeps authority markers on the operative body and checks declared report fields against the raw model-facing body.

```text
npm.cmd run test:focused:model-routing
```

Result: `OK: model profile tests=16`.

The governed catalog contains `specialist-team-advisor`, and the agent inherits the primary route without an explicit per-profile model entry.

```text
node tools/test-specialist-catalog-plugin.ts
```

Result: `OK: specialist catalog plugin tests=7`.

## Installed File-Backed Boundary

`task-2-1-specialist-catalog-plugin-r3.json` records the same agent source hash under installed OpenCode `1.18.25`. The disposable file-backed loader discovered `specialist-team-advisor`, retained wildcard deny plus exact `specialist_catalog` allow, denied another child, correlated the advisor child to a parentless root, returned a privacy-safe catalog, made zero provider requests, requested deletion of all three sessions, reached terminal server state, and removed the fixture.

## Claim Ceiling

This proves agent discovery, permission readback, inherited-primary routing classification, dedicated validator behavior, and one catalog-only child boundary for the recorded source and OpenCode environment. It does not prove profile materialization, semantic engagement-map quality, active-host behavior, or `STA-001` candidate behavior.
