# Task 1.3 Provider-Free Inventory CLI Evidence

## Outcome And Ownership

- Decision: `extend`. `global/bin/complexity-foraging-inventory.ts` is the CLI/effect boundary for the task-1.2 contract owner and imports only `global/bin/complexity-foraging-contract.ts` plus Node built-ins. Existing project/code-quality inventories supplied maintained naming/traversal conventions but were not imported because repository-only `tools` are not an installed dependency.
- Candidate: `continuous-complexity-management-cli-r1`.
- Environment: Windows, Node `24.18.1`, provider-free local execution.
- Scope: effect-free help, explicit root, portable reviewed scope, JSON output, exact factual detectors, stable traversal, fallback state, and file/byte/time process bounds. No Markdown, package-script registration, instruction/profile mutation, configured model call, target source mutation, install, network, or remote effect.

## Real Boundary

- Invocation: `node tools/test-complexity-foraging-inventory.ts`.
- Terminal result: exit `0`; stdout `OK: complexity-foraging-inventory help=2 cohesive=1 noisy=2 cleanup=complete`; stderr empty.
- Help: both `--help` and `-h` exit `0`, describe explicit inputs/effects/evidence/privacy/fallback/exit behavior, and leave the source fixture digest unchanged.
- Cohesive scan: support `complete`; exact candidates include component, entrypoint, manifest, proof, public surface, source, and test; root is SHA-256 only; stdout/stderr omit the absolute root.
- Noisy scan: support `complete`; counts retain `corpus=2` and `evidence=1`; excluded roots produce no candidates; two `EXCLUSION_NOT_ABSENCE` diagnostics remain; a second identical invocation is byte-stable.
- Effects and cleanup: the proof synchronously copies checked fixtures to one temporary root, waits for every child process, verifies no project mutation, removes the root in `finally`, confirms absence, and rechecks source fixture digest.
- First attempt: both project scans ran, but the noisy oracle reported `partial` because the walker classified parent `docs` as unknown before reaching explicit exclusion `docs/corpus`. The corrected mechanism traverses ancestors of either reviewed include or exclude entries; the next run passed without weakening the fixture or retrying unchanged logic.

## Raw Evidence

- `implementation-evidence/task-1-3-help.txt`: exact terminal help stdout; stderr empty; status `0`.
- `implementation-evidence/task-1-3-cohesive.json`: exact static-fixture stdout; stderr empty; status `0`.
- `implementation-evidence/task-1-3-noisy.json`: exact static-fixture stdout; stderr empty; status `0`.
- Raw readback command correlated all three retained files byte-for-byte with fresh entrypoint stdout and reported `OK: complexity-foraging-raw-bundles files=3`.
- Contract readback: `node tools/test-complexity-foraging-contract.ts` exits `0` with `valid=8 invalid=7`.

## Validation And Review

- `node --check global/bin/complexity-foraging-inventory.ts`: exit `0`.
- `node --check tools/test-complexity-foraging-inventory.ts`: exit `0`.
- `npm run validate:strict`: exit `0`, skills `32`, agents `21`, markdown `870`, warnings `0`, infos `2`.
- `openspec validate add-continuous-complexity-management --strict --no-interactive`: valid.
- Apply operation gate: exit `0`; declaration and compact falsification record pass; semantic readiness remains unknown.
- All-mode change inventory: exit `0`; no ownership cycle or unresolved downstream overlap.
- Code-quality inventory: CLI `495` lines and contract `475` lines, both attention and below split-candidate. `split-or-justify=justify`: contract owns closed schema/parser/serialization; CLI owns args/help/traversal/classification/detection/rendering/error boundary. Neither mixes a third responsibility.
- Fresh read-only reduction review: session `ses_fbde37b26ffefiYWzBodGK9dKC`, effective model `xai/grok-4.6`, reduction `none`; the two walkers differ by per-entry classification versus one inherited excluded class, and combining them would add mode state.
- Serena's one local nullable-text diagnostic was corrected through an explicitly narrowed `content` value. Remaining diagnostics are repository-wide missing Node ambient/library declarations (`node:*`, `process`, `replaceAll`); actual Node entrypoints and syntax checks pass. No editor-only dependency was added.

## Claim Ceiling

The exact provider-free CLI path gathers and renders stable privacy-safe facts for the cohesive and reviewed noisy fixture roots only. No loaded skill/workflow, semantic map or rehearsal, same-scenario refactor, configured population member, PMAC case, or real oracle is implemented or supported yet.
