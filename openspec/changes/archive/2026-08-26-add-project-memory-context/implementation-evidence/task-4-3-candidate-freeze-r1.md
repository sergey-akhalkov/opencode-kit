# Task 4.3 Candidate Freeze R1

- Recorded at: `2026-08-25T22:41:27.4112317Z`.
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Environment: `windows-node24.18.1-opencode1.18.23-pmc-freeze-r1`.
- Operating boundary: provider-free maintained corpus and full-envelope scan plus pinned OpenCode `1.18.23` loaded loopback-provider capture.

## Frozen Identities

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `global/plugin/session-env.ts` | 3,432 | `f209c96c72bb66a00d7b30dc519ede1dbbffc361092327003e059edfb3064b57` |
| `global/plugin/project-memory/index.ts` | 13,526 | `fb5e913bb2aa252f5951bbd24e063a71fc216d26b825ef58ef17a1bc1de3bacd` |
| `global/plugin/project-memory/recall.ts` | 20,785 | `ac7fd1385d9c05493f63bcd5ea5b8bc5edfc984406deff13d3cfcce5cd71850a` |
| `global/plugin/project-memory/records.ts` | 13,308 | `be2c3468a414d923c387776d783893018f196f2d8b4792e49a7ed15e080baae9` |
| `global/plugin/project-memory/store.ts` | 22,575 | `f7d38a38778b1b34bf2369375e42dd7985dc15b70ee6383777bf22403681898e` |
| `tools/proofs/project-memory-context.ts` | 83,740 | `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c` |
| `tools/test-project-memory.ts` | 39,900 | `77cb93ef374e469a5022b8ffb793864ea6aa7f52d33f20f2425c2a0c4ef9df76` |
| `tools/test-project-memory-hooks.ts` | 15,068 | `a98e27dcb9e385d1534d4643a22128b7de75fe3edccf9b564a06a1496220e3c8` |
| `task-4-1-loaded-r2/capture.json` | 430,813 | `ab4558c433dde28d690edde495f4b93345ef5f694fd2356eec87c7b44d835045` |
| `task-4-1-loaded-r2/evaluation.json` | 1,180 | `3ba83f764547bde2358b7a936264c95270030aafb8b379ad8197f5cb2dad60ab` |
| `task-4-1-loaded-r2/raw.json` | 466,322 | `7c21107f539b5d6073e25cc2c7002c2735aa5f609a77e7d2da8629b6cd8bb253` |
| `task-4-2-sdet-r1.md` | 3,742 | `350dad0c4d97fdb9f936cb2fb2bf50cb873c812fe9d8896bcb6a2b3b9ae5f06c` |

## Freeze State

- `npm run test:focused:project-memory` is green after the fresh SDET additions.
- `git diff --check` exited `0`; line-ending warnings concern pre-existing shared-worktree files and are not candidate defects.
- No product, test, runner, or selected runtime-evidence mutation is permitted during the fresh evidence-sufficiency challenge.
- The 22 reviewed members are bound to current candidate/environment/path/boundary lanes in `evidence-index.json`; `PMC-001` remains `unknown` until the fresh challenge is terminal and main dispositions every risk row.
- Unpinned OpenCode versions, unknown secret formats, semantic-only vocabulary matches, behavior beyond the observed process population, stores outside declared limits, cross-project recall, and hosted/vector backends remain excluded.
