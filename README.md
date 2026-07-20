# opencode-dev-kit

[![Validate CI](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/anomalyco/opencode-dev-kit/actions/workflows/validate.yml)

Installable OpenCode development kit for reusable AI-assisted engineering workflows across projects.

## What This Is

`opencode-dev-kit` packages reusable OpenCode skills, read-only reviewer agents with a scoped feedback-ledger write exception, bounded worker agents, project templates, instruction templates, and deterministic helper tools. Its purpose is to make work in other repositories faster, cheaper in tokens, and safer without creating a different workflow for every technology stack.

The kit optimizes one process: understand the original requirements, implement and observably prove the smallest complete happy path, run focused validation, and inspect realistic requirement-linked edge cases. Ordinary Small work stays on that fast path. Material or explicit Change-Ready work adds independent fresh-context SDET risk testing, complete validation, final review, and delivery gates.

## Universal Development Loop

The conceptual development loop lives in the single canonical file `instructions/universal-development-loop.md`. Step list, Token/Time Rules, Quality Defaults, and Output Shape are defined there; kit-level pointer and policy notes live in `docs/universal-development-loop.md`. Technology adapters may change commands and constraints, but not the conceptual loop; `npm run validate` enforces the single-source rule for that loop body.

Ordinary Small routing lives in always-loaded global `AGENTS.md`. Full qualification uses the global skill `change-ready-sdlc` (loaded from the active global config directory via `OPENCODE_CONFIG_DIR`) only for explicit Change-Ready requests, project-required qualification, or concrete Material risk. UDL is conceptual guidance, not a second competing process.

## Contents

- `global/`: OpenCode global config directory pointed to by `OPENCODE_CONFIG_DIR`. Holds `skills/`, `agents/`, `plugin/`, `AGENTS.md`, and `opencode.json` as the single source of truth for global skills, agents, and instructions.
- `docs/feedbacks/`: shared feedback ledger for agent and skill complaints, suggestions, and workflow-friction notes.
- `instructions/`: copyable instruction templates for global/project `AGENTS.md`, reviewer contracts, evidence discipline, and porting.
- `templates/`: project bootstrap and CI templates for applying the Universal Development Loop to another repository.
- `profiles/`: single `all` install manifest covering every reusable skill and agent in the repository.
- `tools/`: TypeScript validation, install, project bootstrap, doctor, inventory, code-quality, `instruction:feedback`, OpenSpec gates, and session-delivery support tooling for this kit.

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

Point OpenCode at this repository as the single source of truth for global configuration. The installer sets the `OPENCODE_CONFIG_DIR` environment variable to the repository `global/` directory instead of copying artifacts into `~/.config/opencode`:

```sh
npm run install:global
```

`global/` is a complete OpenCode global config directory: `global/skills/`, `global/agents/`, `global/plugin/`, `global/AGENTS.md`, and `global/opencode.json`. OpenCode loads all of them directly from there. `global/opencode.json.template` is the committed portable default (compaction, watcher, tool output, `permission: ask`); the installer provisions a local `global/opencode.json` from it on first run. `global/opencode.json` is gitignored — add machine-specific provider/MCP/permission overrides there without touching the shared template. Edit artifacts under `global/` and restart OpenCode; there is no copy or sync step to drift.

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

Important: setting `OPENCODE_CONFIG_DIR` replaces OpenCode's entire global config directory. Anything currently in `~/.config/opencode` (other global agents, commands, skills, plugins, and `opencode.json`) stops loading. Put global provider/MCP/permission config in the local `global/opencode.json` (provisioned from the portable template) so the kit remains the complete global source of truth.

#### Runtime activation rollback

Runtime activation rollback restores only the active config pointer and reloads OpenCode. It does not mutate the repository candidate.

1. Restore the exact prior `OPENCODE_CONFIG_DIR` value you recorded before install.
2. If the prior state was unset, use `npm run install:global -- --unset` (or the matching profile `--unset-script` path) so the variable is removed rather than pointed at an invented path.
3. Restart or reload OpenCode so the restored environment is loaded.
4. Do not treat activation rollback as full change rollback of repository artifacts.

Keep project-specific skills out of `global/` unless their descriptions explicitly scope them to that project. Global skills are visible in unrelated repositories through the skill catalog, so broad or local-product triggers add avoidable routing noise.

### Configuration Layering

The kit uses three OpenCode config files with a documented layering:

- `opencode.json` (repo root) — the workspace config. OpenCode loads this when run inside this repository. Use it for repo-local MCPs (for example the bundled `headroom` MCP) and the workspace-wide `permission: ask` policy.
- `global/opencode.json.template` — the portable safe default that ships with the kit. It declares compaction, watcher, tool output, and `permission: ask`. Never edit this file for machine-specific overrides.
- `global/opencode.json` — the machine-local config (gitignored). Provisioned from `global/opencode.json.template` on first install and editable for local provider, MCP, and permission settings.

The validator identifies the machine-local layer by its gitignored `global/opencode.json` path and reports broad local permission overrides as `INFO:` notes. Never add unsupported marker fields to OpenCode config; every field must exist in the official OpenCode schema.

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

Doctor is a structural diagnostic, not full lifecycle readiness certification. Report version 2 separates structural severity (`status: pass|warn|blocked`, process exit) from machine-readable qualification impact (`qualificationStatus: pass|blocked` and per-check `blocksQualification`). Only `qualificationStatus: blocked` / checks with `blocksQualification: true` block Change-Ready qualification. Advisory warnings alone (optional project `opencode.json`, feedback ledger, optional kit default role files, a missing or incomplete alternate validation adapter source when the other source is complete, missing machine-local `opencode.json` when the resolved active global directory has complete required authority, or informational notes that the resolved directory is not this checkout) do not block. Active global resolution uses nonblank `OPENCODE_CONFIG_DIR` when set; otherwise the host default `~/.config/opencode`. Required active authority is structurally conforming `AGENTS.md` and `skills/change-ready-sdlc/SKILL.md` at that resolved directory: nonempty regular files with distinct Markdown heading/section structure (not token-packed one-line stubs), YAML-parsed skill frontmatter with exact scalar `name: change-ready-sdlc` and nonempty scalar `description`, and an ordered lifecycle heading skeleton through freeze/proof/SDET/validation/final review/handoff. A complete trusted default or independent copy may pass even when it is not this repository checkout and even without `opencode.json.template`. Empty, malformed, missing-frontmatter, non-scalar/duplicate-key frontmatter, or lifecycle-incomplete authority blocks qualification. Source-path equality and template markers are informational only. Project validation qualification accepts either complete concrete `opencode-dev-kit/adapter.json` validation entries or a complete `opencode-dev-kit/validation.md` Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build. A command is resolved when it is a concrete non-placeholder value, adapter JSON `N/A - <nonempty reason>`, validation.md Command `N/A - <reason>`, or Command `N/A` with a nonempty non-placeholder Notes reason. Bare `N/A`, `unknown`, `TBD`/`TODO`, replace-me / replace-after-discovery, blank, and equivalent placeholders remain unresolved. Missing project bootstrap/AGENTS, neither validation adapter source complete, missing required active authority, invalid explicit/local config (missing regular file, malformed JSON/JSONC, non-object, or `machineOverride`), invalid project path, or required Node do block qualification. Empty `--project=` and whitespace-only `--project` values error instead of silently selecting the current directory. Doctor does not invent validation commands or score lifecycle capability.

Before broad AI work in a target repository, gather a compact deterministic map:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

## Token Economy

- The repository-level maintainer rules live in `REPO_AGENTS.md`. `global/AGENTS.md` is the runtime instruction file OpenCode loads when `OPENCODE_CONFIG_DIR` points at `global/`. Scripts that previously referenced the root `AGENTS.md` must use `REPO_AGENTS.md` instead.
- Use the Universal Development Loop instead of choosing among competing workflows.
- Use `project:inventory`, `code-quality:inventory`, `glob`, and `grep` before broad file reads.
- On native Windows, use `rtk <command>` explicitly for shell-heavy read-only commands; do not rely on hook auto-rewrite.
- Use Headroom MCP tools only on demand for large logs, search results, JSON, or tool outputs; retrieve originals before trusting exact code, errors, or safety-critical details.
- Route Headroom MCP through `tools/headroom-mcp-wrapper.ts` when OpenCode expects MCP prompts; the wrapper adds a small `headroom_usage_policy` prompt and proxies Headroom tools unchanged. Before spawning the child it probes `headroom --version`; when the binary is missing on `PATH` it prints `error: headroom binary not found on PATH` and exits `2`, and when the probe exits non-zero it prints `error: headroom binary not usable (exit <code>)` and exits `3`. The wrapper never relies on a buried child `error` event, so OpenCode startup fails fast with a deterministic code when Headroom is not usable.
- Install the full kit by default, but load heavyweight skills/subagents only when they reduce total work.
- Ordinary Small production may be implemented directly by the main session. For delegated Material/qualification slices, optional `implementation-worker` covers exact bounded non-overlapping production slices with clear acceptance criteria and a focused validation gate. Keep research, questions, ordinary review-only work, and proven-inert content direct in the main session.
- Run focused validation first; run broad validation when the change crosses boundaries.
- For optional domain reviewers, use one relevant gate by risk instead of launching every domain reviewer; independent final review and Portable Material delivery/readiness gates remain required only when Material/explicit qualification conditions apply.
- Convert repeated manual counting, drift checks, or report assembly into deterministic helpers.

Inspect this kit's instruction context cost with:

```sh
npm run instruction:inventory -- --format markdown
```

### Manual Skills

Manual copy of change-ready lifecycle skills, write-capable lifecycle agents, or reference-based reusable reviewers is incomplete unless the active runtime also loads the shared contracts from `<active-global-config-dir>/AGENTS.md` (Ordinary Small default routing, Material/qualification triggers, Universal Task Briefing Contract, shared reviewer invariants, and feedback-ledger policy). Resolve `<active-global-config-dir>` to `OPENCODE_CONFIG_DIR` when set; otherwise use `~/.config/opencode`. When `OPENCODE_CONFIG_DIR` is set, the default `~/.config/opencode` is bypassed and not loaded. Prefer full-kit install via `OPENCODE_CONFIG_DIR` pointing at `global/`; selective copy alone does not imply standalone completeness. Project-local `.opencode` paths remain allowed and do not replace the active global shared contracts.

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

The same shared-runtime prerequisite as Manual Skills applies: reference-based reviewers and lifecycle agents require the active runtime to load shared contracts from `<active-global-config-dir>/AGENTS.md` (same resolution: `OPENCODE_CONFIG_DIR` when set, otherwise `~/.config/opencode`; override bypasses the default). Prefer full-kit install when using those agents. Project-local `.opencode` agent paths remain allowed and do not replace the active global shared contracts.

OpenCode agents are loaded from project or global agent folders. Copy selected files from `global/agents/` into one of these locations:

- Project: `.opencode/agents/<name>.md`
- Global: `<active-global-config-dir>/agents/<name>.md`

Copy only the agents that are useful for the target project. They are read-only leaf validators or bounded read-only workers by default with a scoped `docs/feedbacks/**` write exception through `complain`; `implementation-worker` and `sdet-quality-engineer` are separately validated write-capable exceptions (production-only and test-only respectively), `troubleshooter` remains an escalation write-capable exception, and `final-candidate-reviewer` is a read-only final gate.

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

The validator checks skill and agent frontmatter shape, skill trigger/output contracts, compact reviewer leaf contracts, README catalog/routing sync, repo/project-template autonomy and remote/destructive guards, TypeScript-only development policy, deterministic helper automation policy, reusable reviewer permission policy, OpenCode config warnings for broad mutation-capable wildcard `allow` permissions, optional project-neutral anchors passed via `--forbidden-anchor`, trailing whitespace, and warning-level workflow findings for implementation artifacts that omit observable happy-path proof and independent risk-driven testing.

This repository validator is a policy and consistency gate, not a complete implementation of the OpenCode JSON Schema. Validate config fields against `https://opencode.ai/config.json` and confirm startup with the real OpenCode loader; repository validation must never invent fields to suppress its own diagnostics.

For code maintainability reviews in this library, gather deterministic file-size/navigation bands with:

```sh
npm run code-quality:inventory -- --format markdown
```

For instruction-artifact context-cost reviews in this kit, gather deterministic Markdown metrics with:

```sh
npm run instruction:inventory -- --format markdown
```

Route reviewer prevention feedback through the deterministic instruction-feedback ledger helper:

```sh
npm run instruction:feedback -- --add <feedback.json>
npm run instruction:feedback -- --pending
npm run instruction:feedback -- --decay-report
npm run instruction:feedback -- --check-bloat --change <change-id>
npm run instruction:feedback -- --replay-pending
```

The helper persists entries, detects exact-match duplicates, enforces replay status transitions, reports stale open/applied entries, and checks one-in-one-out evidence for broad instruction rules. It does not classify prevention cost or draft rule quality.

Use `complain` for lightweight feedback that should be captured. Entries append to `docs/feedbacks/<agent-or-skill-name>.md` and can later be grouped into OpenSpec follow-up analysis when patterns accumulate.

Validate all OpenSpec changes with the first-class package gate:

```sh
npm run openspec:validate
```

Run deterministic operation gates before sensitive OpenSpec lifecycle steps with:

```sh
npm run openspec:gate -- --operation apply --change <change-id>
npm run openspec:gate -- --operation archive --change <change-id>
npm run openspec:gate -- --operation prepush
```

Use `--persist` only when a JSON evidence artifact should be written to `openspec/changes/<change-id>/automation/operation-gates/<operation>.json` from a write-authorized main session. Default operation-gate runs are read-only.

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

The pre-push gate runs `npm run validate`, `npm run openspec:gate -- --operation prepush` when `openspec/` exists, `npm test`, and `npm run openspec:validate`.

To enable the tracked local git hook for this clone, run:

```sh
git config core.hooksPath .githooks
```

Continuous integration runs the same machine-checked gates on every pull request and on push to `main` through `.github/workflows/validate.yml`. CI enforces `npm run validate:strict`, `npm test`, `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`, `npm run instruction:inventory -- --format markdown`, and the conditional OpenSpec steps (`npm run openspec:validate`, `npm run openspec:gate -- --operation prepush`) when `openspec/changes/` is non-empty. Downstream consumers can copy the user-facing template at `templates/ci/github-actions.yml` instead of the kit's own workflow.

For broad instruction-artifact audits, use `instructions/instruction-artifact-audit-runbook.md` to prove repo source, installed state, runtime policy, context-cost metrics, permission semantics, reviewer gates, and non-repo changes. Capture before/after metrics such as global rules line count, top heavy skill line counts, installed-copy drift, validator test count, and reviewer findings.

## Routing Map

Routing and reviewer maps assume the default `all` install profile.

- Explicit planning-only work -> `deep-task-planning`.
- Existing OpenSpec continuation or "what next" work -> `next-step`; consistency work -> `openspec-consistency-review`.
- Several session-scoped follow-ups from an audit, reviewer gate, broad discovery, or validation failure -> group them into lightweight OpenSpec changes when OpenSpec exists or is approved; otherwise return grouped continuation candidates.
- Initial MR/PR title/body preparation -> `merge-request-author`.
- Ordinary Small clear/bounded/local/reversible work -> direct main implementation, observable proof, focused validation; do not load `change-ready-sdlc` merely because behavior changes. Report `Change-Ready: not requested`.
- Explicit Change-Ready, project-required qualification, or concrete Material risk -> load `change-ready-sdlc` before the first mutation.
- Delegated Material/qualification production slices -> discovered conforming production author; optional kit default is `implementation-worker` for exact bounded non-overlapping production slices when installed.
- Material/qualification post-proof systematic test risk/evidence -> fresh `sdet-quality-engineer` when installed.
- Qualification final post-validation candidate review -> `final-candidate-reviewer` when installed.
- Bounded first-pass helper work that benefits from cheap/offline local context, such as long-context retrieval, JSON extraction, scoped review, test ideas, planning, or tool-call checks -> `qwen-local-worker` when the target machine has a configured `qwen-local` provider.
- Exceptional hard blockers, complex bugs, or root-cause investigations where normal agents/tools already failed -> `troubleshooter`; provide prior failed attempts, allowed write scope, forbidden paths, and validation gate.
- Session delivery-control review for historical/current todos, user prompts/detected candidate requirement signals/question replies, changed-file scope, transcript/summary, compaction/resume continuity, and validation output -> `session-delivery-reviewer`.
- Skills, agents, prompts, `AGENTS.md`, and other instruction artifacts -> `instruction-artifact-tuning`; current-session friction notes -> `complain`; for broad audits also use `instruction-artifact-audit-runbook.md`; use `instruction-artifact-reviewer` as the read-only post-change gate.
- Documentation review selection: use `documentation-learning-quest` for guided onboarding, `documentation-hardening-loop` for non-trivial doc/spec hardening, `openspec-consistency-review` for OpenSpec synchronization, and `codebase-audit-loop` only for exhaustive codebase audits.
- Code maintainability/readability after non-trivial implementation, refactoring, large-file navigation, duplication, DRY/SOLID/YAGNI, or design-pattern trade-off work -> `code-quality-audit`; use `code-quality-reviewer` as the read-only gate.

## Reviewer Gate Map

- Instruction artifacts, skills, agents, prompts, `AGENTS.md`, and README routing -> `instruction-artifact-reviewer`.
- Code health, maintainability, readability, file navigation, duplication, boundaries, and pragmatic refactoring -> `code-quality-reviewer`.
- Implementation readiness, stable scope, blockers, validation path -> `implementation-readiness-reviewer`.
- Final post-SDET, post-validation candidate review of the complete current candidate -> `final-candidate-reviewer`.
- Session delivery alignment, historical/current todos, user prompts/detected candidate requirement signals/question replies, changed-file scope, compaction continuity, proportional rigor, missed work, risks, validation/review completeness, and acceptance handoff -> `session-delivery-reviewer`.
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
- Reviewer agents remain read-only for source/config/instruction/spec/task artifacts; their only default write exception is feedback-ledger entries under `docs/feedbacks/**` through `complain`. They recommend OpenSpec follow-up tracking in non-authorizing `Follow-up Candidates`; the main session owns any OpenSpec writes and `next-step` continuation.

## Skill Catalog

### Planning And Workflow

- `change-ready-sdlc`: global instruction artifact for portable full-qualification orchestration (Material/explicit Change-Ready only: profile, brief, Candidate Reference, proof, SDET, validation, final review, Change-Ready decision). Ordinary Small routing lives in always-loaded `AGENTS.md`. Repository support code only validates and distributes this artifact; it does not run the lifecycle.
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

- `code-quality-reviewer`: maintainability/readability reviewer for code smells, file bloat, duplication, boundaries, overengineering, and pragmatic refactoring gates.
- `test-coverage-reviewer`: task/repro/runtime-envelope coverage, requirement-to-test matrix, missing tests, weak assertions.
- `implementation-readiness-reviewer`: stable scope, decisions, blockers, validation readiness.
- `openspec-architecture-reviewer`: architecture/OpenSpec consistency and ownership risks.
- `rust-concurrency-reviewer`: Rust async/concurrency/backpressure/shutdown risks.
- `performance-reliability-reviewer`: latency, throughput, starvation, overload, recovery evidence.
- `deployment-config-reviewer`: config/deployment readiness and operational safety.
- `protocol-api-reviewer`: framed/client API, schema evolution, correlation, reconnect.
- `implementation-worker`: write-capable production-only worker for one bounded non-overlapping production slice, with scoped production edits, observable proof handoff, and report-only return; never authors automated tests.
- `sdet-quality-engineer`: write-capable test-only SDET for independent risk/oracle assessment and automated-test evidence after applicable proof; never edits production or claims readiness.
- `final-candidate-reviewer`: fresh read-only final-candidate reviewer after SDET and complete project-native validation; returns structured verdict only and never edits candidate artifacts.
- `troubleshooter`: GPT 5.6 Sol Xhigh escalation-only problem solver for exceptional blockers, complex bugs, and root-cause investigations after normal agents/tools failed; can run safe experiments, web research, debugging, and permission-gated diagnostic instrumentation; routes production corrections to the production author and test corrections to a fresh SDET.
- `qwen-local-worker`: optional local Qwen3.6 first-pass helper for bounded long-context retrieval, JSON extraction, scoped review, test ideas, planning, and tool-call checks; requires a configured `qwen-local` OpenAI-compatible provider.
- `wire-protocol-reviewer`: byte-level protocol/transport review.
- `legacy-evidence-reviewer`: requirement/design verification against legacy evidence.
- `legacy-client-compatibility-reviewer`: compatibility with legacy clients/tools/workflows.
- `session-delivery-reviewer`: session delivery-control reviewer that uses `session_delivery_context` when available for historical/current todos, user prompts, detected candidate requirement signals, question replies, and permission replies (otherwise continues from supplied readable evidence), then checks semantic goal alignment, changed-file scope, continuity, proportional rigor, missed work, risks, validation/review completeness, and acceptance handoff.
- `instruction-artifact-reviewer`: read-only review of skills, agents, prompts, `AGENTS.md`, README routing, autonomy handoff, and safety boundaries.

Project plugin behavior:

- `global/plugin/session-env.ts` registers the `session_delivery_context` custom tool for current-session delivery evidence, including `todowrite` history and candidate requirement signals reconstructed from transcript parts, and injects `OPENCODE_SESSION_ID` into shell commands for manual CLI use. `global/plugin/dream-team-mcp-tool-context.ts` is the single owner of `dream_team_review` and `dream_team_implement` caller hierarchy validation, repo-path normalization, and review caller-session injection. Both plugins are auto-discovered from `global/plugin/` once `OPENCODE_CONFIG_DIR` points at `global/`; the delivery-context implementation lives beside `session-env.ts` and does not need a `tools/` directory at runtime.

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
- Implementation-capable artifacts require observable proof of the smallest complete happy path before systematic test design. Material/explicit qualification then requires independent fresh-context risk discovery and test authoring with production paths forbidden. Ordinary Small uses focused validation and optional smallest post-proof regression.
- Test strategy targets realistic business and operational failures at real end-to-end boundaries; coverage metrics are diagnostic only, and justified mock exceptions must be explicit.
- Reviewer agents should keep `## Contract Reference`, role-specific inputs/checks/output, ordered findings, residual risks, and non-authorizing `Follow-up Candidates`; do not inline `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback` (shared runtime invariants come from global instructions); mutation-capable tools stay denied except scoped `docs/feedbacks/**` appends through `complain` and explicitly validated bounded exceptions such as `implementation-worker`, `sdet-quality-engineer`, and `troubleshooter`.
- Avoid hardcoded commands and paths. Use placeholders or say to use the repository's configured validation command.
- If a target repository has stricter local instructions, local instructions win.
