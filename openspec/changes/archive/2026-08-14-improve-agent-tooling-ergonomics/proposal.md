## Why

OpenCode agents repeatedly consume repository-owned CLIs and structured proof
artifacts, but the loaded instruction contract does not require those interfaces
to be self-discoverable or their mechanical data to come from a reviewable seed.
Current evidence shows repository docs directing agents to unsupported `--help`
and a durable 698-line plan with derived identity fields but no materializer. The
same-model baseline reproduced both decisions. It did not reproduce the observed
ignored-source defect: the current maintained-source clause worked and therefore
remains a no-regression control rather than a new instruction claim.

## Outcome Capsule

- **Outcome:** Make the loaded portable instruction set reliably steer agents to
  side-effect-free help for repeated-use repository CLIs, deterministic
  materialization/validation for mechanically derived structured artifacts, while
  preserving current maintained-source and tiny-one-off behavior.
- **Operating Envelope:** Committed project-neutral OpenCode instructions,
  specialist role deltas, deterministic structural checks, and disposable
  same-model baseline/candidate workflows in synthetic local repositories. No
  target-project, provider-configuration, credential, remote, install, release,
  or protected effect is reachable.
- **Non-Goals:** No `pmac-emulator` source or evidence mutation; no retrofit of
  existing third-party or one-off CLIs; no CLI framework or dependency mandate;
  no blanket ban on manual small JSON, generated evidence, temporary runtime
  state, or scenario-specific disposable output; no line-count threshold; no
  fuzzy helper deciding semantic content.
- **Non-Deferrable Invariants:** Preserve quality/safety -> autonomy -> speed,
  role and test-authority boundaries, protected-action gates, original failure
  causes, unrelated working-tree changes, project-neutral wording, deterministic
  helper contracts, and the current instruction-context ceilings. Help paths are
  effect-free and exit successfully; generators derive only mechanical facts and
  never invent policy or meaning.
- **Observable Proof:** With the same configured model, prompts, disposable
  repository fixtures, and environment, the baseline reproduces failed help and
  code-embedded semantic variants while already passing maintained-source and
  tiny-one-off controls. The candidate produces exit-zero help and a compact
  semantic seed plus deterministic materializer/validator without regressing those
  controls. Structural validation cannot substitute for the behavior evidence.
- **Material Residual Risks:** Model/version sensitivity, repository-local
  instructions, ambiguous classification of a genuinely one-off helper, and
  product code that predates this contract can still limit adherence. This change
  does not repair existing CLI implementations or prove every future agent will
  comply.
- **Stop Line:** Stop after the portable loaded contract, narrow specialist and
  review deltas, structural validation, same-model workflow comparison, README/
  spec synchronization, and local handoff. Product CLI repairs, generic command
  metadata frameworks, target-project migrations, and broad evidence cleanup are
  separate changes.

## What Changes

- Strengthen the existing reusable-tooling and deterministic-helper clauses in
  `global/AGENTS.md` instead of adding another policy chapter.
- Require repository-owned CLIs intended for repeated operator, agent, or proof
  use to expose side-effect-free `--help`/`-h`, complete usage, and exit `0`, while
  teaching callers to stop guessing and use inventory/source/schema when an
  existing CLI does not support help.
- Require the smallest repository-owned deterministic materializer/validator
  before authoring durable structured artifacts with mechanically derived hashes,
  lengths, ordering, mirrored rows, or multiple variants; retain manual authoring
  for small one-off semantic records.
- Retain the current maintained-source rule unchanged because baseline already
  obeyed it; keep source placement and tiny one-off data as no-regression oracles.
- Add one repository-native same-model proof lane using existing process/profile/
  evidence conventions; add no dependency, role authority, or generic framework.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Add portable requirements for repeated-use CLI
  self-discovery, caller fallback, and mechanical structured-artifact generation;
  preserve maintained-source and tiny-one-off behavior as controls.

## Impact

- Primary runtime authority: `global/AGENTS.md` existing reusable-tooling,
  deterministic-helper, and delegation-brief clauses.
- Existing specialist permissions, prompts, and role ownership remain unchanged;
  the always-loaded global contract owns the reproduced decisions.
- Instruction token proxies must not increase from the frozen baseline; the
  inherited normative-ceiling breach is recorded rather than repaired from this
  unrelated scope.
- Behavior evidence: a bounded TypeScript proof runner under `tools/proofs/**`
  extending the existing proof client, baseline/candidate bundle, evaluator, and
  cleanup conventions. Selection is `extend`; registry impact is
  `not-applicable` because the runner validates this kit's loaded instruction
  behavior rather than introducing a shared product capability.
- Public product/API/dependency impact: none. No package dependency, OpenCode
  permission, provider route, credential, installation, or remote behavior changes.
