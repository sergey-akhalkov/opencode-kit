# Local Implementation Handoff

## Outcome

The instruction inventory now reuses `walkMarkdownFiles`, and the focused
code-quality inventory test now reuses the maintained fixture, process-capture,
and assertion helpers. The two inventory CLIs, their package entry points, and
all four focused code-quality scenarios remain separate and unchanged.

## Candidate Reference

- `tools/instruction-artifacts-inventory.ts`: SHA-256 `283d29f37bbc33d32188de11e4fe16cee1c97ab494a73e67b0aeac810d7d231b`
- `tools/test-code-quality-inventory.ts`: SHA-256 `fd613949cdaa9df831edc601a5ff0e5d1cbd0fe771b77f8bd9354c0796f4c346`
- Scoped numstat: `2/17` and `16/72`, for 18 insertions, 89 deletions, and net `-71` lines.
- `tools/test-helpers/library.ts` is unchanged.
- The attempted scoped diff-text hash is not a candidate identity because the
  read-only reviewer reproduced different values under pager/color transforms;
  the two file SHA-256 values above are the readable Product Candidate identity.

## Deletion And Reuse Targets

- Deleted the private recursive Markdown walker and reused
  `tools/validators/context.ts::walkMarkdownFiles`; this removed one duplicate
  production concept with the same sorted traversal, Markdown filtering, and
  `.git` and `node_modules` exclusions.
- Deleted private temp-directory, text-writing, line-building, process-capture,
  and assertion implementations from `tools/test-code-quality-inventory.ts` and
  reused the existing `tools/test-helpers/library.ts` exports. Scenario argv and
  all unique assertions remain in the focused test owner. No new helper API was
  required.

## Runtime Proof

The Product Candidate was invoked through the installed package entry points.

| Lane | Baseline | Candidate | Result |
| --- | --- | --- | --- |
| `npm run instruction:inventory -- --format json` | exit `0`, 530 normalized lines, SHA-256 `d802a84bc4e70c0931d6e222ed18257362acf3f47e04e054cd67ec09d3b9d647` | exact same exit, line count, and SHA-256 | Green |
| `npm run instruction:inventory -- --format markdown` | exit `0`, 62 normalized lines, SHA-256 `a4318cbc4705527eca61099368c2894c7337811de679588362980bbe5eda909b` | exact same exit, line count, and SHA-256 | Green |
| Invalid root through `npm run instruction:inventory` | exit `1`, 5 normalized lines, SHA-256 `c5b26d266dbd1d6666a52af222df41103840dd832a26e0d60af80f15c6c91d25` | exact same exit, line count, SHA-256, and `Root is not a directory: <redacted>` | Green |
| `npm run test:focused:code-quality` | `OK: code-quality inventory tests=4` | `OK: code-quality inventory tests=4` | Green |

The JSON proof retained tool id
`opencode-dev-kit-instruction-artifacts-inventory`, version `1`, root
`<redacted>`, 58 artifacts, 4,747 lines, 401,996 characters, token proxy
100,519, ordered artifacts, classifications, counts, and repeated-line results.

## Validation

- `npm run test:focused:library`: exit `0`; `OK: library tests=150`.
- `npm run test:focused:code-quality`: exit `0`; `OK: code-quality inventory tests=4`.
- `npm run validate:strict`: exit `0`; 29 skills, 18 agents, 410 Markdown files, zero warnings, two informational permission notes.
- `npm test`: exit `0`; all 11 configured test entry files completed.
- `openspec validate reduce-inventory-tooling-duplication --strict`: exit `0`; change valid.
- `git diff --check`: exit `0`; no output.

## Read-Only Reduction Review

`code-quality-reviewer` session `ses_fff3638adffe9mx21i2ADvWcqi`, effective
model `xai/grok-4.6`, inspected the matching file SHA-256 identities. It reported
high confidence for both behavior-preserving reuse targets, confirmed all four
unique focused oracles, and found no further in-scope runtime reduction. The
review did not execute tests and treated main-session runtime evidence as
supplied evidence only.

## Ordering And Rollback

`measure-loader-visible-instruction-budget` must consume or rebase onto this
shared walker owner after this reduction. Concurrent writers to
`tools/instruction-artifacts-inventory.ts` remain disallowed; any later mutation
of that file or `walkMarkdownFiles` invalidates the three instruction-inventory
proof lanes.

Rollback is a scoped inverse patch that restores only the deleted private walker
and focused-test harness blocks. No data migration, installation, activation,
provider call, or external state requires restoration.

## Residual Risks And External Operations

- Unread external consumers of undocumented output details remain unknown; exact
  installed-entry output identity is the available compatibility evidence.
- The shared `writeText` has agent-fixture synchronization behavior, but it is
  unreachable for the four retained scenarios because they write only TypeScript
  fixture paths.
- External operations: none. No install, activation, release, publication,
  commit, push, or remote mutation was performed.

Development-Stage: MVP
