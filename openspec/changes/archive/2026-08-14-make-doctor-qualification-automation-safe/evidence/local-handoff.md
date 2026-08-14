# Local Handoff

## Outcome

The installed `doctor` package-script boundary now exposes explicit structural,
qualification, and unattended diagnostic gates. Each selected gate reports every
named blocker and uses exit `0` for pass, `2` for blocked, and `1` for invalid
arguments or diagnostic execution failure. The no-selector command retains its
informational structural-exit behavior.

Profile: Material

Outcome: working

Development-Stage: MVP

Stable Candidate: none

## Candidate Reference

| Path | SHA-256 |
| --- | --- |
| `tools/doctor.ts` | `0971266478f28fcd14c4c368b1485ebb960a0a991b2ab8bbb7cba52316042348` |
| `tools/opencode-runtime-sources.ts` | `db79a48df05734a79d68a84d0371bc942f9041051b50fa8440216b91d963dc98` |
| `package.json` | `ced3868f841c41cc57ccd8375770f89f8b2b292a576bd516e93543e5559a792e` |
| `tools/proofs/doctor-qualification.ts` | `8266602c68eca6d4c7e216867d8237add70991b70e06689d31cdb51ee06b40bd` |
| `tools/test-library/doctor.ts` | `ab8671930894ac1f576bbdaa187e5f7d5623389d3c5fa51548b4d68298f7f699` |
| `README.md` | `cb342340e49a42ae6f5a7177accd858cbc8a069f2056dde655160662256e8a50` |
| `docs/getting-started.md` | `eb938bae89e089d995b4a7f86f88d8022ce7e92e112962c034a3798cedbd0e4c` |
| `docs/quality-gates.md` | `79f1cf79870e567ab83e405d059907d1b3914c916bbcad4e45f562b59387f4de` |
| `tools/proofs/README.md` | `51f424415d8237e002729faa5b0f64ef664ade3d82ba55c471fb6d16cdea8e70` |

## Runtime Proof

- Boundary: installed `npm run doctor` and `npm run opencode:sources` package
  scripts over controlled custom-global, host-default, and disposable project
  layouts.
- Invocation: `npm run proof:doctor-qualification -- --candidate-id
  doctor-qualification-r1 --evidence-root
  <change>/evidence/runtime-proof-r1`.
- Representative inputs: ready, advisory-warning, missing, multi-blocked,
  additive-layering, and canonical project/global collision layouts.
- Actual result: 11 command lanes produced the expected exits and complete blocker
  arrays; canonical collision details contained both redacted locations; additive
  config/instruction collisions did not block qualification.
- Side effects: before/after project manifests were identical, project validation
  markers were absent, private content and fixture paths were absent from output,
  and cleanup completed.
- Raw Evidence Bundle: `evidence/runtime-proof-r1/raw.json`.
- Evaluator: `evidence/runtime-proof-r1/evaluation.json` reports `status:
  complete` and `cleanup: complete`.
- Live-Attempt Gate: clear. The proof was local, disposable, provider-free, and
  effect-bounded; no failed external or high-cost attempt chain exists.

## Architecture And Diagnostics

- `doctor.ts` retains ownership of CLI parsing, diagnostic policy, report
  rendering, and exit selection. It derives statuses and blocker arrays from the
  same ordered check records.
- `opencode-runtime-sources.ts` now exposes one effect-limited inventory API used
  by both doctor and the richer standalone report. Doctor collision discovery does
  not read config/provider values or duplicate source discovery.
- The maintained proof runner owns capture, evaluation, immutable evidence, and
  deterministic cleanup separately from the Product Candidate.
- Runtime diagnostics preserve exact argv, exit status, stdout, stderr, source
  hashes, side-effect facts, and cleanup in the raw bundle. No relevant exception
  or stderr remained on passing lanes.

## Critical SDET

- Fresh test-only session: `ses_fff728faaffe7pkTRY5bB7JpbZ`.
- Effective Model: `xai/grok-4.6`.
- Terminal action: `no-critical-risk`.
- Added oracles fail on selected-gate fail-open behavior, truncated blocker lists,
  accepted canonical collisions, private sentinel disclosure, and project
  validation marker creation.
- Focused result: `node tools/run-focused-test.ts tools/test-library.ts` exited `0`
  with `OK: library tests=150`.
- The first precondition-valid attempt found no confirmed critical defect, so SDET
  is terminal for this root.

## Validation

- `npm run validate:strict`: exit `0`; `warnings=0`, `infos=2` for existing
  documented broad local/template permissions.
- `npm test`: exit `0`; all 11 suites passed after the focused README contract
  correction.
- `npm run test:focused:contracts`: exit `0`; `contracts tests=67`.
- `openspec validate make-doctor-qualification-automation-safe --strict`: valid.
- `git diff --check`: exit `0`.

## Code Quality

- `npm run code-quality:inventory -- --root . --format markdown
  --attention-lines 400 --split-lines 800` reported the pre-existing
  split-candidate band for `tools/doctor.ts` and
  `tools/test-library/doctor.ts`; `tools/proofs/doctor-qualification.ts` is in the
  attention band.
- Split-or-justify for `tools/doctor.ts`: keep together. The file remains the one
  existing owner of doctor CLI parsing, checks, report rendering, and exit
  selection. This change adds behavior within those responsibilities and imports
  the separate runtime-source inventory owner instead of duplicating discovery or
  adding config-value reads. Splitting the current slice would scatter one gate
  contract or require a wrapper-only module.
- Split-or-justify for `tools/test-library/doctor.ts`: keep together. The file
  remains the one owner of isolated doctor fixtures and doctor behavior oracles.
  The two SDET tests reuse that fixture and retain unique fail-open, collision,
  privacy, and no-execution oracles; extracting them would increase navigation or
  duplicate fixture setup.
- `tools/proofs/doctor-qualification.ts` is a cohesive capture/evaluate/cleanup
  runner for one installed boundary. Its local proof scaffolding does not justify
  a new shared abstraction.
- Fresh read-only reviewer session `ses_fff5fc0c0ffeTOuL290mRZodpB`, Effective
  Model `xai/grok-4.6`, returned `Reduction Matrix: none`; no safe current-scope
  deletion, reuse, or public-surface narrowing was identified.

## Compatibility, Limits, And Rollback

- Compatibility: without `--require`, doctor still bases its process exit on
  structural status. Existing informational callers can therefore continue to
  receive exit `0` while qualification is blocked.
- Limitation: source presence does not prove which same-name source a running
  OpenCode process selected. Canonical collisions fail closed without claiming
  undocumented precedence.
- Limitation: configured instruction globs and managed sources not represented by
  conventional locations still require a separate isolated loader workflow.
- Rollback: remove the explicit gate/report fields, doctor inventory composition,
  standalone CLI argument changes, proof runner, focused oracles, and associated
  documentation. No persisted data, installation, activation, or remote state
  requires migration or restoration.
- Known Non-Critical Limitations: the focused SDET boundary uses isolated copies of
  the real doctor/runtime-source modules; installed package-script wrapping is
  covered by the maintained Runtime Proof instead.
- External Operations: none. No install, activation, provider call, publication,
  release, commit, push, or remote mutation was performed.
