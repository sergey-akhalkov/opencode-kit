## Why

The kit ships three overlapping configuration files (`opencode.json`, `global/opencode.json`, `global/opencode.json.template`) without a clear layering contract. `global/opencode.json` is gitignored but its committed working-tree copy contains a hardcoded absolute Windows path (`C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe`) and `permission: allow`, both of which fail the kit's own `validate:strict` gate. `global/.gitignore` excludes `package.json` and `package-lock.json` even though those files exist in the directory. The installer `tools/install-opencode-global.ts` provisions `global/opencode.json` from the template on first run but does not mark user overrides so the validator cannot distinguish safe defaults from local UX overrides.

## What Changes

- Add a documented `machineOverride: true` field that `tools/install-opencode-global.ts` sets when it writes the user's first `global/opencode.json`. The validator SHALL treat `permission: allow` and other warnings under `machineOverride: true` as advisory instead of strict errors.
- Refactor the three OpenCode config files into a single authoritative layering:
  - `opencode.json` (repo root) — the workspace where maintainers run OpenCode in this repo.
  - `global/opencode.json.template` — the portable safe default that ships with the kit.
  - `global/opencode.json` — the machine-local override (gitignored), provisioned from the template on first install.
- Move the hardcoded `codebase-memory-mcp.exe` path out of the committed `global/opencode.json` and into a documented `opencode.local.json` overlay pattern. Document the overlay in `README.md` and in `openspec/project.md`.
- Decide between two options for the dependency layering:
  - Option A: Keep `global/package.json` and `global/package-lock.json` tracked; remove them from `global/.gitignore`. This is the simpler change.
  - Option B: Delete `global/package.json`, hoist `@opencode-ai/plugin` into the root `package.json`, and remove `global/node_modules/` from the working tree.
  - **Recommended**: Option A. Option B touches too many files for this change.

## Capabilities

### New Capabilities

- `library-config-portability`: defines the layering between repo-root `opencode.json`, `global/opencode.json.template`, and `global/opencode.json`, plus the `machineOverride` marker and the documented overlay pattern for machine-local paths.

## Impact

- `tools/install-opencode-global.ts` writes `machineOverride: true` into the provisioned `global/opencode.json`.
- `tools/validators/opencode-config.ts` (or current validator location) treats `permission: allow` under `machineOverride: true` as an info-level note instead of a strict-mode warning.
- `global/.gitignore` no longer ignores `package.json` and `package-lock.json` if Option A is chosen.
- README gains a "Configuration layering" subsection explaining the three layers and how to use `opencode.local.json`.
- The hardcoded `C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe` path is moved into a documented overlay (or a separate `global/opencode.local.json` file referenced by `global/opencode.json`).