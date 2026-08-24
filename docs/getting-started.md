# Getting Started

Use this guide to install `opencode-dev-kit` on a new machine or attach it to a new project.

The installed kit applies one working philosophy: high quality, shortest verified path, autonomy until a real owner boundary, maximum token economy, evidence-backed continuous improvement, and proactive correction or removal of concrete impediments without weakening safety.

## Install Globally

From the kit repository:

```sh
npm run install:mcps -- --dry-run
npm run install:mcps
npm run install:global -- --dry-run
npm run install:global
```

On Windows, if PowerShell blocks `.ps1` shims, use `npm.cmd run ...` or `node tools/install-code-intelligence-mcps.ts` / `node tools/install-opencode-global.ts`. Do not change execution policy.

`npm run setup:global` combines the MCP and global-config installation steps. The MCP helper installs only missing Serena and Codebase Memory executables; use `npm run install:mcps -- --check` to verify them without mutation.

By default, the global-config installer installs every repository skill and agent globally through the single `all` profile. The repository does not maintain smaller profile splits.

Restart OpenCode after installation because skills, agents, and config-time files are loaded at startup.

## Bootstrap A Project

Preview the target project changes:

```sh
npm run init:project -- --target <project-path>
```

Write the bootstrap files:

```sh
npm run init:project -- --target <project-path> --mode write
```

Then check readiness:

```sh
npm run doctor -- --project <project-path> --require qualification
```

Use `--require structural` for bootstrap integrity or `--require unattended` for the stricter unattended mission boundary. A selected gate exits `0` on pass, `2` when blocked, and names every blocker. Running without `--require` keeps the informational structural-exit contract for compatibility.

## First Task Prompt

The active global instructions provide runtime authority; a target project does not need a copy of the kit-relative conceptual-loop file. Start with a bounded outcome and let risk select the proportional path:

```text
Implement <task> as the smallest complete working slice. Prove the happy path through observable execution and run focused project validation. Load Material safety for a named Material boundary; use qualification and fresh critical-only SDET only for explicit/project-required qualification or a reachable named critical consequence.
```

## Before Broad Work

Gather compact deterministic context before reading many files:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

Use the inventory as navigation evidence, not as a substitute for source or tests.
