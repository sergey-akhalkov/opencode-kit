# Task 2.3 - Portable Helper Resolution

## Reuse Disposition

- Trigger: portable helper resolution already existed inside runtime-source
  diagnostics and appeared in multiple OpenSpec instruction surfaces.
- Sources reached: current repository symbols, runtime-source CLI, portable
  workflow proof runner, and operation-gate source. No cross-project source was
  applicable to this kit-local loader identity.
- Decision: `extend` `tools/opencode-runtime-sources.ts`; no new CLI, package,
  target script, PATH installation, or parallel resolver.
- Contract fit: the existing owner now reports ordered custom/host-default
  attempts, exact helper existence, canonical collision state, selected source,
  and `resolved | missing | blocked` status with privacy-safe evidence.

## Observable Proof

- Runner: `tools/proofs/project-unattended-readiness.ts` through its actual CLI.
- Evidence: `task-2-3-runtime-source-r1/raw.json` and `evaluation.json`.
- Configured-global case: selected
  `<global-source>/bin/openspec-operation-gate.ts`, status `resolved`, collision
  status `clear`.
- Missing-helper case: status `missing`, selected source `null`, with both
  supported attempts retained.
- Canonical-collision case: status `blocked`, selected source `null`, with the
  existing collision evidence retained.
- Unrelated-project gate: the exact configured-global operation gate returned
  aggregate status `passed` for a disposable `helper-proof` change.
- Parent-path regression: no repository-parent `bin` derivation exists in the
  resolver or canonical propose/apply/archive instructions.
- Cleanup: disposable projects and isolated homes removed; immutable evidence
  retained; no model, PMAC, target, install, activation, remote, or protected
  action occurred.

## Validation

- `node tools/proofs/project-unattended-readiness.ts --help`: exit `0`, no effects.
- Runtime proof command: exit `0`, evaluation `status=complete`,
  `cleanup=complete`.
- `npm run opencode:sources -- --root <kit>`: configured helper status
  `resolved`, canonical collision status `clear`.
- `npm run test:focused:openspec-gate`: `11/11` passed.
- `npm run validate`: passed with zero warnings.
- Strict selected OpenSpec validation: passed.
