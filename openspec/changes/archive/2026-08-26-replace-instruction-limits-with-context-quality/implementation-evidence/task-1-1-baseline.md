# Task 1.1 Historical Baseline

Captured on 2026-08-26 before the task 1.2 canonicalizer source was added. No budget seed was materialized.

## Candidate And Environment

- Repository: `opencode-dev-kit`
- Branch: `main`, tracking `origin/main`, ahead `0`, behind `0`
- HEAD: `541c71314660b066a0a148e38660a437e6f36925`
- Node: `v24.18.1`
- npm: `11.16.0`
- Package lock schema: `lockfileVersion: 3`
- Active global source used by the operation gate: `D:/home/sergey-akhalkov/opencode-kit/global`

## Active Change Ownership

`node tools/openspec-change-inventory.ts --root . --mode ownership` exited `0`, reported six active changes, no overlap findings, and no cycles. Every change had zero checked tasks at capture. `add-specialist-team-advisor` correctly remained `mutationEnabled: false`; the other five reported no mutation grant rather than inventing one.

The bounded active-change search found current ceiling or removed-budget controls in:

- `add-foundation-integrity-autorecovery`
- `add-bounded-falsification-review`
- `add-continuous-complexity-management`
- `add-specialist-team-advisor`
- `add-autonomous-campaign-orchestration`

Archived references remain historical evidence and are outside rewrite scope.

## Historical Inventory

`npm run instruction:inventory -- --format json` exited `0` with:

- artifacts: `64`
- characters: `415188`
- lines: `5080`
- token proxy: `103817`
- kinds: agents `20`, instructions `9`, roots `2`, skills `31`, templates `2`

## Historical Budget

`npm run instruction:budget -- --format json` exited `0` with status `passed`:

| Boundary | Actual | Maximum |
| --- | ---: | ---: |
| discovery metadata token proxy | 2234 | 2239 |
| global startup token proxy | 11999 | 13279 |
| on-demand bodies token proxy | 66195 | 66244 |
| core startup token proxy | 11999 | 12000 |
| core discovery metadata token proxy | 860 | 1200 |

Core profile identity was `core` with digest `c1bf6785a71fd1b3ed5c9e19cabbc820e91f987a5af57fdd133dd6b361e20389`.

## Validation

- `node global/bin/repo-candidate-snapshot.ts --root . --summary`: exit `0`
- `node tools/openspec-change-inventory.ts --root . --mode ownership`: exit `0`
- `npm run instruction:inventory -- --format json`: exit `0`
- `npm run instruction:budget -- --format json`: exit `0`
- `git diff --check`: exit `0`

The same read-only inventory and budget commands were replayed after the initial dependency/source addition and retained the exact historical measurements above. That replay is a consistency check, not a replacement for the pre-mutation capture.
