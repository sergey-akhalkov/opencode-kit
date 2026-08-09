# opencode-dev-kit

[![Validate CI](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml)

Installable OpenCode development kit for reusable AI-assisted engineering workflows across projects.

## What This Is

`opencode-dev-kit` packages reusable OpenCode skills, read-only reviewer agents with a scoped feedback-ledger write exception, bounded worker agents, project templates, instruction templates, and deterministic helper tools. It applies one ordered operating contract: protect quality and safety, continue autonomously, then optimize speed to a verified result without creating a different workflow for every technology stack.

The kit optimizes one process: main-default production authorship, run-observe-correct to MVP, accepted-scope completion, critical-only SDET for Material behavior, applicable validation, RC freeze, and local stable handoff. Optional reviewers never become stage gates.

## Universal Development Loop

The conceptual development loop lives in the single canonical file `instructions/universal-development-loop.md`. Its current 12-step list, Quality Defaults, and Output Shape are defined there; token and time policy lives in the always-loaded operating priorities and `docs/token-economy.md`. Kit-level pointer notes live in `docs/universal-development-loop.md`. Technology adapters may change commands and constraints, but not the conceptual loop; `npm run validate` enforces the single-source rule for that loop body.

Ordinary Small routing lives in the kit's global `AGENTS.md`. Full qualification uses the `change-ready-sdlc` skill from the kit custom config directory only for explicit stable/full-qualification requests, project-required qualification, or concrete Material risk. Other loader-visible sources may coexist and must be diagnosed rather than assumed absent. UDL is conceptual guidance, not a second competing process. User-facing maturity is `Development-Stage: development | MVP | RC<n> | stable`.

## Contents

- `global/`: kit-owned custom OpenCode config directory pointed to by `OPENCODE_CONFIG_DIR`. Holds the kit's `skills/`, `agents/`, `plugin/`, `AGENTS.md`, and machine-local `opencode.json`; it does not prove that host-default or managed sources are absent.
- `docs/feedbacks/`: shared feedback ledger for agent and skill complaints, suggestions, and workflow-friction notes.
- `instructions/`: copyable instruction templates for global/project `AGENTS.md`, reviewer contracts, evidence discipline, and porting.
- `templates/`: project bootstrap and CI templates for applying the Universal Development Loop to another repository.
- `profiles/`: single `all` install manifest covering every reusable skill and agent in the repository.
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

Use `npm run setup:global` as the one-command equivalent of `install:mcps` followed by `install:global`.

`install:mcps` preserves working installations instead of upgrading them. It installs missing Serena through the official `uv tool install -p 3.13 serena-agent` command, initializes Serena, and installs missing Codebase Memory through the supported `npm install --global codebase-memory-mcp` package. Use `--check`/`--audit` for a read-only availability check or `--dry-run`/`--what-if` to preview missing-package commands. Serena requires `uv`; if `uv` is unavailable, the helper fails before mutation with the official installation URL.

`global/` is a complete kit-owned custom config directory: `global/skills/`, `global/agents/`, `global/plugin/`, `global/AGENTS.md`, and `global/opencode.json`. OpenCode loads these artifacts directly while other documented source layers may coexist. `global/AGENTS.md` includes Sergey's standing local-machine authorization, and `global/opencode.json.template` is the committed autonomy-first portable default (GPT-5.6 Sol main model, Serena and Codebase Memory MCPs, compaction, watcher, tool output, `permission: allow`); the installer provisions a local `global/opencode.json` and personal `global/opencode.local.instructions.md` on first run. Both MCP entries use commands from `PATH`, so the committed template contains no user-specific executable path. This permissive tool setting and standing authorization are not an OS sandbox: protected-boundary instructions remain mandatory, while managed enforcement requires a separate policy layer. Both local files are gitignored. Edit kit artifacts under `global/` and restart OpenCode; use `npm run opencode:sources` to inventory safe source locations and collisions.

Options:

- (default): platform-specific. On Windows, persists `OPENCODE_CONFIG_DIR` to `<repo>/global` via `setx` when the measured value is within the safety limit. On macOS/Linux, prints a safe `export` line only and does **not** persist; use `--persist-script` for profile convergence.
- `--check` or `--audit`: exit `0` if `OPENCODE_CONFIG_DIR` already points at `global/`, `1` otherwise. Recommended after restart/activation.
- `--print`: preview the target path and the platform command without changing anything. Preview only; not a recovery path for over-limit Windows values.
- `--unset`: remove the persisted `OPENCODE_CONFIG_DIR` value.
- `--persist-script <file>`: ensure `<file>` contains exactly one desired POSIX-safe `export OPENCODE_CONFIG_DIR='...'` line (single-quoted literal encoding). Re-runs with the same desired line are no-ops; supported wrong-valued or duplicate standalone assignment lines (unquoted safe token, single-quoted, or legacy double-quoted) are replaced/removed so only the desired line remains. Ambiguous assignment lines fail closed without rewriting the file. Profile mutation uses same-directory temp + fsync + raw-byte preimage check + atomic rename; invalid UTF-8 and symlink/non-regular targets fail closed before mutation.
- `--unset-script <file>`: remove every supported standalone `export OPENCODE_CONFIG_DIR=...` line from `<file>` (POSIX profile); ambiguous lines fail closed without rewriting. Uses the same failure-atomic replacement policy as `--persist-script`.
- `--dry-run` or `--what-if`: preview the default mode without setting anything.
- Mode exclusivity: `--check`/`--audit`, `--print`, `--unset`, `--persist-script`, and `--unset-script` are mutually exclusive (including aliases and repeats). Conflicting modes fail before any validation, process call, profile, config, or environment mutation.

Restart OpenCode after installing; the running process keeps the old environment until restarted. On Windows, GUI apps launched from Explorer may require logoff/logon to inherit the new user environment variable.

Windows `setx` truncates user environment variables at 1024 characters. The installer measures the configured value (`<repo>/global`) and refuses to call `setx` when the resulting `OPENCODE_CONFIG_DIR=<value>` line exceeds 900 characters. Over-limit recovery is to relocate or clone the kit to a shorter path, re-run `install:global`, then verify with `--check`. Do **not** run `setx` manually with the over-limit path, and do not treat `--print` output as a safe recovery command.

On macOS/Linux, the default mode prints the safe `export` line only and does not persist. To persist, run `npm run install:global -- --persist-script ~/.bashrc` (or `~/.zshrc`, `~/.profile`, …); the helper converges to exactly one desired export line, is safe to re-run, and replaces the profile failure-atomically. The matching `--unset-script <file>` removes every matching export line. Restart the shell and verify with `--check` after activation.

Important: `OPENCODE_CONFIG_DIR` adds the kit custom directory with documented precedence; it is not evidence that `~/.config/opencode`, project, managed, explicit, or inline sources stopped loading. Keep kit-specific provider/MCP/permission config in local `global/opencode.json`, personal preferences in local `global/opencode.local.instructions.md`, and inspect loader-visible source locations with `npm run opencode:sources`. Exact precedence claims require current documentation or isolated runtime proof for the artifact class.

#### Runtime activation rollback

Runtime activation rollback restores only the active config pointer and reloads OpenCode. It does not mutate the repository candidate.

1. Restore the exact prior `OPENCODE_CONFIG_DIR` value you recorded before install.
2. If the prior state was unset, use `npm run install:global -- --unset` (or the matching profile `--unset-script` path) so the variable is removed rather than pointed at an invented path.
3. Restart OpenCode so the restored environment is loaded.
4. Do not treat activation rollback as full change rollback of repository artifacts.

Keep project-specific skills out of `global/` unless their descriptions explicitly scope them to that project. Global skills are visible in unrelated repositories through the skill catalog, so broad or local-product triggers add avoidable routing noise.

### Configuration Layering

The kit owns three OpenCode config files within a broader additive OpenCode source model:

- `opencode.json` (repo root) — the workspace config. OpenCode loads this when run inside this repository. Use it for workspace-specific settings such as the local model override and `permission: ask` policy.
- `global/opencode.json.template` — the portable autonomy-first default that ships with the kit. It declares the GPT-5.6 Sol main model default, Serena and Codebase Memory MCPs, compaction, watcher, tool output, and `permission: allow`. It provides permissive tool access, not hard sandbox enforcement. Never edit this file for machine-specific overrides.
- `global/opencode.json` — the machine-local config (gitignored). Provisioned from `global/opencode.json.template` on first install and editable for local provider, MCP, permission, and review-environment settings.

The validator identifies the machine-local layer by its gitignored `global/opencode.json` path and reports broad local permission overrides as `INFO:` notes. Never add unsupported marker fields to OpenCode config; every field must exist in the official OpenCode schema.

Model profiles are explicit launch-time overlays, not a fourth automatically loaded base layer. The committed profiles under `global/model-profiles/` contain only `$schema`, `model`, `small_model`, and complete per-agent `model`/`variant` routes. They do not change permissions, tools, providers, MCPs, prompts, credentials, or reusable agent Markdown. Select one profile for a new OpenCode process:

```sh
npm run opencode:profile -- quality-independent
npm run opencode:profile -- quality-independent --check
npm run opencode:profile -- quality-independent --explain
npm run opencode:profile -- quality-independent -- --model xai/grok-4.5
```

The presets have distinct purposes:

- `quality-independent` is the recommended creator/challenger split. Primary creation, implementation, troubleshooting, and compaction use `openai/gpt-5.6-sol` with `xhigh`; discovery, SDET, and independent review use `xai/grok-4.5` with `high`.
- `sol-only` routes every governed agent to `openai/gpt-5.6-sol` with `xhigh`.
- `grok-only` routes every governed agent to `xai/grok-4.5` with `high`.

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

The bootstrap writes a project `AGENTS.md`, optional `opencode.json`, `docs/feedbacks/README.md`, and `opencode-dev-kit/adapter.json` plus `opencode-dev-kit/validation.md`. The adapter records technology-specific commands; it does not define a separate workflow. Shared runtime lifecycle authority remains the active global `AGENTS.md` and `change-ready-sdlc` skill; project bootstrap supplies adapters only.

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

Doctor is a structural diagnostic, not lifecycle readiness certification. Report version 2 separates structural severity (`status: pass|warn|blocked`, process exit) from machine-readable qualification impact (`qualificationStatus: pass|blocked` and per-check `blocksQualification`). Only `qualificationStatus: blocked` or `blocksQualification: true` blocks RC/stable qualification; advisory warnings alone do not.

Doctor inspects the kit custom directory selected by nonblank `OPENCODE_CONFIG_DIR`, or the host default `~/.config/opencode` when no custom directory is selected. This inspection does not claim other runtime sources are absent. Required kit authority is structurally conforming `AGENTS.md` and `skills/change-ready-sdlc/SKILL.md`: nonempty regular files with real Markdown sections, valid scalar skill frontmatter, and an ordered lifecycle skeleton through development, MVP proof, critical SDET when applicable, RC validation, and stable handoff. Missing, malformed, or lifecycle-incomplete required authority blocks qualification; source-path equality and template markers are informational only.

Project validation qualification accepts either complete concrete `opencode-dev-kit/adapter.json` validation entries or a complete `opencode-dev-kit/validation.md` Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build. A command is resolved when it is concrete or records reasoned non-applicability as `N/A - <reason>` (or Command `N/A` with non-placeholder Notes). Bare `N/A`, `unknown`, `TBD`/`TODO`, replace-me placeholders, and blanks remain unresolved. Missing project bootstrap/AGENTS, neither validation source complete, missing required authority, invalid explicit/local config, invalid project path, or unsupported Node block qualification. Empty `--project=` and whitespace-only `--project` values error rather than selecting the current directory. Doctor does not invent commands or score lifecycle capability.

Before broad AI work in a target repository, gather a compact deterministic map:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

## Token Economy

- The repository-level maintainer rules live in `REPO_AGENTS.md`. `global/AGENTS.md` is the kit runtime instruction file OpenCode loads from the custom directory; other loader-visible instructions must be inventoried for collisions. Scripts that previously referenced the root `AGENTS.md` must use `REPO_AGENTS.md` instead.
- Use the Universal Development Loop instead of choosing among competing workflows.
- Use `project:inventory`, `code-quality:inventory`, `glob`, and `grep` before broad file reads.
- On native Windows, use `rtk <command>` explicitly for shell-heavy read-only commands; do not rely on hook auto-rewrite.
- Install the full kit by default, but load heavyweight skills/subagents only when they reduce total work.
- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` covers evidenced isolated production-only slices with exact non-overlapping write scope, representative proof boundary, clear acceptance criteria, and a focused validation gate. Keep research, questions, ordinary review-only work, and proven-inert content direct in the main session.
- Run focused validation first; run broad validation when the change crosses boundaries.
- Launch optional reviewers after MVP only when concrete risk, project policy, or the owner makes them useful. Reviewer output informs main disposition but never gates a stage.
- Convert repeated manual counting, drift checks, or report assembly into deterministic helpers.

Inspect this kit's instruction context cost with:

```sh
npm run instruction:inventory -- --format markdown
```

### Manual Skills

Manual copy of change-ready lifecycle skills, write-capable lifecycle agents, or reference-based reusable reviewers is incomplete unless the runtime also loads their shared contracts from the same kit source's `AGENTS.md` (Ordinary Small routing, Material triggers, Universal Task Briefing Contract, shared reviewer invariants, and feedback-ledger policy). Resolve the kit source to `OPENCODE_CONFIG_DIR` when set; otherwise inspect the host default. Do not infer that another source is bypassed. Prefer full-kit installation and use `npm run opencode:sources` to detect same-name collisions; selective copy alone does not imply standalone completeness.

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

The same shared-runtime prerequisite as Manual Skills applies: reference-based reviewers and lifecycle agents require the runtime to load shared contracts from the same kit source's `AGENTS.md`. `OPENCODE_CONFIG_DIR` selects the kit custom source but does not prove the host default is bypassed. Prefer full-kit install when using those agents and inspect collisions before qualification.

OpenCode agents are loaded from project or global agent folders. Copy selected files from `global/agents/` into one of these locations:

- Project: `.opencode/agents/<name>.md`
- Global: `<active-global-config-dir>/agents/<name>.md`

Copy only the agents that are useful for the target project. They are read-only leaf validators or bounded read-only workers by default with a scoped `docs/feedbacks/**` write exception through `complain`; `implementation-worker` and `sdet-quality-engineer` are separately validated write-capable exceptions (production-only and test-only respectively), `troubleshooter` remains an escalation write-capable exception, and `final-candidate-reviewer` is an optional read-only risk reviewer.

OpenCode permissions enforce the `docs/feedbacks/**` path boundary; `complain` is the required model contract for entry shape and privacy checks. Use a semantic plugin/tool later if hard append-only or skill-mediated enforcement is required.

Global install is enough for fresh projects: when `docs/feedbacks` is missing, agents use the scoped edit/add-file path to create `docs/feedbacks/<agent-or-skill-name>.md` on first feedback write. Project bootstrap only pre-creates a README for discoverability.

### Manual Commands

OpenCode prompt commands are configured through `opencode.json` under `command`. This repository does not currently ship project commands.

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

Use `complain` for lightweight feedback that should be captured. Entries append to `docs/feedbacks/<agent-or-skill-name>.md` and can later be grouped into OpenSpec follow-up analysis when patterns accumulate.

Validate all OpenSpec changes with the first-class package gate:

```sh
npm run openspec:validate
```

Run deterministic operation gates before sensitive OpenSpec lifecycle steps with:

```sh
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

- Explicit planning-only work -> `deep-task-planning`.
- Existing OpenSpec continuation or "what next" work -> `next-step`; consistency work -> `openspec-consistency-review`.
- Several session-scoped follow-ups from an audit, reviewer gate, broad discovery, or validation failure -> group them into lightweight OpenSpec changes when OpenSpec exists or is approved; otherwise return grouped continuation candidates.
- Initial MR/PR title/body preparation -> `merge-request-author`.
- Ordinary Small clear/bounded/local/reversible work -> main-default implementation, Runtime Proof to MVP, accepted-scope completion, focused validation, RC, and stable handoff.
- Behavior roadmaps and feature slices -> minimize time-to-first-real-signal; run the earliest safely reachable real boundary before dependent expansion, or make its exact blocker and earliest unblocking task the next evidence slice. External/live authority remains separate.
- Explicit stable/full qualification, project-required qualification, or concrete Material risk -> load `change-ready-sdlc` before the first mutation.
- Optional delegated production slices -> `implementation-worker` only when isolation, proof boundary, and evidenced benefit justify handoff; main remains default author.
- Material critical test risk/evidence after MVP and accepted-scope completion -> fresh `sdet-quality-engineer` when installed.
- Optional post-MVP candidate risk review -> `final-candidate-reviewer` when concrete risk, policy, or the owner requires it.
- Bounded first-pass helper work such as long-context retrieval, JSON extraction, scoped review, test ideas, planning, or tool-call checks -> `qwen-local-worker`; it inherits the invoking primary model and does not imply local/offline execution.
- Exceptional hard blockers, complex bugs, or root-cause investigations where normal agents/tools already failed -> `troubleshooter`; provide prior failed attempts, allowed write scope, forbidden paths, and validation gate.
- Opt-in root completion enforcement -> `/enable-grind` enables deterministic async preflight and the hidden `session-completion-arbiter` for only the current root; `/disable-grind` returns it to ordinary chat. New roots default off.
- Skills, agents, prompts, `AGENTS.md`, and other instruction artifacts -> `instruction-artifact-tuning`; current-session friction notes -> `complain`; for broad audits also use `instruction-artifact-audit-runbook.md`; use `instruction-artifact-reviewer` as the read-only post-change gate.
- Documentation review selection: use `documentation-learning-quest` for guided onboarding, `documentation-hardening-loop` for non-trivial doc/spec hardening, `openspec-consistency-review` for OpenSpec synchronization, and `codebase-audit-loop` only for exhaustive codebase audits.
- Code maintainability/readability after non-trivial implementation, refactoring, large-file navigation, duplication, DRY/SOLID/YAGNI, or design-pattern trade-off work -> `code-quality-audit`; the Material `code-quality-reviewer` gate returns only a safe net-reduction matrix.

## Reviewer Gate Map

- Instruction artifacts, skills, agents, prompts, `AGENTS.md`, and README routing -> `instruction-artifact-reviewer`.
- Safe deletion, reuse, deduplication, state simplification, and public-surface narrowing -> `code-quality-reviewer` reduction matrix.
- Implementation readiness, stable scope, blockers, validation path -> `implementation-readiness-reviewer`.
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

- `change-ready-sdlc`: global instruction artifact for Material/full qualification using development -> MVP -> RC -> stable, critical-only SDET, non-critical parking, validation, and local handoff. Optional reviewers do not gate stages.
- `deep-task-planning`: execution-grade plans for complex work.
- `next-step`: discover OpenSpec-backed workstreams and choose one serial next step.
- `merge-request-author`: reviewer-friendly PR/MR title/body/validation/risk authoring.
- `instruction-artifact-tuning`: review/tune skills, agents, prompts, and `AGENTS.md`.
- `root-cause-analysis`: evidence-backed 5 Whys/causal-chain analysis for symptoms, recurrence paths, unknown-cause investigations, and remediation-ready cause records.
- `complain`: record current-session workflow friction, instruction conflicts, tooling pain, validation noise, or reusable improvement opportunities in `docs/feedbacks/**`.

### Review And Learning

- `documentation-learning-quest`: guided docs onboarding and lightweight review.

### Documentation And Audit

- `code-quality-audit`: pragmatic code-health review after non-trivial code changes, focusing on maintainability, readability, file navigation, duplication, overengineering, code smells, and minimal refactoring remedies.
- `documentation-hardening-loop`: docs/spec review-fix-validate loop.
- `documentation-block-ledger`: helper ledger for full docs block coverage.
- `codebase-audit-loop`: exhaustive audit workflow for bugs, project-structure ergonomics, redundancy, test gaps, performance, and maintainability.
- `codebase-audit-ledger`: helper ledger for exhaustive audit coverage.

### OpenSpec

- `openspec-consistency-review`: review proposal/design/spec/tasks/docs/tests sync.

### Technical Domains

- `config-schema-validation`: config schema/defaults/limits/reload diagnostics.
- `rust-workspace-bootstrap`: Rust workspace and crate bootstrap.
- `windows-service-packaging`: Windows service/tray/installer lifecycle.
- `latency-benchmark-pack`: latency/load/SLO benchmark evidence.
- `legacy-contract-extract`: extract contracts from legacy sources.
- `external-service-simulator-harness`: deterministic fake external services for tests.
- `framed-protocol-implementation`: framed protocol/schema/session implementation.
- `wire-protocol-golden-tests`: golden byte/vector tests for protocols.
- `service-architecture-design`: service architecture gate.
- `com-activex-adapter-implementation`: COM/ActiveX adapter compatibility workflow.

## Agent Catalog

- `code-quality-reviewer`: read-only safe net-reduction reviewer for deletion, reuse, deduplication, state simplification, and public-surface narrowing while retaining unique critical/compatibility oracles.
- `test-coverage-reviewer`: task/repro/runtime-envelope coverage, requirement-to-test matrix, missing tests, weak assertions.
- `implementation-readiness-reviewer`: stable scope, decisions, blockers, validation readiness.
- `openspec-architecture-reviewer`: architecture/OpenSpec consistency and ownership risks.
- `rust-concurrency-reviewer`: Rust async/concurrency/backpressure/shutdown risks.
- `performance-reliability-reviewer`: latency, throughput, starvation, overload, recovery evidence.
- `deployment-config-reviewer`: config/deployment readiness and operational safety.
- `protocol-api-reviewer`: framed/client API, schema evolution, correlation, reconnect.
- `implementation-worker`: optional write-capable production-only worker for one evidenced isolated non-overlapping production slice, with scoped production edits, parent raw-output run-observe-correct, and report-only return; never authors automated tests.
- `sdet-quality-engineer`: write-capable test-only SDET for independent risk/oracle assessment and automated-test evidence after applicable proof; never edits production or claims readiness.
- `final-candidate-reviewer`: optional fresh read-only post-MVP risk reviewer; returns an evidence-backed risk matrix and never edits candidate artifacts or approves a stage.
- `troubleshooter`: inherited-model escalation-only problem solver for exceptional blockers, complex bugs, and root-cause investigations after normal agents/tools failed; can run safe experiments, web research, debugging, and permission-gated diagnostic instrumentation; routes production corrections to the production author and test corrections to a fresh SDET.
- `qwen-local-worker`: inherited-model first-pass helper for bounded long-context retrieval, JSON extraction, scoped review, test ideas, planning, and tool-call checks.
- `wire-protocol-reviewer`: byte-level protocol/transport review.
- `legacy-evidence-reviewer`: requirement/design verification against legacy evidence.
- `legacy-client-compatibility-reviewer`: compatibility with legacy clients/tools/workflows.
- `session-completion-arbiter`: hidden no-tool machine adjudicator used only by an explicitly enabled completion guard; returns one exact correlated JSON non-lifecycle verdict from guard-supplied redacted session-delivery evidence.
- `instruction-artifact-reviewer`: read-only review of skills, agents, prompts, `AGENTS.md`, README routing, autonomy handoff, and safety boundaries.

Project plugin behavior:

- `global/plugin/session-env.ts` registers the `session_delivery_context` custom tool for manual diagnostics and exposes the same redacted projection imported by the automatic completion guard, including `todowrite` history and requirement signals reconstructed from transcript parts. It also injects `OPENCODE_SESSION_ID` into shell commands for manual CLI use. The plugin is loaded explicitly from the kit config; the context implementation lives beside `session-env.ts` and does not need a `tools/` directory at runtime.

### Opt-In Session Completion Guard

The kit config loads `global/extensions/opencode-pty-bridge.ts` and `global/extensions/session-completion-guard.ts` from explicit kit-relative file URLs. The bridge and guard share the one pinned `opencode-pty` manager from `global/node_modules`; a second cache-installed PTY plugin must not be enabled. Loading the plugin does not enable grind: every new root starts in `disabled`.

Control is per root and persisted in that root's metadata:

- **`/enable-grind`**: enables completion and question arbitration for the current root after its bounded confirmation turn. That control turn is not audited.
- **`/disable-grind`**: immediately cancels guard-owned audit/retry/fallback intent and prevents later guard side effects for the current root. It does not kill user PTYs/tasks, interrupt the primary response, delete retained evidence, or change sibling roots.

An enabled parentless root reacts to idle events as follows:

- **waiting-async**: deterministic preflight found an awaited PTY, background child, unconsumed task result, unknown lease, compaction, or guard-owned turn. No completion model is called.
- **auditing / audit-retrying**: async state is clear and one retained hidden `session-completion-arbiter` child is evaluating a root-correlated, redacted evidence snapshot. The configured model must return one exact JSON object; invalid JSON, provider failure, or stale correlation has no root side effect and retries with bounded exponential delay.
- **continuing**: one validated `continue` verdict produced one synthetic root continuation under the original root agent/model/variant/tool context.
- **passed**: the unchanged root revision may remain idle. This is not an RC, stable, release, deployment, or external-operation verdict, and it adds no transcript success message.
- **paused**: a real in-flight user interrupt or explicit non-synthetic stop instruction won. A later ordinary human message resumes guard eligibility; synthetic PTY/task/guard text cannot do so.

When TUI toast support is available, status transitions are shown there. The same state and privacy-safe correlation fields are stored in session metadata for headless operation and restart recovery. Local logs use hashed session/audit/PTY refs and bounded redacted error causes; they must not include credentials, prompts, provider options, or full command output.

Operational notes:

- Ordinary conversation needs no action: leave the root disabled. Use `/enable-grind` only when autonomous completion enforcement is wanted, then `/disable-grind` to return to normal chat.
- Main permission defaults are normalized to `allow` by the guard config hook. Explicit specialist-agent restrictions still apply; the hidden arbiter has no registered tools.
- Plugin, agent, dependency, or config changes require a new OpenCode process. Updating kit files does not activate them in an already-running owner session.
- If a root remains `waiting-async`, inspect current `pty_list`, background children, and whether the matching synthetic result/exit notification reached the root. Unknown liveness intentionally remains fail-closed.
- If a root remains `audit-retrying`, verify the profile's arbiter provider/model is connected and available, then inspect the retained child metadata and the owning-boundary error. Do not paste a guessed verdict into the root.
- If a root is `paused`, send a new ordinary human message only when work should resume. An explicit stop instruction keeps the current turn paused.
- Roll back as one coherent version-controlled change: stop OpenCode, restore the previous config/template, dependency graph, profiles, validators, and agent inventory together, reinstall the selected profile, then restart. Do not remove only the guard while leaving a mismatched PTY source or partially migrated routing active.

## Instruction Templates

Global OpenCode agent instructions live in `global/AGENTS.md` and are loaded live once `OPENCODE_CONFIG_DIR` points at `global/`. Project-scoped instruction templates live under `instructions/`:

- `universal-development-loop.md`: one canonical AI-assisted engineering loop for every target project.
- `reusable-project-agent-instructions.md`: project-level `AGENTS.md` baseline.
- `leaf-reviewer-agent-contract.md`: reusable read-only reviewer subagent contract.
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
- Implementation-capable artifacts require observable MVP proof before systematic test design. Material behavior then requires independent fresh critical-only SDET/test authoring with production paths forbidden. Ordinary Small uses focused validation and an optional smallest regression after proof.
- Test strategy targets realistic business and operational failures at real end-to-end boundaries; coverage metrics are diagnostic only, and justified mock exceptions must be explicit.
- Reviewer agents should keep `## Contract Reference`, role-specific inputs/checks/output, ordered findings, residual risks, and non-authorizing `Follow-up Candidates`; do not inline `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback` (shared runtime invariants come from global instructions); mutation-capable tools stay denied except scoped `docs/feedbacks/**` appends through `complain` and explicitly validated bounded exceptions such as `implementation-worker`, `sdet-quality-engineer`, and `troubleshooter`.
- Avoid hardcoded commands and paths. Use placeholders or say to use the repository's configured validation command.
- If a target repository has stricter local instructions, local instructions win.
