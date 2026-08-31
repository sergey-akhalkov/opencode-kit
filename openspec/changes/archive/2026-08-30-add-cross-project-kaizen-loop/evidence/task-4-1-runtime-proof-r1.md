# Task 4.1 Runtime Proof

- Candidate: `cross-project-kaizen-loop-kzn-001-r3`
- Environment: `windows-node-24.18.1-opencode-1.18.25-mixed-r3`
- Result: complete at the declared mixed-fidelity ceiling
- Live-attempt gate: clear for the three loaded lanes
- Provider calls: five bounded loopback synthetic calls; zero external provider or network calls
- External effects: none

## Loaded Boundaries

1. `node tools/proofs/cross-project-kaizen.ts --mode loaded-tools --opencode <installed-opencode> --evidence-dir <absolute-loaded-tools-r8>` exited `0`. Pinned OpenCode `1.18.25` loaded the byte-matched R3 plugin, advertised all five Kaizen tools, completed explicit report/status, retained one bounded privacy-safe signal, trapped no egress, changed no worktree, and completed session/server/provider/fixture cleanup.
2. `node tools/proofs/cross-project-kaizen.ts --mode capture-compaction-identity --opencode <installed-opencode> --evidence-dir <absolute-compaction-context-r5a>` exited `0`. The only compaction provider call contained the ordinary prompt and appended Kaizen context; one root-correlated summary/event and one bounded compaction signal completed with no diagnostic.
3. The same compaction command against `<absolute-compaction-context-r5b>` independently exited `0` with the same R3 source/copy identity and terminal cleanup.
4. Provider-free replay of each retained loaded bundle reported `terminalReplay=passed`, `productCandidateReached=true`, `providerReached=true`, `writes=false`, and complete proof-owned cleanup.

## Shared Store And Lifecycle Boundaries

1. `store-boundary` R9 exited `0` against the R3 production store with two disposable Git roots and one isolated data root. It retained two distinct project refs and immutable records, performed zero provider/network calls and zero worktree writes, proved opt-out no-write behavior, and removed its fixture.
2. `archive-boundary` R7 exited `0` through the R3 canonical archive helper path for `captured`, `no-signal`, interrupted `repair-gap`, unavailable checkpoint, and `archive-failed`. Archive movement remained one-way; successful archive state was not reversed or relabeled; failed project validation closed only the Kaizen checkpoint.
3. `triage-boundary` R6 exited `0`, processed a consumer-origin signal, rejected non-owner proposal mutation, created exactly one four-artifact proposal only in the configured owner root, and passed installed strict OpenSpec validation.
4. `population` R5 exited `0`: all 25 canonical ordered members were supported by 27 R3 focused production tests plus fresh archive and triage children, with stable seed readback, fixed capacity facts, zero provider/network calls, and complete fixture cleanup.
5. Both SDET-reproduced absolute-path defects are corrected. The focused privacy oracle and exact provider-free matrix reject Windows drive, slash-drive, POSIX, backslash/forward UNC, `file://`, assignment/JSON/backtick forms, retain no rejected input, and accept HTTP(S) controls.

## Claim Ceiling

The current candidate is source-identified across all rows, and pinned OpenCode directly proves loaded tool and compaction behavior. The two-project shared store, complete archive-harvest outcomes, legacy/complain/status cases, and proposal containment are current provider-free production-module boundaries. The evidence does not claim one monolithic installed process traversed all 25 members in one shared data root, does not activate or restart the user's existing OpenCode process, and does not support unpinned versions or unknown secret formats.

## Artifacts

- `evidence/candidate-composition-r17.json`
- `evidence/task-4-3-sdet-r1.md`
- `evidence/loaded-tools-r8/bundle.json`
- `evidence/compaction-context-r5a/bundle.json`
- `evidence/compaction-context-r5b/bundle.json`
- `evidence/store-boundary-r9/bundle.json`
- `evidence/archive-boundary-r7/bundle.json`
- `evidence/triage-boundary-r6/bundle.json`
- `evidence/population-r5/bundle.json`
