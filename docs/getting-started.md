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

The global-config installer defaults to the minimal `core` profile. Use `npm run install:global -- --profile core-beads` for the complete core surface plus the on-demand one-project Beads portfolio bridge, or `npm run install:global -- --profile all` for the complete compatibility surface, including the autonomous roadmap mission launcher, PTY bridge, completion guard, and portable mission binaries. `core` omits Beads; `core-beads`, `all`, and unprofiled full source discover the same optional skill once. Profile selection does not install the Beads binary or register or activate a project. Generated profiles live under `global/.runtime-profiles/`; replaced roots are retained as rollback backups.

Preview the exact `core-beads` surface without mutation:

```sh
npm run install:global -- --preview-profile --profile core-beads
```

Restart OpenCode after installation because skills, agents, plugins, and config-time files are loaded at startup. A running process cannot claim a newly selected `core-beads` skill. Follow the pinned Windows binary and one-project lifecycle in `tools/windows/README.md#optional-beads-portfolio-bridge`; it does not use raw `bd`, vendor setup, or remote operations. After an `all` install, `/mission-status` is read-only, `/mission-stop` records graceful stop intent, and cockpit Kill is an emergency hard stop that can leave paused-unknown state. Roll back to the installer-printed prior profile or prior `OPENCODE_CONFIG_DIR`, restart OpenCode, and run `npm run doctor -- --require unattended`.

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
