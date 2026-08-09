# Core

- Installable OpenCode development kit, not an application. Reusable runtime artifacts live under `global/`; repository-maintainer policy is `REPO_AGENTS.md`; `global/AGENTS.md` is the installed runtime authority.
- Main domains: `global/skills/` and `global/agents/` model-facing artifacts; `instructions/` copyable canonical guidance; `templates/` project bootstrap; `tools/` deterministic TypeScript installers, validators, inventories, and OpenSpec gates; `openspec/` source requirements and change history.
- Preserve the distinction between committed portable `global/opencode.json.template`, gitignored machine-local `global/opencode.json`, and workspace `opencode.json`.
- Project-neutrality is mandatory for reusable workflow cores; project commands and identity belong in thin adapters.
- Read `mem:tech_stack` for runtime/tooling, `mem:conventions` for implementation policy, `mem:suggested_commands` for common operations, and `mem:task_completion` for validation gates.