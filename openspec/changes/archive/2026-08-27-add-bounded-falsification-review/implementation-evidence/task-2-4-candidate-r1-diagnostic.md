# Task 2.4 Candidate R1 Diagnostic

## Scope

- Candidate lane: `bounded-falsification-review-v1/coherent-wrong-outcome`.
- Product Candidate: governed loaded source digest `d6d7dcfba687a51f38b5df249de4a32e1be1ba11379cd6f7c9629d17ec8cb80f`.
- Proof Runner: selected configured capture in `tools/proofs/consumer-outcome-regression.ts` and `tools/proofs/consumer-outcome/capture.ts`.
- Evaluator: bounded-falsification path in `tools/proofs/consumer-outcome/evaluate.ts`, digest `3b7b5bd45c91f6d06c66aa565b96c733d0b678ce85437e84f1c6801230ad0317`.
- Raw Evidence Bundle: `candidate-sessions/bounded-falsification-candidate-coherent-wrong-outcome-r1/bundle.json`.

## Observed Facts

- The configured primary request exited zero and launched one fresh readiness child.
- The child attempted all six required attack classes, admitted one current reachable
  CSV-versus-JSON wrong-outcome finding, proposed the smallest JSON/importer-oracle
  correction, and returned no optional or invented rows.
- The primary wrote `decision.json`, but used intermediate values such as
  `semanticReadiness=failed` and `terminalState=material-finding`; the checker permits only
  current terminal values and rejected the record before evaluator parsing.
- The fixture contains only an immutable prose description of the candidate artifact.
  The primary had no artifact file on which to apply the required correction, while the
  request said to write only reviewed decision fields.
- Baseline and candidate selected-case content is equal at normalized digest
  `27a51273ef76aeb3de6864d92e8d8df0221caf75a36a7e167f22880e8ecc980e`.
  Only `material-inline-plan` changed in the shared `cases.json`, but the environment
  comparator uses one full-fixture digest and therefore blocked this selected member.
- Cleanup is complete. The terminal provider-free replay made zero live calls and
  reproduced the same two failure reasons.

## Cause Table

| Symptom | Proximate trigger | Missed guard | Likely root cause | Recurrence path | Confidence |
|---|---|---|---|---|---|
| `environment:initialFixtureDigest` | An unrelated case row changed after baseline capture | Selected-pack tests rewrite scenario identity but never test member-scoped fixture identity | Shared multi-member fixture identity is used at a selected-member comparison boundary | Any correction to one case invalidates every preserved member | high |
| `malformed-observation` | The primary wrote a truthful intermediate finding record outside terminal schema | Provider-free tests write hidden expected records directly rather than asking the configured actor to discover and produce them | The proof fixture has no mutable correction surface and hides exact record conventions while requesting terminal correction behavior | Configured actors can find the defect but cannot demonstrate the required correction/closure path | high |

## Root Cause Records

- **BFR-PROOF-001**: `confirmed`. The owning selected-member environment oracle is scoped
  to the shared fixture rather than the selected member. Counterfactual guard: a test in
  which only another member changes must retain this member's initial-state identity while
  a selected-member change must block.
- **BFR-PROOF-002**: `confirmed`. Synthetic checker tests bypass actor discoverability and
  correction by materializing the expected terminal JSON themselves. Counterfactual
  guard: the configured path must receive a real mutable candidate artifact and a
  discoverable record contract through the loaded propose route, and must produce the
  corrected artifact plus terminal record without evaluator semantic rewriting.

## Fix Direction

- Keep the current runner; do not add a second harness.
- Give the first scenario a dedicated actor-visible fixture containing `case.json`, a
  mutable `candidate.md`, and its checker. Capture hashes exactly those bytes; do not add
  a comparator exception or derive a new environment identity for preserved r1.
- Keep the existing configured build invocation and exact permission envelope. Exercise
  the loaded main bounded-episode routing used by propose, not literal `/opsx-propose`
  command execution. `case.json` supplies the original request and a discoverable reviewed
  record/correction contract to main, but main must omit the expected disposition from the
  fresh child brief and independently reproduce the represented finding before using it.
- Treat frozen r1 as separately identified historical characterization. Task 2.4's next
  proof is candidate establishment only; a non-matched historical comparison remains
  blocked and supports no causal improvement or substitution claim.
- Add provider-free regression cases for unrelated-member drift, selected-member drift,
  hidden/non-discoverable terminal fields, absent correction, and evaluator refusal to
  manufacture semantic closure.
- Re-run no configured call until all preserved bundles reach the revised terminal replay
  ceiling and a successor live-attempt gate is explicit.

## Claim Ceiling

The r1 bundle supports only this narrow observation: under the recorded configured model
and candidate source, the root launched the expected readiness owner and the reviewer
correctly found the represented material mismatch with complete cleanup. It does not
support matched candidate improvement, corrected artifacts, semantic readiness, task 2.4
completion, or `bounded-falsification-review-v1` claim closure.
