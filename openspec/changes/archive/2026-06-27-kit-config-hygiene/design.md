## Context

The kit's opencode-config layout is the result of three independent decisions made at different times:

1. The repo-root `opencode.json` exists so a developer can run OpenCode inside this repo with the right MCP (`headroom-mcp-wrapper`) and the `permission: ask` policy.
2. The `global/opencode.json` and `global/opencode.json.template` pair exists so the installer can point OpenCode at `global/` as `OPENCODE_CONFIG_DIR` and so users can override the template locally.
3. The committed (but gitignored) `global/opencode.json` carries machine-specific paths and a permissive `permission: allow` override for one developer.

The three layers are not documented; new contributors routinely edit the wrong file. The hardcoded absolute path inside `global/opencode.json` violates AGENTS.md ("do not hardcode user paths"), and the validator cannot distinguish a deliberate local override from a regression because the file carries no marker.

`global/.gitignore` excludes `package.json`, `package-lock.json`, and `bun.lock` even though `global/package.json` and `global/package-lock.json` exist in the working tree. This means the kit cannot be reliably installed on a fresh clone: a contributor who clones and runs `npm install` at the root resolves `@opencode-ai/plugin` only because root dependencies happen to bring it in transitively.

Stakeholders: the kit's maintainers, downstream consumers who run `npm run install:global`, and the validator (which currently flags every local override as a strict-mode failure).

## Goals / Non-Goals

**Goals:**

- Document the three-layer config model so contributors know which file to edit.
- Allow `permission: allow` and machine-local paths under an explicit `machineOverride` marker without breaking strict validation.
- Remove the hardcoded absolute Windows path from the committed `global/opencode.json`.
- Resolve the `global/.gitignore` contradiction so the kit can be cloned fresh and bootstrapped reliably.

**Non-Goals:**

- Change `permission: ask` (the template default).
- Replace OpenCode's loader semantics.
- Move dependency management out of `global/` if it requires touching CHG-001 / refactor-tools-split-candidate.

## Decisions

### D1 — Three-layer config model with `machineOverride` marker

**Choice**: Document `opencode.json` (workspace), `global/opencode.json.template` (portable default), `global/opencode.json` (machine override). The installer writes `machineOverride: true` into the provisioned override. The validator treats override warnings under that marker as info.

**Rationale**: The marker is the cheapest way to preserve the existing local-override workflow while restoring strict-mode pass-through. It also gives contributors a clear answer to "where do I edit configuration?".

**Alternatives considered**:

- *Forbid `permission: allow` entirely*: rejected; one developer's local UX depends on it.
- *Move all overrides into a separate `opencode.local.json` overlay*: rejected; OpenCode's config schema does not support overlay composition in every version.

### D2 — `global/opencode.local.json` overlay pattern for machine paths

**Choice**: Document that machine-specific paths (e.g. the local `codebase-memory-mcp.exe` binary) live in `global/opencode.local.json` next to `global/opencode.json`. The committed `global/opencode.json` shows an empty or commented placeholder.

**Rationale**: The overlay pattern keeps the committed file machine-neutral while allowing one developer to keep the path they have working today. The README documents how to copy the placeholder into the overlay.

**Alternatives considered**:

- *Delete the absolute path from the committed file and require every developer to edit it manually*: rejected; the documented overlay is friendlier.
- *Hardcode a Linux path*: rejected; not portable.

### D3 — Option A: keep `global/package.json` tracked, fix `.gitignore`

**Choice**: Keep `global/package.json` and `global/package-lock.json` tracked. Remove the `package.json`, `package-lock.json`, and `bun.lock` entries from `global/.gitignore`. Confirm with `git ls-files global/package.json global/package-lock.json` whether they are tracked today.

**Rationale**: Option A is the smallest change that fixes the contradiction. Option B (hoist deps to root) touches CHG-001's refactor surface and breaks the `global/opencode.json.template` model that depends on a self-contained `global/`.

**Alternatives considered**:

- *Option B (hoist to root)*: rejected; out of scope for this change.
- *Delete `global/node_modules/`*: still pending `git ls-files` confirmation; covered as a follow-up task.

### D4 — Validator honors `machineOverride`

**Choice**: `tools/validators/opencode-config.ts` reads the `machineOverride` field. When present and `true`, the validator downgrades the wildcard-allow and tool-wide-allow warnings to `info` (printed as `INFO:` rather than `WARN:`). `validate:strict` keeps `WARN` as fail but does not count `INFO`.

**Rationale**: The marker is explicit and reversible. Downgrading to `info` rather than suppressing entirely keeps the diagnostic visible.

**Alternatives considered**:

- *Suppress entirely*: rejected; the developer should still see what their override does.
- *Use a different marker name*: rejected; `machineOverride` matches the installer's existing wording in `console.log` output.

## Risks / Trade-offs

- **[Risk] Downgrading `permission: allow` under `machineOverride` hides accidental regressions** → Add a regression test that asserts `permission: allow` without `machineOverride: true` still fails strict mode.
- **[Risk] Overlay pattern may not survive OpenCode schema changes** → Document the overlay as "best-effort, recreate if OpenCode rejects it"; add a fixture test that constructs `opencode.local.json` and confirms the validator treats it as opaque (does not double-warn).
- **[Risk] Removing `global/.gitignore` entries makes `bun.lock` start appearing in `git status`** → Confirm with `git ls-files`; if not tracked, leave the entry out of `.gitignore`.

## Migration Plan

1. Confirm `git ls-files` status of `global/package.json`, `global/package-lock.json`, `global/node_modules/`.
2. Update `tools/install-opencode-global.ts` so the provisioned `global/opencode.json` includes `"machineOverride": true`.
3. Add the `machineOverride` rule to `tools/validators/opencode-config.ts` and a regression test.
4. Update `global/opencode.json` (the committed-but-gitignored working copy) to drop the hardcoded `C:/Users/Sergey/...` path; leave a placeholder block.
5. Create `global/opencode.local.json.example` documenting the overlay.
6. Update `global/.gitignore` per Option A.
7. Update README and `openspec/project.md` with the layering documentation.
8. Run `npm run validate:strict` and `npm test`; both must pass.

## Open Questions

- Should the overlay pattern become a formal OpenSpec capability (`machine-config-overlay`)? Recommendation: yes if downstream consumers ask for it; defer until at least one consumer needs it.
- Does Option A actually solve the freshness issue, or do we need Option B in a separate change? Recommendation: Option A is sufficient for now; revisit if a downstream consumer reports trouble.