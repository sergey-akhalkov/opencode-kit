# opencode-dev-kit

[![Validate CI](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml)

Installable OpenCode development kit for reusable AI-assisted engineering workflows across projects.

## What This Is

`opencode-dev-kit` packages reusable OpenCode skills, read-only reviewer agents with a scoped feedback-ledger write exception, bounded worker agents, project templates, instruction templates, and deterministic helper tools. It applies one operating philosophy across technology stacks: quality without proxy substitution, shortest verified path, autonomy until a real owner boundary, maximum token economy, evidence-backed continuous improvement, and proactive removal of concrete impediments within safety and scope.

The kit optimizes one path: main-default production authorship, run-observe-correct, accepted-scope completion, applicable validation, and verified outcome. RC/stable qualification and independent critical SDET are conditional. Optional reviewers never become stage gates.

## Working Philosophy

- Preserve high quality: move quickly without weakening correctness, safety, proof, or honest outcome semantics.
- Take the shortest verified path to the goal and work autonomously until a key owner decision, access, or protected action is actually required.
- Continuously reduce context, token use, tool calls, repetition, and output without dropping material facts.
- Use observed evidence for ongoing self-improvement. Fix, narrow, or remove concrete rules, tools, and process steps that obstruct this philosophy, but never use optimization to expand product scope or bypass safety and owner authority.

## Universal Development Loop

The conceptual development loop lives in the single canonical file `instructions/universal-development-loop.md`. Its current 11-step list, Quality Defaults, and Output Shape are defined there; token and time policy lives in the always-loaded operating priorities and `docs/token-economy.md`. Kit-level pointer notes live in `docs/universal-development-loop.md`. Technology adapters may change commands and constraints, but not the conceptual loop; `npm run validate` enforces the single-source rule for that loop body.

Ordinary Small routing lives in the kit's global `AGENTS.md` and reports verified `Outcome`. `change-ready-sdlc` supplies Material safety detail and uses `Development-Stage: development | MVP | RC<n> | stable` only for explicit/project-required or named-critical-risk qualification. Other loader-visible sources may coexist and must be diagnosed rather than assumed absent. UDL is conceptual guidance, not a second competing process.

## Contents

- `global/`: kit-owned custom OpenCode config directory pointed to by `OPENCODE_CONFIG_DIR`. Holds the canonical `principles-of-work.md`, operational `AGENTS.md`, `skills/`, `agents/`, `plugin/`, and machine-local `opencode.json`; it does not prove that host-default or managed sources are absent.
- `docs/kaizen.md`: operator guide for the machine-local cross-project Kaizen inbox, lifecycle, privacy bounds, rollback, cleanup, and maintained proof.
- `docs/feedbacks/`: degraded Markdown transport and historical feedback ledger used when the loaded Kaizen inbox is unavailable before persistence.
- `instructions/`: copyable instruction templates for global/project `AGENTS.md`, reviewer contracts, evidence discipline, and porting.
- `templates/`: project bootstrap and CI templates for applying the Universal Development Loop to another repository.
- `profiles/`: maintained `core` and `all` install manifests for bounded or full runtime surfaces.
- `tools/`: TypeScript maintenance validation, install, project bootstrap, doctor, inventory, code-quality, OpenSpec gates, and session-delivery tooling for the documented kit schema.
- `global/bin/`: explicit project-neutral workflow cores available with the resolved global kit source, including deterministic OpenSpec archive and exact staged-candidate validation. The directory is outside OpenCode custom-tool discovery; project package managers and validation commands remain thin adapter argv.

## Prerequisites

- Node `>=24` is required because repository tooling runs TypeScript entrypoints directly.
- `npm test` uses Node's `node:sqlite` for session-delivery plugin fixtures; Node may print an `ExperimentalWarning` while the API remains experimental.

## Install

### Global Install

Before install, record the exact prior `OPENCODE_CONFIG_DIR` state so activation can be rolled back honestly:

1. Capture whether `OPENCODE_CONFIG_DIR` is currently set.
2. If set, record the exact prior value (absolute path string).
3. If unset, record that the prior state was unset.
4. Keep that owner-recorded note outside the installer. The installer does **not** persist prior state automatically and does not create a restore state store.

Install the two code-intelligence MCP executables, then add this repository as OpenCode's kit-owned custom configuration source:

```sh
npm run install:mcps -- --dry-run
npm run install:mcps
npm run install:global
```

On Windows, if PowerShell resolves `npm` or `openspec` to a blocked `.ps1` shim, use `npm.cmd` / `openspec.cmd` or the repository `node tools/...` entrypoints. Do not change execution policy. The same commands are:

```bat
npm.cmd run install:mcps -- --dry-run
npm.cmd run install:mcps
npm.cmd run install:global
node tools/install-code-intelligence-mcps.ts --dry-run
node tools/install-opencode-global.ts
```

Use `npm run setup:global` as the one-command equivalent of `install:mcps` followed by `install:global`.

`install:mcps` preserves working installations instead of upgrading them. It installs missing Serena through the official `uv tool install -p 3.13 serena-agent` command, initializes Serena, and installs missing Codebase Memory through the supported `npm install --global codebase-memory-mcp` package. Use `--check`/`--audit` for a read-only availability check or `--dry-run`/`--what-if` to preview missing-package commands. Serena requires `uv`; if `uv` is unavailable, the helper fails before mutation with the official installation URL.

`global/` is the complete kit-owned source for principles, operational routing, skills, agents, plugins, and portable binaries. `npm run install:global` materializes the selected profile under `global/.runtime-profiles/` and points `OPENCODE_CONFIG_DIR` at that generated root. The default `core` profile is minimal and includes the read-only specialist-team advisor, its explicit catalog plugin, and the composed `session-env` plugin with Kaizen commands; use `--profile all` for the full compatibility surface, including the autonomous roadmap mission runtime. `global/opencode.json.template` remains the committed full-catalog compatibility source (GPT-5.6 Sol main model, Serena and Codebase Memory MCPs, compaction, watcher, tool output, `permission: allow`). The generated `all` config retains its model and plugin tuples while replacing source/runtime placeholders with absolute installed paths. Personal standing host authorization belongs only in gitignored `opencode.local.instructions.md`. Restart OpenCode after any profile change; use `npm run opencode:sources` to inventory safe source locations and collisions. Kaizen operation and rollback are documented in `docs/kaizen.md`.

Options:

- (default): materialize the `core` profile. On Windows, persist `OPENCODE_CONFIG_DIR` to its generated root via `setx` when the measured value is within the safety limit. On macOS/Linux, print a safe `export` line only; use `--persist-script <file> --profile core` for generated-profile convergence.
- `--profile all`: materialize the full compatibility and autonomous-roadmap-mission surface.
- `--check` or `--audit`: exit `0` if `OPENCODE_CONFIG_DIR` points at a complete selected profile, `1` otherwise. Recommended after restart/activation.
- `--print`: preview the target path and the platform command without changing anything. Preview only; not a recovery path for over-limit Windows values.
- `--preview-profile --profile <core|all>`: print the exact proposed owners and risks without mutation.
- `--plan-migration --profile <core|all>`: print exact additions/removals and rollback details without mutation.
- `--unset`: remove the persisted `OPENCODE_CONFIG_DIR` value.
- `--persist-script <file> --profile <core|all>`: materialize/validate that generated profile and ensure `<file>` contains exactly one POSIX-safe export to it. Omitting `--profile` retains legacy source-global persistence. Re-runs with the same desired line are no-ops; ambiguous assignments fail closed. Profile-file mutation uses same-directory temp + fsync + raw-byte preimage check + atomic rename; invalid UTF-8 and symlink/non-regular targets fail closed before mutation.
- `--unset-script <file>`: remove every supported standalone `export OPENCODE_CONFIG_DIR=...` line from `<file>` (POSIX profile); ambiguous lines fail closed without rewriting. Uses the same failure-atomic replacement policy as `--persist-script`.
- `--dry-run` or `--what-if`: preview the default mode without setting anything.
- Mode exclusivity: `--check`/`--audit`, `--print`, `--unset`, `--persist-script`, `--unset-script`, `--preview-profile`, and `--plan-migration` are mutually exclusive (including aliases and repeats). Conflicting modes fail before any validation, process call, profile, config, or environment mutation.

Restart OpenCode after installing; the running process keeps the old environment until restarted. On Windows, GUI apps launched from Explorer may require logoff/logon to inherit the new user environment variable.

Windows `setx` truncates user environment variables at 1024 characters. The installer measures the selected source/generated-profile path and refuses to call `setx` when the resulting `OPENCODE_CONFIG_DIR=<value>` line exceeds 900 characters. Over-limit recovery is to relocate or clone the kit to a shorter path, re-run `install:global`, then verify with `--check`. Do **not** run `setx` manually with the over-limit path, and do not treat `--print` output as a safe recovery command.

On macOS/Linux, the default mode prints the safe generated-`core` export line only and does not persist. To materialize and persist it, run `npm run install:global -- --persist-script ~/.bashrc --profile core` (or use `all` and another shell profile); the helper converges to exactly one desired export line, is safe to re-run, and replaces the shell profile failure-atomically. Omitting `--profile` retains legacy source-global persistence. The matching `--unset-script <file>` removes every matching export line. Restart the shell and verify with `--check` after activation.

Important: `OPENCODE_CONFIG_DIR` adds the kit custom directory with documented precedence; it is not evidence that `~/.config/opencode`, project, managed, explicit, or inline sources stopped loading. Keep kit-specific provider/MCP/permission config in local `global/opencode.json`, personal preferences in local `global/opencode.local.instructions.md`, and inspect loader-visible source locations with `npm run opencode:sources`. Exact precedence claims require current documentation or isolated runtime proof for the artifact class.

#### Runtime activation rollback

Runtime activation rollback restores only the active config pointer and reloads OpenCode. It does not mutate the repository candidate.

1. Restore the exact prior `OPENCODE_CONFIG_DIR` value you recorded before install.
2. If the prior state was unset, use `npm run install:global -- --unset` (or the matching profile `--unset-script` path) so the variable is removed rather than pointed at an invented path.
3. Restart OpenCode so the restored environment is loaded.
4. Do not treat activation rollback as full change rollback of repository artifacts.

#### Autonomous roadmap missions

Install `all` and restart OpenCode before using `/mission-run`, `/mission-resume`, `/mission-status`, or
`/mission-stop`. Run and resume open the local cockpit and fail closed if it is unavailable. Status reads
durable state without mutation. Stop records graceful stop intent and allows boundary cleanup; cockpit **Kill**
is an emergency hard stop and may leave `paused-unknown`, so inspect status before resuming.

The launcher and executor accept fixed contained inputs rather than arbitrary executable paths or shell
fragments. The executor uses the current loopback OpenCode runtime and does not start a nested server. The
pinned configured route is `openai/gpt-5.6-sol` under profile `quality-independent` with variant `xhigh`.
For rollback, restore the installer-printed prior generated profile (or prior `OPENCODE_CONFIG_DIR`), restart
OpenCode, and run `npm run doctor -- --require unattended`.

Keep project-specific skills out of `global/` unless their descriptions explicitly scope them to that project. Global skills are visible in unrelated repositories through the skill catalog, so broad or local-product triggers add avoidable routing noise.

### Configuration Layering

The kit owns three OpenCode config files within a broader additive OpenCode source model:

- `opencode.json` (repo root) — the workspace config. OpenCode loads this when run inside this repository. It keeps workspace-specific settings such as the local model override but does not override the global `permission: allow` policy.
- `global/opencode.json.template` — the portable autonomy-first default that ships with the kit. It declares the GPT-5.6 Sol main model default, Serena and Codebase Memory MCPs, compaction, watcher, tool output, and `permission: allow`. It provides permissive tool access, not hard sandbox enforcement. Never edit this file for machine-specific overrides.
- `global/opencode.json` — the machine-local config (gitignored). Provisioned from `global/opencode.json.template` on first install and editable for local provider, MCP, permission, and review-environment settings.

The validator identifies the machine-local layer by its gitignored `global/opencode.json` path and reports broad local permission overrides as `INFO:` notes. Never add unsupported marker fields to OpenCode config; every field must exist in the official OpenCode schema.

Model profiles are explicit launch-time overlays, not a fourth automatically loaded base layer. The committed profiles under `global/model-profiles/` contain only `$schema`, `model`, `small_model`, and complete per-agent `model`/`variant` routes. They do not change permissions, tools, providers, MCPs, prompts, credentials, or reusable agent Markdown. Select one profile for a new OpenCode process:

```sh
npm run opencode:profile -- quality-independent
npm run opencode:profile -- quality-independent --check
npm run opencode:profile -- quality-independent --explain
npm run opencode:profile -- quality-independent -- --model xai/grok-4.6
```

The presets have distinct purposes:

- `quality-independent` is the recommended creator/challenger split. Primary creation, implementation, and compaction use `openai/gpt-5.6-sol` with `xhigh`; `troubleshooter` inherits the invoking primary model; discovery, SDET, and independent review use `xai/grok-4.6` with `high`.
- `sol-only` routes every governed agent to `openai/gpt-5.6-sol` with `xhigh`.
- `grok-only` routes every governed agent to `xai/grok-4.6` with `high`.

For a personal complete matrix, create `global/model-profiles/local/<id>.json` and select it as `local:<id>`. Local JSON files are gitignored. `<id>` resolves only a committed profile and `local:<id>` resolves only a local profile, so equal filenames cannot silently shadow each other. Run `--check` before launch and `--explain` to inspect the selected source, resolved path, top-level models, and stable sorted agent matrix.

The launcher supplies the selected JSON only to the child process through `OPENCODE_CONFIG_CONTENT`; it never rewrites repository, project, global, machine-local, shell-profile, or managed configuration. It refuses a non-empty inherited `OPENCODE_CONFIG_CONTENT` rather than overwriting or printing it. The inline profile overrides ordinary project model configuration, while upstream administrator-managed configuration remains authoritative. OpenCode loads configuration once, so switching profiles requires a new process; there is no hot reload.

Profile selection is a startup default, not a lock. `/models` and an explicit OpenCode `--model` may intentionally diverge. The actual-runtime sources of truth are OpenCode's current-model display, `--explain` for the startup matrix, and each agent's `Effective Model` evidence. To roll back profile use, stop the profile-launched process and start `opencode` directly; no configuration restoration is required.

For machine-specific provider paths (for example an absolute Windows path to a local MCP binary), edit the gitignored `global/opencode.json` directly. To keep a separate optional overlay, create a schema-valid file and load it explicitly through OpenCode's supported `OPENCODE_CONFIG` mechanism:

1. Copy `global/opencode.local.json.example` to `global/opencode.local.json` (the overlay itself is gitignored).
2. Add only official schema fields for machine-local provider, MCP, or permission rules.
3. Set `OPENCODE_CONFIG` to that file when starting OpenCode; do not assume the overlay is auto-loaded.

Validate any overlay against `https://opencode.ai/config.json` before loading it.

## Bootstrap A Project

Preview the files that would connect a target project to the Universal Development Loop:

```sh
npm run init:project -- --target <project-path>
```

Write the bootstrap files when the preview is correct:

```sh
npm run init:project -- --target <project-path> --mode write
```

The bootstrap writes a project `AGENTS.md`, optional `opencode.json`, `docs/feedbacks/README.md`, and `opencode-dev-kit/adapter.json` plus `opencode-dev-kit/validation.md`. The adapter records technology-specific commands; it does not define a separate workflow. Shared runtime authority remains the active global `principles-of-work.md`, operational `AGENTS.md`, and conditional `change-ready-sdlc` skill; project bootstrap supplies adapters only.

#### Project bootstrap rollback

If bootstrap must be undone:

1. Restore any backups created for pre-existing files the bootstrap overwrote.
2. Remove only files proven created by that bootstrap run.
3. Do not perform broad cleanup of unrelated project content.

#### Doctor structural diagnostic

Run the structural/bootstrap diagnostic after bootstrapping or install:

```sh
npm run doctor -- --project <project-path>
```

Doctor is a structural diagnostic, not lifecycle readiness certification. Without an explicit gate, it remains informational. Report version 2 separates structural severity (`status: pass|warn|blocked`) from qualification and unattended readiness. Automation must select the intended diagnostic contract explicitly:

Qualification remains machine-readable through `qualificationStatus: pass|blocked` and per-check `blocksQualification`. Only `qualificationStatus: blocked` or `blocksQualification: true` blocks RC/stable qualification; advisory warnings alone do not.

```sh
npm run doctor -- --project <project-path> --require structural
npm run doctor -- --project <project-path> --require qualification
npm run doctor -- --project <project-path> --require unattended
```

For a selected gate, exit `0` means pass, exit `2` means blocked, and exit `1` means invalid arguments or diagnostic failure. JSON exposes stable `blockers.structural`, `blockers.qualification`, and `blockers.unattended` arrays plus `requiredGate`; Markdown prints the selected result and all blockers beside the status. Structural warnings pass the structural gate. Without `--require`, the existing structural exit remains: qualification can be blocked while an advisory-only report exits `0`.

Doctor composes the privacy-safe runtime-source inventory. Same-name canonical OpenSpec propose/apply/archive skill or command collisions with unknown precedence block qualification and unattended gates and report their redacted locations. Additive config and instruction layering remains visible under `runtimeSources.collisions` but does not block by multiplicity alone. Doctor does not read provider values for collision discovery, execute project validation commands, or claim which loader source wins. Use `npm run opencode:sources -- --help` for the standalone inventory CLI contract.

Doctor inspects the kit custom directory selected by nonblank `OPENCODE_CONFIG_DIR`, or the host default `~/.config/opencode` when no custom directory is selected. This inspection does not claim other runtime sources are absent. Required kit authority is `principles-of-work.md`, structurally conforming `AGENTS.md`, and `skills/change-ready-sdlc/SKILL.md`: nonempty regular files with real Markdown sections, valid scalar skill frontmatter, and an ordered lifecycle skeleton through development, MVP proof, critical SDET when applicable, RC validation, and stable handoff. Missing, malformed, or lifecycle-incomplete required authority blocks qualification; source-path equality and template markers are informational only.

When the inspected project is this kit checkout, doctor selects the self-hosted contract only from the exact `opencode-dev-kit` package identity, `REPO_AGENTS.md`, conforming `global/` runtime authority, and concrete package `test` plus `validate:strict` scripts. That contract uses the repository-native authority and validation commands instead of requiring consumer `AGENTS.md` or `opencode-dev-kit/adapter.json` files. A similar directory name or partial layout does not activate the exception; ambiguous and ordinary projects remain consumer-safe and keep the project AGENTS plus adapter/validation requirements.

Project validation qualification accepts either complete concrete `opencode-dev-kit/adapter.json` validation entries or a complete `opencode-dev-kit/validation.md` Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build. A command is resolved when it is concrete or records reasoned non-applicability as `N/A - <reason>` (or Command `N/A` with non-placeholder Notes). Bare `N/A`, `unknown`, `TBD`/`TODO`, replace-me placeholders, and blanks remain unresolved. Missing project bootstrap/AGENTS, neither validation source complete, missing required authority, invalid explicit/local config, invalid project path, or unsupported Node block qualification. Empty `--project=` and whitespace-only `--project` values error rather than selecting the current directory. Doctor does not invent commands or score lifecycle capability.

`doctor` and `opencode:sources` compare the committed `agent.compaction.prompt` template with the active machine-local managed copy. They emit only stable SHA-256 values and semantic marker IDs, classify the field as `same`, `different`, `missing`, or `unknown`, and name the explicit synchronization/restart boundary. They never print prompt bodies, provider options, credentials, or mutate the active copy.

Evidence-heavy OpenSpec changes may keep a bounded `evidence-index.json` with named lanes, candidate identity, first causal failure, successor-unlock evidence, current terminal bundle, terminal status, and retry condition. Resolve one lane before reading raw bundles:

```sh
node tools/evidence-index.ts --index <change-root>/evidence-index.json --lane <lane-name>
```

The resolver reads bounded index metadata and verifies only the selected lane's referenced regular files. Its output excludes retry text and bundle content; a missing reference fails only that selected lane.

Before broad AI work in a target repository, gather a compact deterministic map:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

## Token Economy

- The repository-level maintainer rules live in `REPO_AGENTS.md`. `global/principles-of-work.md` is the runtime philosophy owner and `global/AGENTS.md` is the operational instruction file; other loader-visible instructions must be inventoried for collisions. Scripts that previously referenced the root `AGENTS.md` must use `REPO_AGENTS.md` instead.
- Use the Universal Development Loop instead of choosing among competing workflows.
- Use `project:inventory`, `code-quality:inventory`, `glob`, and `grep` before broad file reads.
- Install the full kit by default, but load heavyweight skills/subagents only when they reduce total work.
- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` covers evidenced isolated production-only slices with exact non-overlapping write scope, representative proof boundary, clear acceptance criteria, and a focused validation gate. Keep research, questions, ordinary review-only work, and proven-inert content direct in the main session.
- Run focused validation first; run broad validation when the change crosses boundaries.
- Launch optional reviewers after current proof only when concrete risk, project policy, or the owner makes them useful. Reviewer output informs main disposition but never gates completion or qualification.
- Convert repeated manual counting, drift checks, or report assembly into deterministic helpers.

Inspect this kit's instruction context and deterministic quality checks with:

```sh
npm run instruction:inventory -- --format markdown
npm run instruction:canonicalize -- --check .
```

The inventory reports startup-visible candidates, discovery metadata, on-demand
bodies, and unknown sources separately without turning those measurements into a
quality verdict. The canonicalization check reports exact duplicate ownership and
reviewed mechanical fixes without mutating source.

### Manual Skills

Manual copy of change-ready lifecycle skills, write-capable lifecycle agents, or reference-based reusable reviewers is incomplete unless the runtime also loads `principles-of-work.md` and the shared operational contracts from the same kit source's `AGENTS.md` (Ordinary Small routing, Material triggers, Universal Task Briefing Contract, shared reviewer invariants, and feedback-ledger policy). Resolve the kit source to `OPENCODE_CONFIG_DIR` when set; otherwise inspect the host default. Do not infer that another source is bypassed. Prefer full-kit installation and use `npm run opencode:sources` to detect same-name collisions; selective copy alone does not imply standalone completeness.

OpenCode skills are loaded from project or global skill folders. Copy selected skill folders from `global/skills/` into one of these locations:

- Project: `.opencode/skills/<name>/SKILL.md`
- Global: `<active-global-config-dir>/skills/<name>/SKILL.md`

Alternatively, add this repository's skills path to an OpenCode config:

```json
{
  "skills": {
    "paths": ["<path-to-agents-and-skills>/global/skills"]
  }
}
```

Use an absolute path or a path relative to the config file that declares it.

### Manual Agents

The same shared-runtime prerequisite as Manual Skills applies: reference-based reviewers and lifecycle agents require the runtime to load `principles-of-work.md` and shared contracts from the same kit source's `AGENTS.md`. `OPENCODE_CONFIG_DIR` selects the kit custom source but does not prove the host default is bypassed. Prefer full-kit install when using those agents and inspect collisions before qualification.

OpenCode agents are loaded from project or global agent folders. Copy selected files from `global/agents/` into one of these locations:

- Project: `.opencode/agents/<name>.md`
- Global: `<active-global-config-dir>/agents/<name>.md`

Copy only useful agents. They are read-only validators/workers by default with scoped `docs/feedbacks/**` writes through `complain`; `implementation-worker` and `sdet-quality-engineer` are validated production-only and test-only writers, `troubleshooter` has all OpenCode tool permissions while its role contract remains diagnosis-only with no production/test authorship, and `final-candidate-reviewer` is an optional read-only risk reviewer.

The `docs/feedbacks/**` path boundary is a model contract, not runtime permission enforcement; `complain` remains the required contract for inbox routing, fallback entry shape, and privacy checks. The loaded Kaizen tool provides append-only inbox semantics, while direct Markdown remains a degraded path rather than hard filesystem enforcement.

Global install is enough for fresh projects. When Markdown fallback is required and `docs/feedbacks` is missing, agents use the scoped edit/add-file path to create `docs/feedbacks/<agent-or-skill-name>.md`; successful inbox capture creates no fallback file. Project bootstrap only pre-creates a README for discoverability.

### Manual Commands

OpenCode prompt commands are configured through `opencode.json` under `command`. The standard `opsx-propose`, `opsx-apply`, `opsx-archive`, `kaizen-status`, and `kaizen-triage` commands are globally owned by this kit and must not be copied into a project under the same names. Project-specific commands remain differently named domain helpers.

`opsx-propose` reports structural artifact readiness separately from semantic implementation readiness. Decision-material planning uses one bounded original-request-grounded `implementation-readiness-reviewer` episode before semantic readiness is represented; an exact Ordinary Small change may use a reviewed exemption. Deterministic OpenSpec gates validate explicit structure only, and `final-candidate-reviewer` remains optional and post-proof.

Project bootstrap writes only runtime-authority, config, feedback, validation, and adapter files. It never copies the canonical OpenSpec skills or commands. Preview and doctor report legacy same-name overlays as unattended-incompatible safe paths and preserve them for manual migration.

`opencode-dev-kit/adapter.json` keeps ordinary validation command discovery and a separate unattended contract. Unattended mode requires aggregate `validationArgv` as an argv array, canonical global workflow ownership, explicit checkpoint support, and per-mission authorization for local commits; it never infers a shell or package manager.

### Manual Instructions

Copy selected files from `instructions/` into a global or project `AGENTS.md` or another instruction file. Keep only rules that are durable for that scope.

## Validate

Run structural validation and fixture-based acceptance checks after changing library artifacts:

```sh
npm run validate
npm test
```

The validator checks skill and agent frontmatter shape, skill trigger/output contracts, compact reviewer leaf contracts, README catalog/routing sync, repo/project-template autonomy and remote/destructive guards, TypeScript-only development policy, deterministic helper automation policy, reusable reviewer permission policy, informational broad-permission diagnostics for the two intentional global config paths, warnings for broad mutation-capable `allow` elsewhere, optional project-neutral anchors passed via `--forbidden-anchor`, trailing whitespace, and warning-level workflow findings for implementation artifacts that omit observable happy-path proof and independent risk-driven testing.

This repository validator is a policy and consistency gate, not a complete implementation of the OpenCode JSON Schema. Validate config fields against `https://opencode.ai/config.json` and confirm startup with the real OpenCode loader; repository validation must never invent fields to suppress its own diagnostics.

For code maintainability reviews in this library, gather deterministic file-size/navigation bands with:

```sh
npm run code-quality:inventory -- --format markdown
```

For instruction-artifact context-cost reviews in this kit, gather deterministic Markdown metrics with:

```sh
npm run instruction:inventory -- --format markdown
```

Use `complain` for lightweight feedback that should be captured. When `kaizen_report` is advertised, the machine-local inbox is authoritative and successful capture writes no Markdown. `docs/feedbacks/<agent-or-skill-name>.md` is used only as bounded degraded transport when inbox capture is unavailable before persistence; see `docs/kaizen.md`.

Validate all OpenSpec changes with the first-class package gate:

```sh
npm run openspec:validate
```

Run deterministic operation gates before sensitive OpenSpec lifecycle steps with:

```sh
npm run openspec:gate -- --operation propose --change <change-id>
npm run openspec:gate -- --operation apply --change <change-id>
npm run openspec:gate -- --operation archive --change <change-id>
```

Use `--persist` only when a JSON evidence artifact should be written to `openspec/changes/<change-id>/automation/operation-gates/<operation>.json` from a write-authorized main session. Default operation-gate runs are read-only.

Complete archive uses the project-neutral core from `global/bin/` and the official OpenSpec JSON operation. This kit's package script is only a thin validation adapter:

```sh
npm run openspec:archive -- --change <change-id> -- npm run prepush:validate
```

An unrelated project can invoke the same core with its own root and aggregate validation argv:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<change-id>" -- <validation-executable> [args...]
```

Validate the exact Git index rather than unrelated dirty-worktree content with the reusable staged core. This kit reuses its ignored `node_modules` through a thin package adapter; other projects select their own ignored reuse paths and command:

```sh
npm run validate:staged
```

```text
node "<global-source>/bin/validate-staged.ts" --root "<project-root>" [--reuse "<ignored-relative-dir>"] -- <validation-executable> [args...]
```

For installer changes, prove the no-write path before running the default mode:

```sh
npm run install:global -- --dry-run
npm run install:global -- --check
```

For ports from a project-local prompt set, pass anchors that must not remain in reusable Markdown:

```sh
npm run validate -- --forbidden-anchor "OldProductName" "D:/old/project/path"
```

Before pushing changes from this repository, run the pre-push gate:

```sh
npm run prepush:validate
```

The pre-push gate runs `npm run validate`, `npm test`, and `npm run openspec:validate` when `openspec/` exists. The former existence-only OpenSpec operation gate was removed because it duplicated no meaningful validation fact.

To enable the tracked local git hook for this clone, run:

```sh
git config core.hooksPath .githooks
```

Continuous integration runs the same machine-checked gates on every pull request and on push to `main` through `.github/workflows/validate.yml`. CI enforces `npm run validate:strict`, `npm test`, `npm run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800`, `npm run instruction:inventory -- --format markdown`, and conditional `npm run openspec:validate` when `openspec/changes/` is non-empty. The code-quality inventory exposes attention and split-candidate navigation signals without failing on line count alone; responsibility mixing and current-change degradation require the semantic `split-or-justify` disposition. Downstream consumers can copy the user-facing template at `templates/ci/github-actions.yml` instead of the kit's own workflow.

For broad instruction-artifact audits, use `instructions/instruction-artifact-audit-runbook.md` to prove repo source, installed state, runtime policy, context-cost metrics, permission semantics, reviewer gates, and non-repo changes. Capture before/after metrics such as global rules line count, top heavy skill line counts, installed-copy drift, validator test count, and reviewer findings.

## Routing Map

Routing and reviewer maps assume the default `all` install profile.

- New non-trivial parentless-root work that requires selecting or omitting maintained routes -> after enough foraging, obtain one `specialist-team-advisor` map; stay direct only for execution of one already-selected owner-local action with known proof.
- Explicit planning-only work -> `deep-task-planning`.
- Existing OpenSpec continuation or "what next" work -> `next-step`; consistency work -> `openspec-consistency-review`.
- Several session-scoped follow-ups from an audit, reviewer gate, broad discovery, or validation failure -> group them into lightweight OpenSpec changes when OpenSpec exists or is approved; otherwise return grouped continuation candidates.
- Initial MR/PR title/body preparation -> `merge-request-author`.
- Ordinary Small clear/bounded/local/reversible work -> main-default implementation, Runtime Proof, accepted-scope completion, focused validation, and `Outcome: working | blocked | unknown`.
- Behavior roadmaps and feature slices -> use the first safely reachable real boundary sufficient for the accepted effect. Keep a blocked path/gate unclaimed and replan to another sufficient route; ask only when the outcome requires owner action.
- Explicit roadmap or phase Delivery Horizon with a current post-archive forecast, bottleneck, repeated unit-of-work, shared-owner fan-out, or dominant-cost trigger -> `roadmap-delivery-trajectory`; ordinary retrospectives, cohesive local work, changed-code review, focused complexity, next-step, exhaustive audit, and campaign execution retain their existing owners.
- Explicit stable/full qualification, project-required qualification, or concrete Material risk -> load `change-ready-sdlc` before the first mutation.
- Skip/omit/suppress/cache/replay/emulation/replacement/optimized-bypass equivalence -> `behavioral-substitution-qualification`; exact non-substitution work stays on its normal concise route.
- Credentials, destructive/remote/install action, unrecognized dirty worktree, or unknown writer liveness -> `execution-safety-reviewer`; it cannot authorize the action.
- Finite-population, partitioned-domain, real-equivalence, compatibility/interchangeability, safety, or phase/milestone completion -> fresh read-only `evidence-sufficiency-reviewer` challenge before the broad claim is represented as complete.
- Material outcome/workload/profile/environment/oracle bind or rebind with a named current contradiction -> `foundation-integrity-reviewer`; after main reproduces one current defect, use `foundation-integrity-recovery` to correct and serially sweep only dependent current work.
- Optional delegated production slices -> `implementation-worker` only when isolation, proof boundary, and evidenced benefit justify handoff; main remains default author.
- Reachable named critical risk or explicit SDET requirement after proof and accepted-scope completion -> fresh `sdet-quality-engineer` when installed.
- Optional post-MVP candidate risk review -> `final-candidate-reviewer` when concrete risk, policy, or the owner requires it.
- Bounded first-pass helper work such as long-context retrieval, JSON extraction, scoped review, test ideas, planning, or tool-call checks -> `qwen-local-worker`; it inherits the invoking primary model and does not imply local/offline execution.
- Technical or uncertain blockers immediately before owner escalation, after safe distinct local routes are exhausted -> one `troubleshooter` consultation; provide the original goal/envelope, diagnostics, prior attempts, remaining mechanisms, write/forbidden bounds, protected boundaries, and validation gate. Proven exact owner-only actions bypass specialist delay.
- Opt-in root completion enforcement -> `/enable-grind` enables deterministic async preflight and the hidden `session-completion-arbiter` for only the current root; `/disable-grind` returns it to ordinary chat. New roots default off.
- Skills, agents, prompts, `AGENTS.md`, and other instruction artifacts -> `instruction-artifact-tuning`; current-session friction notes -> `complain`; for broad audits also use `instruction-artifact-audit-runbook.md`; use `instruction-artifact-reviewer` as the read-only post-change gate.
- Documentation review selection: use `documentation-learning-quest` for guided onboarding, `documentation-hardening-loop` for non-trivial doc/spec hardening, `openspec-consistency-review` for OpenSpec synchronization, and `codebase-audit-loop` only for exhaustive codebase audits.
- Focused pre-expansion assessment of an existing project's architecture comprehension, current change pressure, useful interface, or refactoring locality -> `complexity-management`; cohesive deltas stay direct, seam-only questions retain their Practice Owner route, and explicit exhaustive coverage retains `codebase-audit-loop`.
- Changed-code maintainability/readability after non-trivial implementation or refactoring, including large-file navigation, duplication, DRY/SOLID/YAGNI, and design-pattern trade-offs -> `code-quality-audit`; the Material `code-quality-reviewer` gate returns only a safe net-reduction matrix.

## Reviewer Gate Map

- Credentials, dirty worktree, destructive/remote effects, restoration, cleanup, or writer liveness -> `execution-safety-reviewer`.
- Instruction artifacts, skills, agents, prompts, `AGENTS.md`, and README routing -> `instruction-artifact-reviewer`.
- Safe deletion, reuse, deduplication, state simplification, and public-surface narrowing -> `code-quality-reviewer` reduction matrix.
- Implementation readiness, stable scope, blockers, validation path -> `implementation-readiness-reviewer`.
- Original-outcome versus population/path/oracle evidence sufficiency for a declared broad claim -> `evidence-sufficiency-reviewer`.
- Current accepted-outcome/workload/profile/environment/oracle relation at a material bind or rebind -> `foundation-integrity-reviewer`; main retains falsification and recovery authority.
- Optional post-MVP risk review of the complete current candidate -> `final-candidate-reviewer`.
- Root goal alignment, unfinished accepted scope, and owner-boundary routing in an explicitly grind-enabled root -> session completion guard plus hidden `session-completion-arbiter`.
- OpenSpec/design/architecture ownership and consistency -> `openspec-architecture-reviewer`.
- Requirements-to-tests, weak assertions, missing gates -> `test-coverage-reviewer`.
- Config, deployment, packaging, operational safety -> `deployment-config-reviewer`.
- Latency, throughput, load isolation, recovery evidence -> `performance-reliability-reviewer`.
- Rust async/concurrency/backpressure/shutdown -> `rust-concurrency-reviewer`.
- Protocol/API semantics, schema evolution, correlation, reconnect -> `protocol-api-reviewer`; byte-level fixtures, framing, golden vectors -> `wire-protocol-reviewer`.
- Legacy source evidence and compatibility behavior -> `legacy-evidence-reviewer`; legacy client/tool workflow compatibility -> `legacy-client-compatibility-reviewer`.

## OpenSpec Follow-Up Tracking

Use OpenSpec as a durable follow-up tracker when a session produces a real backlog, not for every incidental note.

This repository's OpenSpec guide starts at `openspec/project.md`; active changes live under `openspec/changes/<change-id>/`.

- Good triggers: codebase audits, instruction-artifact audits, reviewer gates, broad discovery, and validation failure triage that produce several concrete tasks outside the current approved scope.
- Bad triggers: isolated nits, speculative polish, local style preferences, duplicated final-answer bullets, or one obvious next step.
- Prefer one OpenSpec change per coherent outcome, capability, risk area, or artifact family. For lightweight backlog changes, `tasks.md` can be the primary surface; add proposal/spec/design detail only when requirements, behavior, compatibility, architecture, or acceptance criteria need it.
- Create or update OpenSpec files only when the repository already has an OpenSpec workflow or the user approved adding one; otherwise return grouped follow-up candidates as continuation items.
- Reviewer agents remain read-only for source/config/instruction/spec/task artifacts; their only default write exception is feedback-ledger entries under `docs/feedbacks/**` through `complain`. They return risk matrices (or the code-quality reduction matrix); main owns disposition, any OpenSpec writes, and `next-step` continuation.

## Skill Catalog

### Planning And Workflow

- `change-ready-sdlc`: on-demand Material safety and qualification artifact. It owns development -> MVP -> RC -> stable only for qualifying work and triggers fresh critical SDET only for named reachable consequences or explicit requirements.
- `deep-task-planning`: execution-grade plans for complex work.
- `next-step`: discover OpenSpec-backed workstreams and choose one serial next step.
- `merge-request-author`: reviewer-friendly PR/MR title/body/validation/risk authoring.
- `instruction-artifact-tuning`: review/tune skills, agents, prompts, and `AGENTS.md`.
- `complexity-management`: focused pre-expansion Architecture Comprehension Map, Change Rehearsal, abstraction-value admission, and same-scenario refactor recheck for an existing project; not changed-code review, new service design, or exhaustive coverage.
- `reuse-discovery`: bounded reuse-first discovery for new mechanisms across current-repository, platform/dependency, explicitly configured cross-project, and read-only ecosystem evidence.
- `roadmap-delivery-trajectory`: evidence-bounded post-archive review for an explicit roadmap or phase Delivery Horizon when forecast, bottleneck, repeated-unit, shared-owner, or dominant-cost evidence requires one current disposition.
- `behavioral-substitution-qualification`: on-demand closure for skip/omit/suppress/cache/replay/emulation/replacement/optimized-bypass equivalence at the owning boundary.
- `root-cause-analysis`: evidence-backed 5 Whys/causal-chain analysis for symptoms, recurrence paths, unknown-cause investigations, and remediation-ready cause records.
- `complain`: record current-session workflow friction, instruction conflicts, tooling pain, validation noise, or reusable improvement opportunities in `docs/feedbacks/**`.
- `foundation-integrity-recovery`: main-owned falsification-first correction, dependent current-artifact sweep, evidence narrowing, archive preservation, and one-incident termination after a reproduced foundation finding.

### Review And Learning

- `documentation-learning-quest`: guided docs onboarding and lightweight review.

### Documentation And Audit

- `deduplication-audit`: explicit scoped `/dedup` clone audit using global `jscpd` candidate evidence plus symbols, owners, callers, tests, and the existing read-only code-quality reviewer.
- `code-quality-audit`: post-change code-health review focused on maintainability, readability, file navigation, duplication, overengineering, code smells, and minimal refactoring remedies rather than pre-expansion map/rehearsal work.
- `documentation-hardening-loop`: docs/spec review-fix-validate loop.
- `documentation-block-ledger`: helper ledger for full docs block coverage.
- `codebase-audit-loop`: exhaustive audit workflow for bugs, project-structure ergonomics, redundancy, test gaps, performance, and maintainability.
- `codebase-audit-ledger`: helper ledger for exhaustive audit coverage.

### OpenSpec

- `openspec-abandon-change`: preserve an intentionally incomplete OpenSpec change without claiming completion or syncing specs.
- `openspec-propose`: create one OpenSpec planning set with proposal, design, specs, tasks, strategy history, one `Automation Dividend`, one bounded-falsification declaration, deterministic structural checks, and a separately reported semantic-readiness result.
- `openspec-apply-change`: implement one OpenSpec change through evidence-bound tasks, happy-path runtime proof, and focused validation.
- `openspec-archive-change`: validate and complete-archive one finished OpenSpec change through the portable deterministic helper. A required Automation Dividend needs its tagged task and current evidence row; an exempt Ordinary Small declaration has no tagged task.
- `openspec-consistency-review`: review proposal/design/spec/tasks/docs/tests sync.
- Candidate Git inspection uses `node global/bin/repo-candidate-snapshot.ts` (`--help`/`-h` are effect-free). Matched consumer improvement is limited to the reviewed two-scenario Windows capture; it is not a universal friction claim. Optional retrospectives stay outside completion.

### Technical Domains

- `config-schema-validation`: config schema/defaults/limits/reload diagnostics.
- `rust-workspace-bootstrap`: Rust workspace and crate bootstrap.
- `windows-service-packaging`: Windows service/tray/installer lifecycle.
- `latency-benchmark-pack`: latency/load/SLO benchmark evidence.
- `legacy-contract-extract`: extract contracts from legacy sources.
- `external-service-simulator-harness`: deterministic fake external services for tests.
- `framed-protocol-implementation`: framed protocol/schema/session implementation.
- `wire-protocol-golden-tests`: golden byte/vector tests for protocols.
- `service-architecture-design`: new-service and material service-architecture design gate; not focused comprehension assessment of an existing project.
- `com-activex-adapter-implementation`: COM/ActiveX adapter compatibility workflow.

## Agent Catalog

- `code-quality-reviewer`: read-only safe net-reduction reviewer for deletion, reuse, deduplication, state simplification, and public-surface narrowing while retaining unique critical/compatibility oracles.
- `test-coverage-reviewer`: task/repro/runtime-envelope coverage, requirement-to-test matrix, missing tests, weak assertions.
- `implementation-readiness-reviewer`: original-request task fit, stable scope, decisions, observable proof, failure paths, unnecessary work, and bounded semantic-readiness evidence; `no-material-finding` is valid.
- `openspec-architecture-reviewer`: architecture/OpenSpec consistency and ownership risks.
- `rust-concurrency-reviewer`: Rust async/concurrency/backpressure/shutdown risks.
- `performance-reliability-reviewer`: latency, throughput, starvation, overload, recovery evidence.
- `deployment-config-reviewer`: config/deployment readiness and operational safety.
- `protocol-api-reviewer`: framed/client API, schema evolution, correlation, reconnect.
- `implementation-worker`: optional write-capable production-only worker for one evidenced isolated non-overlapping production slice, with scoped production edits, parent raw-output run-observe-correct, and report-only return; never authors automated tests.
- `sdet-quality-engineer`: write-capable test-only SDET for independent risk/oracle assessment and automated-test evidence after applicable proof; never edits production or claims readiness.
- `final-candidate-reviewer`: optional fresh read-only post-MVP risk reviewer; returns an evidence-backed risk matrix and never edits candidate artifacts or approves a stage.
- `evidence-sufficiency-reviewer`: fresh read-only challenge of whether current population, path, environment, real-oracle, and unresolved-observation evidence entails the original broad claim and its maximum ceiling.
- `foundation-integrity-reviewer`: fresh read-only Practice Owner for current material outcome/workload/profile/environment/oracle bind or rebind contradictions; stays quiet for Ordinary Small, aligned, and historical-only controls.
- `execution-safety-reviewer`: read-only execution-safety owner for authority, secrets, worktree, and destructive effects; never authorizes the action.
- `troubleshooter`: inherited-model diagnosis-only pre-escalation consultant for hard or uncertain technical blockers after safe distinct mechanisms are exhausted; returns one goal-preserving route or proves the exact owner action, while main retains correction/proof and fresh SDET retains test authorship.
- `qwen-local-worker`: inherited-model first-pass helper for bounded long-context retrieval, JSON extraction, scoped review, test ideas, planning, and tool-call checks.
- `specialist-team-advisor`: inherited-model read-only advisor that returns the smallest sufficient main/skill/subagent engagement map from current mission evidence and the parent root's active catalog; it never dispatches or authorizes work.
- `wire-protocol-reviewer`: byte-level protocol/transport review.
- `legacy-evidence-reviewer`: requirement/design verification against legacy evidence.
- `legacy-client-compatibility-reviewer`: compatibility with legacy clients/tools/workflows.
- `session-completion-arbiter`: hidden no-tool machine adjudicator used only by an explicitly enabled completion guard; returns one exact correlated JSON non-lifecycle verdict from guard-supplied redacted session-delivery evidence.
- `instruction-artifact-reviewer`: read-only review of skills, agents, prompts, `AGENTS.md`, README routing, autonomy handoff, and safety boundaries.

Project plugin behavior:

- `global/extensions/specialist-catalog.ts` registers the advisor-only `specialist_catalog` tool when explicitly listed by a materialized profile. It projects privacy-safe parent-root agent/skill availability and is not auto-discovered from source presence.
- `global/plugin/session-env.ts` registers the `session_delivery_context` custom tool for manual diagnostics and exposes the same redacted projection imported by the automatic completion guard, including `todowrite` history and requirement signals reconstructed from transcript parts. It also injects `OPENCODE_SESSION_ID` into shell commands for manual CLI use. The plugin is loaded explicitly from the kit config; the context implementation lives beside `session-env.ts` and does not need a `tools/` directory at runtime.

### Opt-In Session Completion Guard

The kit config loads `global/extensions/opencode-pty-bridge.ts` and `global/extensions/session-completion-guard.ts` from explicit kit-relative file URLs. The bridge and guard share the one pinned `opencode-pty` manager from `global/node_modules`; a second cache-installed PTY plugin must not be enabled. Loading the plugin does not enable grind: every new root starts in `disabled`.

Control is per root and persisted in that root's metadata:

- **`/enable-grind`**: enables completion and question arbitration for the current root after its bounded confirmation turn. That control turn is not audited.
- **`/disable-grind`**: immediately cancels guard-owned audit/retry/fallback intent and prevents later guard side effects for the current root. It does not kill user PTYs/tasks, interrupt the primary response, delete retained evidence, or change sibling roots.

An enabled parentless root reacts to idle events as follows:

- **waiting-async**: deterministic preflight found an awaited PTY, background child, unconsumed task result, unknown lease, compaction, or guard-owned turn. No completion model is called.
- **certified completion**: a configured deterministic owner may answer the guard's bounded root/revision/lease/requirement challenge with a versioned terminal certificate. Exact current certificates reach `passed` without an arbiter child; absent, stale, malformed, unknown-issuer, incomplete, or question-pending certificates have no terminal effect and fall back to ordinary arbitration.
- **auditing / audit-retrying**: async state is clear and one retained hidden `session-completion-arbiter` child is evaluating a root-correlated, redacted evidence snapshot. The configured model must return one exact JSON object; invalid JSON, provider failure, or stale correlation has no root side effect and retries with bounded exponential delay.
- **question-auditing / question-answering**: a pending interactive multiple-choice request is classified independently. An autonomous verdict must select exact offered labels, after which the guard uses OpenCode's official reply API so the original tool call resumes. Human replies win races. Owner-only, custom-only, malformed, stale, or unbounded questions remain open/fail closed; the guard never treats rejection as an answer.
- **continuing**: one validated `continue` verdict produced one synthetic root continuation under the original root agent/model/variant/tool context.
- **passed**: the unchanged root revision may remain idle. This is not an RC, stable, release, deployment, or external-operation verdict, and it adds no transcript success message.
- **paused**: a real in-flight user interrupt or explicit non-synthetic stop instruction won. A later ordinary human message resumes guard eligibility; synthetic PTY/task/guard text cannot do so.

When TUI toast support is available, status transitions are shown there. The same state and privacy-safe correlation fields are stored in session metadata for headless operation and restart recovery. Local logs use hashed session/audit/PTY refs and bounded redacted error causes; they must not include credentials, prompts, provider options, or full command output.

Operational notes:

- Ordinary conversation needs no action: leave the root disabled. Use `/enable-grind` only when autonomous completion enforcement is wanted, then `/disable-grind` to return to normal chat.
- The guard config hook preserves the merged main and per-agent permission policies. The portable global template remains explicitly `allow`; higher-precedence project, explicit, inline, or managed restrictions remain effective, and denied guard operations fail closed with capability diagnostics.
- The portable guard configuration trusts only `roadmap-mission-session-executor` certificates and bounds the challenge wait. Certificate status, issuer class, mismatch reason, and accepted evidence references are privacy-safe root metadata; certificate payloads never grant permissions or protected-action authority.
- Plugin, agent, dependency, or config changes require a new OpenCode process. Updating kit files does not activate them in an already-running owner session.
- If a root remains `waiting-async`, inspect current `pty_list`, background children, and whether the matching synthetic result/exit notification reached the root. Unknown liveness intentionally remains fail-closed.
- If a root remains `audit-retrying`, verify the profile's arbiter provider/model is connected and available, then inspect the retained child metadata and the owning-boundary error. Do not paste a guessed verdict into the root.
- If a root remains `question-auditing`, inspect the retained arbiter child. Invalid or invented labels are rejected and retried; `owner-required` intentionally waits for a human. Successful autonomous answers are stored as privacy-safe guard interventions rather than human `questionReplies`.
- The maintained installed boundary proof is `npm run proof:guard-question-runtime -- --server-url http://127.0.0.1:<port>` against a fresh local `opencode serve`; it enables only the real `question` tool in its disposable root and deletes the root/children in `finally`.
- If a root is `paused`, send a new ordinary human message only when work should resume. An explicit stop instruction keeps the current turn paused.
- Roll back as one coherent version-controlled change: stop OpenCode, restore the previous config/template, dependency graph, profiles, validators, and agent inventory together, reinstall the selected profile, then restart. Do not remove only the guard while leaving a mismatched PTY source or partially migrated routing active.

## Instruction Templates

Global OpenCode philosophy lives in `global/principles-of-work.md`; operational agent instructions live in `global/AGENTS.md`. Both are loaded live once `OPENCODE_CONFIG_DIR` points at `global/` and the generated config declares the principles file. Project-scoped instruction templates live under `instructions/`:

- `universal-development-loop.md`: one canonical AI-assisted engineering loop for every target project.
- `reusable-project-agent-instructions.md`: project-level `AGENTS.md` baseline.
- `leaf-reviewer-agent-contract.md`: reusable read-only reviewer subagent contract.
- `practice-owner-agent-contract.md`: shared Practice Owner kernel, common fields, and core roster routing.
- `evidence-and-validation.md`: evidence hierarchy and validation discipline.
- `instruction-artifact-audit-runbook.md`: reproducible audit contract for skills, agents, installed state, runtime policy, context cost, permissions, and non-repo changes.
- `porting-checklist.md`: checklist for turning project-local prompts into reusable artifacts.

## Porting Notes

These artifacts were generalized from project-local workflows. Project-specific anchors were removed or renamed into domain-neutral forms:

- Product architecture -> `service-architecture-design`.
- Product protocol implementation -> `framed-protocol-implementation` and `protocol-api-reviewer`.
- Product wire-format review -> `wire-protocol-golden-tests` and `wire-protocol-reviewer`.
- Device/upstream simulator -> `external-service-simulator-harness`.
- Legacy UI/tool compatibility -> `legacy-client-compatibility-reviewer` and `legacy-evidence-reviewer`.

Overly narrow future-scope behavior that depended on one product domain was intentionally not ported.

## Curation Rules

- Keep artifacts project-neutral unless the artifact name explicitly scopes a reusable domain.
- Prefer concrete evidence, validation, permissions, and output schemas over vague instructions.
- For repetitive, evidence-heavy, or token-heavy workflows, consider a small deterministic helper before adding more prose process.
- When several session-scoped follow-ups appear outside approved scope, prefer grouping them into OpenSpec changes when OpenSpec exists or is approved instead of leaving an untracked final-message backlog; avoid OpenSpec ceremony for isolated nits or one obvious next step.
- Helper automation in skills or agents must be deterministic and contract-driven: explicit inputs/outputs, fixtures or schemas, stable ordering, privacy-safe output, and no hidden heuristics.
- Implementation-capable artifacts require observable real-boundary proof before dependent expansion. Main may add the smallest focused regression after proof; independent fresh critical-only SDET/test authoring is required only for a named reachable critical consequence or explicit requirement.
- Test strategy targets realistic business and operational failures at real end-to-end boundaries; coverage metrics are diagnostic only, and justified mock exceptions must be explicit.
- Reviewer agents should keep `## Contract Reference`, role-specific inputs/checks/output, ordered findings, residual risks, and non-authorizing `Follow-up Candidates`; do not inline `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback` (shared runtime invariants come from global instructions); mutation-capable tools stay denied except scoped `docs/feedbacks/**` appends through `complain` and explicitly validated bounded exceptions such as `implementation-worker`, `sdet-quality-engineer`, and `troubleshooter`.
- Avoid hardcoded commands and paths. Use placeholders or say to use the repository's configured validation command.
- If a target repository has stricter local instructions, local instructions win.
