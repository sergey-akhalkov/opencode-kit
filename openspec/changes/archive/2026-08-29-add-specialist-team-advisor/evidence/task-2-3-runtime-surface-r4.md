# Task 2.3 Runtime Surface R4

## Candidate

- Profiles: `profiles/core.json` and `profiles/all.json`
- Renderer: `tools/runtime-surface-profile.ts`
- Loader proof: `tools/proofs/runtime-surface-loader.ts`
- Advisor: `global/agents/specialist-team-advisor.md`
- Catalog plugin: `global/extensions/specialist-catalog.ts`
- Activation: none; no installation, active-config edit, restart, or active-host catalog activation occurred.

The accepted evidence is the r4 pair. R1 did not evaluate the complete advisor/plugin boundary, r2 used an exact-permission-row oracle that ignored OpenCode's final wildcard-deny result, and r3 did not read back the selected agent population. Those earlier bundles remain diagnostic only and are superseded by r4 for task 2.3.

## Disposable Core Loader

```text
npm.cmd run proof:runtime-surface-loader -- --profile core --candidate-id add-specialist-team-advisor-task-2-3-core-r4 --evidence-root openspec/changes/add-specialist-team-advisor/evidence/task-2-3-runtime-surface-core-r4
```

Result: `status=passed`, `cleanup=complete`, and OpenCode config, advisor, selected agent list, and skill readbacks exited `0`.

`evaluation.pluginPaths` is exactly `extensions/specialist-catalog.ts`; `catalogPluginCount=1`; `unexpectedCorePlugins=[]`; `advisorAgentName=specialist-team-advisor`; `permissionFailures=[]`; and `extraCoreAgents=[]`. The generated core therefore exposes the advisor and catalog dependency while excluding the reviewed all-only plugin and domain-agent surfaces.

Preserved raw evidence: `evidence/task-2-3-runtime-surface-core-r4/raw.json`.

## Disposable All Loader

```text
npm.cmd run proof:runtime-surface-loader -- --profile all --candidate-id add-specialist-team-advisor-task-2-3-all-r4 --evidence-root openspec/changes/add-specialist-team-advisor/evidence/task-2-3-runtime-surface-all-r4
```

Result: `status=passed`, `cleanup=complete`, and OpenCode config, advisor, and selected agent-list readbacks exited `0`.

`catalogPluginCount=1`; `missingPlugins=[]`; `missingCommands=[]`; `missingSelectedAgents=[]`; and `stagingPathCount=0`. The selected list includes `specialist-team-advisor`, while the existing PTY, roadmap, completion-guard, session-environment, graph, and notification plugins remain present exactly once in the generated all profile.

Preserved raw evidence: `evidence/task-2-3-runtime-surface-all-r4/raw.json`.

## Active Config Non-Activation

The active source is the gitignored `global/opencode.json` (`.gitignore:6`). Current exact readback contains no `specialist-team-advisor`, `specialist_catalog`, or `specialist-catalog` reference and has SHA-256 `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`. The catalog source remains under non-auto-discovered `global/extensions/`; the r4 proof materialized and removed separate disposable roots. This establishes current non-activation, not installed-host behavior.

## Validation

```text
node --check tools/proofs/runtime-surface-loader.ts
npm.cmd run test:focused:library
npm.cmd run test:focused:model-routing
npm.cmd run test:focused:practice-owners
node tools/test-specialist-catalog-plugin.ts
npm.cmd run instruction:inventory -- --format markdown
npm.cmd run instruction:canonicalize -- --check .
npm.cmd run test:focused:instruction-context
npm.cmd run opencode:profile -- quality-independent --check
npm.cmd run validate:strict
git diff --check
```

Results: syntax check exited `0`; library tests `183`, model-profile tests `16`, practice-owner tests `7`, catalog-plugin tests `7`, and instruction-context tests `15` passed; instruction inventory reported `76` artifacts and context status `passed`; canonicalization reported zero changed files and zero deterministic errors; model profile reported `26` agents; strict validation reported `skills=33 agents=22 markdown=953 warnings=0`; and diff checking reported no errors.

## Claim Ceiling

This proves the recorded source materializes into disposable `core` and `all` roots that installed OpenCode `1.18.25` can load, with one catalog plugin, the expected advisor/profile population, retained all-profile compatibility plugins, excluded core domain agents, and terminal temporary-root cleanup. It does not prove active-host activation, semantic engagement-map quality, or any `STA-001` candidate scenario.
