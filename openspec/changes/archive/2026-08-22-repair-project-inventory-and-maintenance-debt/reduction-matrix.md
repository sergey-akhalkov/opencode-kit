# Reduction Matrix

## Zero-consumer primitives

Baseline plugin catalog from `npm run opencode:sources`: `graphify-project-context`, `notify`, `session-env`. Config plugin list names `notify.ts` and `session-env.ts` only. `global/package.json` has no exports. Runtime inventory walks only top-level `plugin/` and `plugins/` files, matching OpenCode local-plugin loading of directory files rather than helper submodules.

| Candidate | Literal | Graph callers | Config/package | Dynamic loader | Runtime source | Decision |
|---|---|---|---|---|---|---|
| `index.ts` | barrel only; no external import | none | not listed | no `import()`/`require` | not a top-level plugin file | delete |
| `get-project-id.ts` | imported only by `index.ts` | none | none | none | not inventoried | delete |
| `log-warn.ts` | imported only by `get-project-id.ts` and `index.ts` | none | none | none | not inventoried | delete |
| `mutex.ts` | imported only by `index.ts` | none | none | none | not inventoried | delete |
| `shell.ts` | imported only by `index.ts` | none | none | none | not inventoried | delete |
| `temp.ts` | imported only by `index.ts` | none | none | none | not inventoried | delete |
| `terminal-detect.ts` | imported only by `index.ts` | none | none | none | not inventoried | delete |
| `types.ts` | imported by `notify.ts` | live | n/a | n/a | helper of notify | retain |
| `cmux.ts` | imported by `notify/cmux.ts` | live | n/a | n/a | helper of notify | retain |
| `with-timeout.ts` | imported by `notify/cmux.ts` | live | n/a | n/a | helper of notify | retain |

Proven delete set: the seven named audit candidates. No unknown/keep-block rows.

## Helper clusters

| Cluster | Compared owners | Contract delta | Decision | Net concept |
|---|---|---|---|---|
| `hashRef` | `redaction.ts` (`prefix_` + 12 hex, empty→`<missing>`), launcher (`kind:` + 16 hex), guard console (parked) | separator, digest length, null handling | keep separate | 0 |
| `dataOf` | launcher local vs exported guard `runtime-support` | bodies match; reuse would couple launcher to guard | keep separate | 0 |
| `record` | guard export, roadmap-mission locals, many proof locals | same null-object test; sharing needs a new proof/runtime util or guard import | keep separate | 0 |
| `exactKeys` | instruction-budget returns boolean; roadmap throws `RoadmapMissionError`; guard throws generic Error | error/return contracts differ | keep separate | 0 |
| `stableValue` | proof runners vs roadmap `contracts.ts` | proof copies skip `record()`; extracting a proof util is out of scope | keep separate | 0 |
| `required` / `requiredValue` | per-CLI argv readers | option names and error text are local | keep separate | 0 |
| `writeNew` | proof-local `wx` writers vs session-executor | creating a shared proof writer is a new util layer | keep separate | 0 |

No high-confidence low-coupling reuse remains after excluding parked guard/workstation/doctor owners and forbidding a generic proof utility.

## split-or-justify

Code-quality inventory after this change: `scannedFiles=160`, status `split-candidate`. This change did not add a responsibility to workstation, guard, or doctor owners; those files stay owner-deferred.

| File | Lines | Disposition |
|---|---:|---|
| `tools/windows/opencode-workstation.ts` | 2479 | split-or-justify; owner-deferred |
| `global/extensions/session-completion-guard/controller.ts` | 1348 | split-or-justify; owner-deferred |
| `tools/doctor.ts` | 1218 | split-or-justify; owner-deferred |
| Other split-candidate proofs/tests/validators | >=800 | split-or-justify; not this change |
| `tools/project-inventory.ts` | 500 | justify: same inventory-owner classifiers |
| `tools/test-library/inventory.ts` | 463 | justify: same fixture/oracle owner |
