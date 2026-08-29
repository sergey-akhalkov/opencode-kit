# Task 2.1 Specialist Catalog Plugin

> Superseded by `task-2-1-specialist-catalog-plugin-r3.md`. This inline-agent v2 probe did not exercise file-backed catalog availability and must not be used as task 2.1 completion evidence.

## Candidate

- Source: `global/extensions/specialist-catalog.ts`
- Source SHA-256: `3a32c4c741c531e2d53ef97d743b730687e8642aa1d111d45ee806bb40356e15`
- Owner decision: `no-current-owner -> build-minimal`
- Activation: none; `global/extensions/` is not auto-discovered and no active config or profile was changed in this task.

The source owns one inert-initialization, execute-local `specialist_catalog` tool. It uses the task-1.2 verified `client.v2.agent.list`, `client.v2.skill.list`, `ToolContext.agent|directory|sessionID`, and bounded `session.get` parent walk.

## Focused Contract Test

```text
node tools/test-specialist-catalog-plugin.ts
```

Result: `OK: specialist catalog plugin tests=7`.

The direct tests cover inert initialization, non-advisor denial before API access, missing-API `unknown`, exact advisor-child/root attribution, cycle failure, listing failure cause class, stable order, safe id/class/availability fields, capped descriptions, body/path/session/secret omission, hashed refs, hidden/control/self omission, and empty fail-closed payloads.

## Installed OpenCode Boundary

```text
node tools/test-specialist-catalog.ts --opencode <private-home>/.bun/bin/opencode.exe --plugin <repo-home>/opencode-kit/global/extensions/specialist-catalog.ts --evidence openspec/changes/add-specialist-team-advisor/evidence/task-2-1-specialist-catalog-plugin-r2.json
```

Result: exit `0`, `status=passed`, provider requests `0`.

Preserved raw evidence: `evidence/task-2-1-specialist-catalog-plugin-r2.json`.

Observed installed boundary:

- OpenCode `1.18.25`; plugin and SDK declarations `1.18.15`.
- Candidate source loaded explicitly from its standalone file and exposed one `specialist_catalog` tool.
- Wildcard deny plus exact advisor-tool allow remained effective; another child had no exact allow.
- The live advisor child read back with the exact agent id and parent id; the resolved root was parentless and its returned reference matched the expected hash.
- Root-effective agent and skill APIs returned the disposable catalog; hidden, control-plane, advisor-self, prompt/body, path, and raw-session values were absent from output; entry order was stable.
- Another child returned `denied` with no entries. A plugin initialized without listing APIs and returned `unknown` with `catalog-api-unavailable` only on execution.
- Three sessions were requested for deletion; the proof server listener was terminated; the disposable config/project/database/home root was removed.
- Active global config, providers, remote state, and target repository runtime were not changed.

## Limits

This task proves the standalone catalog implementation and installed disposable loader boundary only. It does not activate the plugin in `core` or `all`, prove the advisor instruction, or establish candidate `STA-001` behavior.
