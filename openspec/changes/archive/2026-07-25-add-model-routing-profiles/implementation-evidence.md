# Implementation Evidence

## Baseline And Scope

- Candidate state before implementation: `development`.
- `git status --short` showed pre-existing changes outside the accepted profile-routing scope and the untracked `openspec/changes/add-model-routing-profiles/` planning context.
- Focused unstaged and staged diffs for `.gitignore`, `README.md`, `package.json`, `openspec/project.md`, `global/model-profiles/`, `tools/model-profile.ts`, `tools/validate-library.ts`, `tools/validators/`, `global/plugin/dream-team-mcp-tool-context.ts`, and `tools/test-dream-team-mcp-tool-context.ts` were empty before implementation.
- Unrelated working-tree changes remain owner-controlled and must not be modified or reverted.

## Baseline Validation

| Command | Result |
| --- | --- |
| `npm run validate:strict` | PASS: `skills=24 agents=18 markdown=170 warnings=0 infos=1`; the info reports the existing broad machine-local permission configuration. |
| `npm test` | PASS after rerunning with a sufficient timeout. The first attempt returned no test result because the command wrapper reached its 120-second timeout; process inspection confirmed no test runner remained alive before retry. |
| `npm run openspec:validate` | PASS: 9 items passed, 0 failed. |

## Runtime Prerequisites

All checks were local, non-billable debug or inventory commands. No prompt was sent to a provider.

| Command | Observation |
| --- | --- |
| `opencode --version` | `1.17.15` |
| `opencode models` | Includes `openai/gpt-5.6-sol` and `xai/grok-4.5`. |
| `opencode debug config` | Loaded the repository/global configuration and the existing Dream Team tool-context plugin. |
| `opencode debug agent build` | Existing direct-launch behavior resolves the current inherited primary configuration. |
| Ephemeral inline debug for `build` | Resolves `openai/gpt-5.6-sol` with variant `xhigh`. |
| Ephemeral inline debug for `explore` | Resolves `xai/grok-4.5` with variant `high`. |

The inline debug configuration existed only in each command process environment. It did not persist environment variables or modify repository, project, global, machine-local, shell-profile, or managed configuration.

## Initial Runtime Proof

Development stage after this proof: `MVP`. Later candidate mutations require the proof to be repeated.

### Launcher Boundary

The disposable fixture was created under the approved OpenCode temp root with this conflicting project config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-5.5"
}
```

Commands were run with the fixture as the working directory. `<repo>` denotes the current repository root:

```text
node <repo>/tools/model-profile.ts quality-independent -- debug config
node <repo>/tools/model-profile.ts quality-independent -- debug agent build
node <repo>/tools/model-profile.ts quality-independent -- debug agent explore
```

Observed output:

| Boundary | Model | Variant |
| --- | --- | --- |
| Resolved top-level config | `openai/gpt-5.6-sol` | N/A |
| `build` | `openai/gpt-5.6-sol` | `xhigh` |
| `explore` | `xai/grok-4.5` | `high` |

The first Windows launch attempt failed locally with `spawnSync opencode.cmd EINVAL`. The launcher was corrected to invoke the PATH-resolved `opencode` executable without a shell. The repeated `opencode --version` child launch and all three debug commands then passed.

### Dream Team Pre-Dispatch Boundary

The loaded `dream-team.tool-context` plugin hook was invoked with a fake top-level OpenCode session API and an in-memory `client.app.log` collector. No Dream Team MCP server or Temporal workflow was started.

Observed output:

| Call | Effective pre-dispatch routing | Other observation |
| --- | --- | --- |
| `dream_team_review`, omitted routing | `xai/grok-4.5` / `high` | Relative repo resolved; `callerSessionId` injected. |
| `dream_team_implement`, omitted routing | `openai/gpt-5.6-sol` / `xhigh` | Relative repo resolved; no review-only caller id. |
| `dream_team_implement`, explicit `xai/grok-4.5` | Explicit model preserved; variant omitted | One structured `info` deviation log recorded the profile id, tool, profile model, and explicit model. |
| `dream_team_implement`, no profile marker | No model or variant injected | Existing no-profile fallback remained authoritative. |

### Safety And Disposition

- `OPENCODE_CONFIG_CONTENT` and the five non-secret profile bridge variables existed only in child/in-memory process environments.
- No credential was requested, read, printed, or persisted.
- No model prompt, provider request, Temporal workflow, billable action, remote mutation, install, activation, release, or owner-config mutation occurred.
- The disposable fixture file and directory were removed after observation.

## Critical SDET

- Terminal action: `no-critical-risk`.
- Fresh test-only SDET identity: `session_0f16bc68b74e`.
- Effective Model: `openai/gpt-5.6-sol`.
- Test-only changes: `tools/test-model-profile.ts`, `tools/test-dream-team-mcp-tool-context.ts`, `tools/test-library/model-profiles.ts`, `tools/test-library.ts`, `tools/test-helpers/library.ts`, and the exact `package.json` test registration hunk.
- `node tools/test-model-profile.ts`: PASS, 16/16.
- `node tools/test-dream-team-mcp-tool-context.ts`: PASS, 38/38.
- `node tools/test-library.ts`: PASS, 333/333, including 10 focused model-profile validator cases.
- No reachable critical incident was established inside the accepted local launch/debug/pre-dispatch envelope.
- Residual non-critical evidence gaps: host-specific symlink behavior is represented by an injected `realpathSync` escape; launcher spawn and OpenCode client unit tests use doubles. Representative real launcher and loaded-hook boundaries passed Runtime Proof.

## Final Candidate Runtime Proof

After all production, test, validator, and documentation mutations, the disposable conflicting-project proof was repeated with the same child-only environment boundary:

| Boundary | Final observation |
| --- | --- |
| Resolved top-level config | `openai/gpt-5.6-sol` |
| `build` | `openai/gpt-5.6-sol` / `xhigh` |
| `explore` | `xai/grok-4.5` / `high` |
| `dream_team_review` omitted routing | `xai/grok-4.5` / `high`; caller session injected |
| `dream_team_implement` omitted routing | `openai/gpt-5.6-sol` / `xhigh` |
| Explicit differing implementation model | Explicit `xai/grok-4.5` preserved, variant absent, one structured `info` log |
| No profile marker | No model or variant injection |

All boundaries passed. The disposable fixture was removed. No credential, provider request, model prompt, Temporal workflow, remote mutation, persistent environment change, or owner-config mutation occurred.

## Candidate Validation

| Command | Result |
| --- | --- |
| `npm run validate:strict` | PASS: `skills=24 agents=18 markdown=171 warnings=0 infos=1`. The one info is the existing broad machine-local permission configuration. |
| `npm test` | PASS. Includes library 333, model profile 16, Dream Team tool-context 38, contracts 56, and all remaining registered suites. |
| `npm run instruction:inventory -- --format markdown` | PASS: 55 artifacts, 4,266 lines, token proxy 81,571. |
| `npm run code-quality:inventory -- --root . --format markdown --fail-on-split-candidates --attention-lines 400 --split-lines 800` | Non-green inventory status due only to pre-existing split-candidate files; no profile-routing file crossed the 800-line threshold. |

Pre-existing non-critical maintainability limitation, confirmed against `HEAD` line counts:

- `tools/test-library/validator-change-ready.ts`: 2,065 lines at `HEAD` and current candidate.
- `tools/test-library/doctor.ts`: 996 lines at `HEAD`; 1,004 current lines include unrelated owner work.
- `tools/validators/agents.ts`: 971 lines at `HEAD` and current candidate.
- `tools/test-library/validator-2.ts`: 853 lines at `HEAD` and current candidate.
- `tools/test-contracts.ts`: 821 lines at `HEAD` and current candidate.

The profile-routing files reported only in the non-blocking attention band: `tools/test-helpers/library.ts` 653, `tools/test-dream-team-mcp-tool-context.ts` 630, `tools/test-model-profile.ts` 546, and `tools/model-profile.ts` 418. The repository inventory intentionally reports the existing split candidates as non-green; they are out of scope and are parked rather than changed or hidden.

- `npm run openspec:validate`: PASS, 9 items passed and 0 failed.
- `npm run openspec:gate -- --operation prepush`: PASS, operation status `passed`, exit code 0.

## Deployment Configuration Review

One bounded read-only `deployment-config-reviewer` inspected candidate `C1` with Effective Model `openai/gpt-5.6-sol`. Main reproduced and dispositioned every row:

| Risk ID | Reproduction | Main disposition |
| --- | --- | --- |
| `MPR-CFG-001` | A JSON object with duplicate `model` keys parsed successfully and resolved the final value. | Confirmed optional hardening. Owner-authored malformed JSON can be ambiguous, but `--explain` shows the actual resolved value and committed presets still require the exact final matrix. No critical or non-deferrable consequence is reachable; parked. |
| `MPR-LIMIT-002` | A synthetic profile accepted a 100,006-character model id and 100,000-character variant. | Confirmed optional local availability hardening. Failure is limited to the owner-started child process before OpenCode startup, with no persistent or remote side effect; parked. |
| `MPR-DIAG-003` | An invalid selection and malformed explicit model containing a newline remained present in the local error/value path. | Confirmed contained local diagnostic limitation. Input is supplied by the same local owner outside the valid profile/model identifier envelope; no cross-user or remote log boundary is introduced. It does not affect the accepted valid launch path; parked. |
| `MPR-EVID-004` | Official OpenCode config documentation states configs merge, inline config follows custom/project config, non-conflicting keys are preserved, and managed config has highest priority. A disposable live debug used custom `snapshot: false`, project `share: disabled` plus conflicting model, and the profile overlay. Output preserved both sentinels and resolved the profile model. | Evidence gap closed for the accepted envelope. Live managed-config mutation was not performed because it would require owner/admin host configuration; current official precedence remains the source of truth and the documented upstream-change risk remains non-critical. |

Reload/new-process behavior, local namespace containment, Dream Team fail-closed propagation, structured logging, no-profile fallback, and direct-start rollback had no additional review finding.

## Final Scope Inspection

- Intended tracked modifications are limited to `.gitignore`, `README.md`, `openspec/project.md`, `package.json`, `global/plugin/dream-team-mcp-tool-context.ts`, `tools/validate-library.ts`, `tools/test-dream-team-mcp-tool-context.ts`, `tools/test-helpers/library.ts`, and `tools/test-library.ts`.
- Intended new paths are limited to `global/model-profiles/*.json`, `tools/model-profile.ts`, `tools/validators/model-profiles.ts`, `tools/test-model-profile.ts`, `tools/test-library/model-profiles.ts`, and this OpenSpec change directory.
- `git diff --check` passed and the index has no staged changes.
- Focused credential-pattern and machine-specific absolute-path scans found no match in shipped profiles or change evidence.
- Concurrent unrelated owner changes remain in the working tree outside this change. They were not edited, reverted, staged, or incorporated into the profile-routing scope.
- No credentials or prompts were captured. No remote mutation, install, activation, release, commit, push, or managed-configuration change occurred.

## Local Handoff

- **Profile:** Material.
- **Outcome:** working. One launch command selects a complete inspectable normal/Dream Team routing matrix without rewriting config or reusable agent Markdown.
- **Operating envelope:** local OpenCode 1.17.15 launches, Node 24, schema-shaped committed or `local:` profiles, existing loaded Dream Team plugin, and already available providers/models.
- **Non-goals preserved:** no hot reload, semantic routing, provider authentication/install, billing controls, benchmarking, remote execution, or managed-policy bypass.
- **Candidate Reference:** `C1` = Git HEAD `1796dfd1b899ca2877b10bffc1a2beccc9ba5503` plus the intended final profile-routing tracked/new paths listed in Final Scope Inspection.
- **Author routing:** main authored production/docs/validation; fresh SDET `session_0f16bc68b74e` authored only focused tests and returned terminal `no-critical-risk`; one read-only deployment/config reviewer inspected C1 and main dispositioned every row.
- **Runtime Proof:** selected top-level Sol, `build` Sol/xhigh, `explore` Grok/high, review Grok/high, implementation Sol/xhigh, explicit override preservation plus info log, and no-profile fallback all passed at non-billable debug/pre-dispatch boundaries.
- **Validation:** strict validation, full tests, instruction inventory, OpenSpec validation, and OpenSpec prepush gate passed. Code-quality inventory reported only the documented pre-existing split-candidate maintainability debt.
- **Known Non-Critical Limitations:** duplicate JSON keys use last-key parsing; profile/model/variant lengths have no explicit conservative bound; malformed local CLI values may be echoed to the same owner's terminal; real host symlink behavior is represented by an injected realpath test; Node reports the pre-existing typeless global-plugin performance warning.
- **Rollback:** stop using `opencode:profile` and start `opencode` directly. No profile selection or config restoration is persisted.
- **RC history:** first frozen candidate, `RC1`.
- **External Operations:** none. No install, activation, release, publication, deployment, credentials, provider request, billable workflow, remote mutation, commit, or push.
- **Development-Stage:** `stable`.
- **Stable Candidate:** `RC1`.
