# Task 2.1 Specialist Catalog Plugin R3

## Corrected Adapter

- Source: `global/extensions/specialist-catalog.ts`
- Source SHA-256: `d9b122ed2da261125e5ba40ba0e0d1c7bdf739a4be7c33a85c508c2f4933339c`
- Listing routes: `client.app.agents({ directory })` and `client.app.skills({ directory })`
- Attribution route: bounded `client.session.get({ directory, sessionID })` parent walk
- Owner decision: `no-current-owner -> build-minimal`
- Activation: none; no active config, installation, profile materialization, or restart occurred.

The adapter changed after provider-free route comparison proved that installed OpenCode 1.18.25 exposes the complete file-backed catalog on official SDK `/agent` and `/skill` routes, while the same-directory v2 routes return empty arrays. Raw route evidence is `task-2-2-agent-route-diagnostic-r2.json`; strategy disposition is in `history.md` Strategy 11.

## Focused Contract Test

```text
node tools/test-specialist-catalog-plugin.ts
```

Result: `OK: specialist catalog plugin tests=7`.

The direct tests cover inert initialization, denial before API access, missing-API `unknown`, exact advisor-child/root attribution, cycle failure, listing failure cause class, stable ordering, safe id/class/availability fields, capped descriptions, body/path/session/secret omission, hashed refs, and hidden/control/self omission.

## Installed File-Backed Boundary

```text
node tools/test-specialist-catalog.ts --opencode <private-home>/.bun/bin/opencode.exe --plugin <repo-home>/opencode-kit/global/extensions/specialist-catalog.ts --agent <repo-home>/opencode-kit/global/agents/specialist-team-advisor.md --evidence openspec/changes/add-specialist-team-advisor/evidence/task-2-1-specialist-catalog-plugin-r3.json
```

Result: exit `0`, `status=passed`, provider requests `0`.

Preserved raw evidence: `task-2-1-specialist-catalog-plugin-r3.json`.

- File-backed advisor and standalone plugin sources were loaded explicitly in one disposable config.
- The app routes returned twelve root-effective agents and two skills.
- Wildcard deny plus exact `specialist_catalog` allow was effective; another child had no exact allow.
- The advisor child and parentless root were read back and correlated; the returned root hash matched.
- Hidden, control-plane, advisor-self, prompt/body, absolute-path, and raw-session values were absent; output ordering was stable.
- Another child received `denied` with no entries; absent listing APIs initialized successfully and returned cause-preserving `unknown` only at execution.
- Three sessions were requested for deletion, the server became terminal, and the disposable root was removed.

## Claim Ceiling

This proves the standalone file-backed catalog tool on installed OpenCode 1.18.25 under the recorded SDK/plugin 1.18.15 declarations. It does not prove profile materialization, active-host behavior, advisor semantic output, or `STA-001` candidate behavior.
