# Getting Started

Use this guide to install `opencode-dev-kit` on a new machine or attach it to a new project.

## Install Globally

From the kit repository:

```sh
npm run install:mcps -- --dry-run
npm run install:mcps
npm run install:global -- --dry-run
npm run install:global
```

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
npm run doctor -- --project <project-path>
```

## First Task Prompt

The active global instructions provide runtime authority; a target project does not need a copy of the kit-relative conceptual-loop file. Start with a bounded outcome and let risk select the proportional path:

```text
Implement <task> as the smallest complete working slice. Prove the happy path through observable execution and run focused project validation. Use Material qualification and fresh critical-only SDET only when a named Material boundary, explicit stable request, or project policy requires it.
```

## Before Broad Work

Gather compact deterministic context before reading many files:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

Use the inventory as navigation evidence, not as a substitute for source or tests.
