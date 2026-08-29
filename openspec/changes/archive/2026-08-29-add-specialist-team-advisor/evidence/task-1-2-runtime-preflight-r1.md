# Task 1.2 Runtime Preflight R1

## Scope

- Product Candidate: none; repository advisor and catalog sources were not loaded.
- Proof Runner: `tools/test-specialist-catalog.ts`.
- Environment: installed OpenCode `1.18.25`, Node `v24.18.1`, Windows, `@opencode-ai/plugin` and `@opencode-ai/sdk` `1.18.15`.
- Raw Evidence Bundle: `evidence/task-1-2-runtime-preflight-r1.json`.
- Provider requests: zero.

## Invocation

```text
node tools/test-specialist-catalog.ts --opencode <private-home>/.bun/bin/opencode.exe --evidence openspec/changes/add-specialist-team-advisor/evidence/task-1-2-runtime-preflight-r1.json
```

Exit status: `0`.

Stdout:

```json
{"evidence":"openspec/changes/add-specialist-team-advisor/evidence/task-1-2-runtime-preflight-r1.json","status":"passed"}
```

Stderr: empty.

## Observations

- `client.v2.agent.list({ location: { directory } })` returned a location-scoped `AgentV2Info[]`; the five disposable agents were present.
- `client.v2.skill.list({ location: { directory } })` returned a location-scoped `SkillV2Info[]`; the disposable skill was present.
- `client.tool.ids({ directory })` exposed the explicitly configured disposable `proof_catalog` tool.
- The advisor's effective permission list retained broad `*` deny and exact `proof_catalog` allow rules. The non-advisor had no exact allow.
- The live advisor child read back with `agent=proof-advisor` and `parentID=<root>`; the root read back without `parentID`.
- An attributable advisor execution resolved that root and returned a matching hashed root reference. A non-advisor execution returned `denied` with no entries.
- Hidden, control-plane, and self agents were omitted. Prompt, skill-body, description, path, and raw-session sentinels were absent. Ordering was stable.
- A plugin instance lacking both listing APIs initialized successfully and returned `unknown` with `catalog-api-unavailable` only when executed.

## Cleanup

- Three disposable sessions were requested for deletion.
- `stopProofServer` proved the listener unreachable after process-tree termination. The terminated process reported status `1`, consistent with forced local proof-server shutdown.
- The isolated config, plugin, project, database, and home root were removed.
- Active global configuration, repository candidate runtime source, remote state, and providers were not touched.

## Disposition

Task 1.2 is satisfied. The verified adapter is the official location-scoped agent/skill list plus `ToolContext.agent` and `ToolContext.sessionID`, with a bounded `session.get` parent walk. Production implementation must remain inert at initialization, enforce the exact advisor caller before catalog reads, omit unsafe fields, and return explicit `unknown` on missing or failed APIs.
