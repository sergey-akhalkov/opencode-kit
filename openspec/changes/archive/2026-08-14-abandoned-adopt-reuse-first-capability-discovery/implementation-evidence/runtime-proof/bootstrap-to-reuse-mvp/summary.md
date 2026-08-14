# Bootstrap-To-Reuse MVP Status

## Current Result

- Task 2.1 portable client: current and green at Rung 2.
- Task 2.2 loaded command/trigger/skill artifacts: implemented, discovered by the real loader, and strict-validation green.
- Task 2.2 registered-peer model behavior: blocked; no single current green same-model bundle.
- Task 2.2 inventory command model behavior: not attempted because the live-attempt gate blocked first on the registered-peer dependency.
- Development-Stage: `development`.

## Product Candidate

- `global/commands/reuse-inventory.md`
- `global/skills/reuse-discovery/SKILL.md`
- compact trigger in `global/AGENTS.md`
- `global/bin/reuse-registry.ts`
- `global/bin/reuse-registry/{contracts,io,registry,scanner}.ts`
- registry template and package exposure from task 2.1

No new agent, dependency, model pin, private owner identity, remote operation, or dependency/source mutation was added.

## Proven Current Boundaries

- Fresh loader discovers `/reuse-inventory` from `global/commands/` with `agent: build` and no model override.
- Fresh registered-peer sessions load `reuse-discovery` before implementation planning.
- Query accepts exact explicit groups and a safe sole-enabled-group fallback; multiple/zero enabled groups remain fail-closed.
- Query verifies current committed entrypoint/evidence presence and returns no absolute root.
- Selected Alpha/Beta fixtures are readable inside the disposable workspace; sentinel remains outside.
- Producer JSONC parser passes three direct runtime cases.
- Exact captured `jsonc-parsing` query returns the one seeded capability in current provider-free replay.
- Rung 2 lifecycle remains empty -> bootstrap -> pending -> synced -> one curated verified result.
- Strict validation is green. `global/AGENTS.md` remains under its frozen individual token-proxy budget; complete-corpus consolidation remains task 4.1.

## Blocker

Four bounded same-model attempts each exposed one later proof-envelope or fixture defect. Every bundle has known cleanup and terminal offline replay. The current deterministic candidate corrects all four observed causes, but attempt-control stop conditions prohibit manufacturing a fifth direct-prompt retry and prohibit composing separate failed sessions into MVP.

Task 2.2 stays unchecked. Tasks 3.1 onward remain dependency-blocked by the missing current Rung 3 MVP. No owner action is requested because this is not an owner-controlled boundary.

See `offline-replay-4/terminal-replay.md` and `history.md` for the exact failure chain, preserved bundles, replay coverage, and unlock condition.
