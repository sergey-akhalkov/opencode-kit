# Task 5.4 Validation

- Candidate: `add-specialist-team-advisor-task-5-1-checkpointed-r9`
- Governed Source: `4f964ad2ed38cc23fe3629c85a9c27210c794985fd16f6a152e0ef5cde94a8cb`
- Environment: `opencode-1.18.25-quality-independent-core-gpt-5.6-sol-xhigh`
- Recorded At: `2026-08-29T06:01:08.5995375+03:00`
- Result: `complete`

## Runtime And Focused Proof

| Check | Result |
| --- | --- |
| `node tools/test-specialist-catalog-plugin.ts` | exit 0; `OK: specialist catalog plugin tests=9` |
| Isolated catalog preflight | exit 0; installed OpenCode `1.18.25`; provider calls 0 |
| `npm.cmd run test:focused:library` | exit 0; `OK: library tests=186` |
| `npm.cmd run test:focused:model-routing` | exit 0; `OK: model profile tests=16` |
| `npm.cmd run test:focused:instruction-context` | exit 0; `OK: instruction context quality tests=15` |
| `npm.cmd run test:focused:consumer-outcome` | exit 0; `OK: consumer outcome tests=39` |
| `npm.cmd run test:focused:install` after fixture correction | exit 0; `OK: install opencode global tests=30` |
| Provider-free `team-advising` replay | exit 0; 18/18 rows passed; `liveCalls=0`; evaluation digest `e66de16b01b018926599e6b9f366e31bee22595cfaed1b9cdd7b5ebe620fe3cd` |
| Generated core loader | exit 0; status passed; advisor status 0; catalog plugin count 1; no permission failures; evaluation digest `8c26af3f4c3765dd94d36da3d69b40706da0fba2ea852c9c0d31e785fde3ebe7` |
| Generated all loader | exit 0; status passed; advisor status 0; catalog plugin count 1; no missing selected agent, command, or plugin; evaluation digest `95ff7b1e7450e0a7e4cf18b1efaafa607ee06f6b0ec0ab55cb3d87ef0dc8264c` |

The first full test invocation exposed copied-installer fixture drift: synthetic profile manifests and templates omitted the newly required specialist-catalog plugin. Production rendering correctly failed closed. The existing fixture owner was extended with the plugin source, manifest entry, and template entry; focused install tests then passed 30/30 and the complete suite was rerun successfully.

## Repository Gates

| Check | Result |
| --- | --- |
| `npm.cmd run instruction:inventory -- --format json` | exit 0; 76 artifacts; embedded context-quality status passed; no changed files or deterministic errors |
| `npm.cmd run instruction:canonicalize -- --format json` | exit 0; 76 files; zero safe fixes; zero deterministic errors; status passed |
| `npm.cmd run validate:strict` | exit 0; skills 33, agents 22, Markdown 971, warnings 0, informational permission notices 2 |
| `npm.cmd test` | exit 0 after fixture correction |
| `openspec.cmd validate add-specialist-team-advisor --type change --strict --no-interactive` | exit 0; selected change valid |
| `openspec.cmd validate --all --strict --no-interactive` | exit 0; 27 passed, 0 failed |
| Blocking apply operation gate | exit 0; status passed; `STA-001=narrowed`; observed 9/9 |
| `git diff --check` | exit 0; line-ending notices only |

A diagnostic `instruction:canonicalize -- --check global` invocation failed because the reviewed repository seed contains cross-file exception members outside the artificially narrowed `global` population. The required whole-repository invocation above uses the maintained scope and passed. No candidate behavior or validation rule was weakened.

## Safety And Cleanup

- Active `global/opencode.json` SHA-256 remained `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`.
- The scoped change-tree private-path scan returned `count=0`.
- The scoped credential-pattern scan found no private-key, provider-token, cloud-key, or bearer-token shape.
- Core and all loader raw records both report `cleanup=complete`; generated config exposes no staging path or unresolved placeholder.
- No `runtime-surface-loader-*` or `team-advising-*` task temp root remains.
- Source presence did not change the active installed config or authorize installation, activation, restart, commit, push, release, deployment, or remote mutation.
- Unrelated campaign-orchestration worktree changes were preserved and excluded from this task's disposition.
