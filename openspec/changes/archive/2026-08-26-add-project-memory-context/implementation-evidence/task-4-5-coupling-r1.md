# Task 4.5 Runtime Surface And Coupling R1

- Recorded at: `2026-08-25T23:19:02.8207113Z`.
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Environment: Windows, Node `24.18.1`, repository runtime source at `D:/home/sergey-akhalkov/opencode-kit/global`.
- Effects: read-only repository/runtime inspection plus disposable copied-plugin test fixtures; no install, profile materialization, provider call, external egress, or remote effect.

## Commands

| Command | Status | Observed result |
| --- | ---: | --- |
| `npm run opencode:sources -- --root .` | `0` | The custom runtime source reports `global/plugin/session-env.ts` as plugin `session-env`; existing config and duplicate OpenSpec-skill collisions remain visible and no precedence claim is inferred. |
| `npm run install:global -- --preview-profile --profile all` | `0` | Current runtime is `unprofiled`; the proposed `all` profile owns directory `plugin`; the command reports `No file or environment value was changed.` |
| `node tools/test-session-env-plugin.ts` | `0` | Copied-plugin execution without repository `tools` passed with all existing plugin checks, `18/18`. |
| Fresh Codebase Memory full index plus call tracing for `createProjectMemoryFeature` and `createProjectMemoryPluginHooks` | `0` | Hook creation has seven reachable callees, all inside project memory, and eleven reachable callers through depth four, limited to `session-env`, focused tests, and the proof runner. Feature creation has six reachable callees inside project memory and fifteen callers in the same integration/test/proof set. |
| Scoped Git diff/status, direct import/source readback, config search, and prohibited-capability search | `0` | No candidate coupling to runtime-profile, installer, config, MCP, hosted transport, process launch, Serena mutation, transcript storage, or a mandatory improvement task. |

## Disposition

- Production composition is limited to `global/plugin/session-env.ts`, four files under `global/plugin/project-memory/`, and the existing `global/plugin/session-delivery-context/redaction.ts` helper. Production imports are Node built-ins, local project-memory modules, and that redaction helper only.
- `global/opencode.json.template` and the active local config continue to name only the existing `session-env` plugin; no project-memory plugin entry was added. The `all` runtime profile already copies the complete `global/plugin/` directory, so no profile or installer mutation is needed.
- `package.json` adds only the project-memory proof/focused-test inventory and includes no dependency change. Other package/runtime/installer changes visible in the shared dirty worktree belong to closed or foreign work and are outside this candidate.
- The store resolves writes beneath the platform OpenCode data root at `project-memory/v1/<project-ref>`, never beneath the canonical project root. Serena integration performs bounded `lstat`, `realpath`, `readdir`, and `readFile` operations only.
- Root-message text is used transiently as the bounded automatic-recall query and is not passed to the append-only persistence path. No transcript reader or transcript-capture path exists in the candidate.
- Direct search found no `fetch`, HTTP(S), socket, child-process, MCP, or hosted-memory implementation in `global/plugin/project-memory/`. The feature remains startup-disabled unless `OPENCODE_PROJECT_MEMORY=1`.
- The fresh graph contains the new symbols and reports no parse gap for the cited files, but coverage metadata still marks current dirty paths as changed; direct source and diff readback therefore remain the authority for the negative coupling claims.
- Candidate file hashes rechecked unchanged: `session-env.ts=f209c96c72bb66a00d7b30dc519ede1dbbffc361092327003e059edfb3064b57`; `index.ts=fb5e913bb2aa252f5951bbd24e063a71fc216d26b825ef58ef17a1bc1de3bacd`; `recall.ts=ac7fd1385d9c05493f63bcd5ea5b8bc5edfc984406deff13d3cfcce5cd71850a`; `records.ts=be2c3468a414d923c387776d783893018f196f2d8b4792e49a7ed15e080baae9`; `store.ts=f7d38a38778b1b34bf2369375e42dd7985dc15b70ee6383777bf22403681898e`.

Outcome: complete. No prohibited coupling or capability entered the frozen Product Candidate.
