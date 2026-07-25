## 0. Baseline And Scope Control

- [x] 0.1 Capture `git status --short`, focused diffs, and ownership for every intended path before mutation. Preserve all unrelated working-tree changes and stop only if they overlap the exact profile, launcher, validator, plugin, package-script, or documentation hunks required by this change.
- [x] 0.2 Run and record the baseline results of `npm run validate:strict`, `npm test`, and `npm run openspec:validate`. Distinguish pre-existing failures from candidate regressions; do not call a failing baseline green.
- [x] 0.3 Record non-billable runtime prerequisites with `opencode --version`, `opencode models`, `opencode debug config`, and representative `opencode debug agent` output. Confirm `openai/gpt-5.6-sol`, `xai/grok-4.5`, `xhigh`, and `high` availability or report the exact local prerequisite gap without invoking either model.

## 1. Profile Assets And Resolution

- [x] 1.1 Add complete schema-shaped presets at `global/model-profiles/quality-independent.json`, `global/model-profiles/sol-only.json`, and `global/model-profiles/grok-only.json`. Encode the exact agent matrices from `library-model-routing`, include every built-in governed role and every `global/agents/*.md` role including hidden Dream Team agents, and keep reusable agent Markdown unchanged.
- [x] 1.2 Add the exact `global/model-profiles/local/*.json` ignore rule without broadening existing ignores. Document and enforce separate `<id>` and `local:<id>` namespaces so local files cannot silently shadow committed presets.
- [x] 1.3 Implement pure profile parsing, restricted-field validation, complete catalog discovery, safe id/path resolution, and stable sorted matrix rendering in a focused `tools/model-profile.ts` module. Reject traversal, escaping/non-regular paths, unsupported fields, malformed model ids/variants, incomplete matrices, and a non-empty inherited `OPENCODE_CONFIG_CONTENT` without printing its value.
- [x] 1.4 Add launch, `--check`, and `--explain` CLI behavior to `tools/model-profile.ts`. Launch mode must set only child-process environment, derive the Dream Team bridge values from the selected profile, forward normal OpenCode arguments, report an explicit differing `--model`, and leave the parent process and all config files unchanged.
- [x] 1.5 Add the `opencode:profile` package script and prove that direct `opencode` startup remains untouched. Do not add dependencies unless existing Node and repository packages cannot satisfy an evidenced requirement.

## 2. Dream Team Routing Bridge

- [x] 2.1 Extend `global/plugin/dream-team-mcp-tool-context.ts` as the sole Dream Team hook owner with profile-aware review and implementation routing. Inject omitted model and compatible variant values, preserve explicit arguments, avoid applying a profile variant to a differing explicit model, and fail before dispatch when an active profile bridge is incomplete.
- [x] 2.2 Add structured informational deviation diagnostics through the existing OpenCode client/logging surface for explicit differing Dream Team model or variant values. Keep diagnostics privacy-safe and preserve all unrelated tool arguments, caller hierarchy checks, relative repo resolution, and review-only `callerSessionId` behavior.
- [x] 2.3 Preserve the no-profile path byte-for-byte where practical: no profile marker means no model/variant injection and existing Dream Team environment/server fallback behavior remains authoritative.

## 3. Runtime Proof To MVP

- [x] 3.1 Use a disposable local fixture project with a deliberately conflicting project `model` and launch OpenCode debug commands through `quality-independent`. Observe the profile top-level model plus one Sol-routed normal agent and one Grok-routed normal agent with the exact variants; correct the launcher/profile path until all observations match.
- [x] 3.2 Exercise the loaded Dream Team tool-context hook at the nearest safe non-billable pre-dispatch boundary for both `dream_team_review` and `dream_team_implement`. Observe explicit profile model/variant arguments, one explicit differing-model override, and the no-profile fallback without starting a Temporal workflow or provider request.
- [x] 3.3 Record the raw commands, environment boundaries, observed model/variant output, fixture disposition, and any exact blocker in implementation evidence. Runtime proof must not use credentials, contact a model provider, mutate remote state, persist environment variables, or alter owner configuration.

## 4. Regression And Validator Coverage

- [x] 4.1 Add `tools/test-model-profile.ts` after Runtime Proof. Cover exact preset matrices, complete catalog coverage, committed/local resolution, no silent shadowing, traversal and non-regular path rejection, restricted fields, inherited-inline refusal, stable explain output, child-only environment construction, argument forwarding, and explicit primary override reporting.
- [x] 4.2 Extend `tools/test-dream-team-mcp-tool-context.ts` for both tools with omitted, matching, differing, explicit-variant, incomplete-bridge, and no-profile cases. Retain all existing hierarchy, mutability, caller-session, repo-path, and sole-hook-owner assertions.
- [x] 4.3 Add a focused model-profile repository validator under `tools/validators/`, register it in `tools/validate-library.ts`, and reuse the existing OpenCode config inspection primitives where appropriate. Validate restricted shape, exact committed matrices, complete current catalog coverage, local ignore policy, and absence of agent-file pins without network or credential checks.
- [x] 4.4 Add fixture-based validator regressions to the existing validator test architecture for malformed JSON, unsupported profile fields, missing/new agents, preset drift, invalid variants/model ids, and a valid local profile. Register new focused tests in `npm test` with no duplicate broad harness.

## 5. Documentation And Configuration Contract

- [x] 5.1 Update README configuration layering and routing guidance with the three base layers versus explicit model overlays, profile commands, restart/new-process semantics, exact preset purposes, `local:` workflow, precedence, explicit override diagnostics, Dream Team behavior, and rollback to direct `opencode` startup.
- [x] 5.2 Update `openspec/project.md` so model profiles are not misidentified as a fourth automatically loaded base config layer. Keep the unsupported-field and machine-local config guidance intact.
- [x] 5.3 Document that `/models`, explicit `--model`, and explicit Dream Team model/variant values can intentionally diverge from the startup profile; name OpenCode's current-model display, profile explain output, Dream Team deviation logs, and agent `Effective Model` evidence as the actual-runtime sources of truth.
- [x] 5.4 Verify documentation and shipped profiles contain no credentials, machine-specific absolute paths, unsupported OpenCode fields, benchmark promises, or claims that profile selection bypasses administrator-managed configuration.

## 6. Candidate Validation And Handoff

- [x] 6.1 Re-run the current candidate's non-billable profile Runtime Proof after all production, test, validator, and documentation mutations. Any red selected-profile happy path returns the candidate to development until corrected and re-proven.
- [x] 6.2 Run `npm run validate:strict`, `npm test`, `npm run instruction:inventory -- --format markdown`, and `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800`. Resolve candidate regressions and record exact pre-existing or non-critical limitations.
- [x] 6.3 Run `npm run openspec:validate` and `npm run openspec:gate -- --operation prepush`. Confirm proposal, design, both capability specs, tasks, implementation evidence, and code remain synchronized.
- [x] 6.4 Use one bounded read-only `deployment-config-reviewer` after MVP to inspect config precedence, reload/restart behavior, local-profile containment, Dream Team propagation, diagnostics, and rollback. Main must reproduce and disposition every risk row; reviewer output never authorizes mutation or stage changes.
- [x] 6.5 Inspect the final focused diff and `git status --short`. Confirm only accepted profile-routing scope changed, all unrelated user work remains preserved, no model credentials or prompts were captured, and no remote/install/activation/release action occurred.
- [x] 6.6 Complete the local handoff with selected-profile Runtime Proof, validation results, effective model/variant evidence, known non-critical limitations, external-operation state, `Development-Stage`, and `Stable Candidate: RC<n>` when stable.
