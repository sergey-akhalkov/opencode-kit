## Why

The repository's own project inventory reports no tests and misses production roots, so broad work begins from a false map. The same audit found proven dead modules and exact helper duplication, while large mixed files require owner-aware decisions rather than line-count refactors.

## Outcome Capsule

- **Outcome**: Project inventory reports this repository and representative layouts accurately, and evidence-proven dead/duplicate maintenance code is removed or reused without changing public CLI, proof, plugin, or workstation behavior.
- **Operating Envelope**: Repository-maintenance tooling and fixtures; root-level `tools/test*.ts`, nested source/test roots, explicit ignored/generated/evidence trees, the named unreferenced `kdco-primitives`, and exact helper candidates; no runtime feature redesign.
- **Non-Goals**: Generic language detection, semantic code scoring, automatic deletion, broad god-file refactors, workstation/guard behavior changes, deduplicating unique proof oracles, or changing inventory public entrypoints.
- **Non-Deferrable Invariants**: Inventory facts derive from explicit files/config, unknown remains unknown, stable output remains privacy-safe, every deletion has zero loader/import/runtime consumers, every reuse preserves errors/output/oracles, and unrelated user work is untouched.
- **Observable Proof**: Inventory finds root-level tests and production owners in this repo plus conventional fixtures, never reports `Test Roots: none` when analyzable tests exist, preserves output stability, removes only zero-consumer primitives, and retains all focused/full/installed proof results.
- **Material Residual Risks**: Heuristic root classification can mislabel unconventional repos; graph absence is not proof of no runtime loading; shared helper extraction can increase coupling; large files may remain justified.
- **Stop Line**: Finish accurate root/test classification, realistic fixtures, zero-consumer deletion, exact low-coupling helper reuse, code-quality inventory readback, and full validation. Leave mixed owner files unchanged unless the current edit adds responsibility or a separately proved split is required.

## What Changes

- Make project inventory classify analyzable root-level code/tests and explicit production roots instead of only conventional directory names.
- Add self-representative fixtures and assertions for this repository, mixed layouts, ignored evidence/vendor trees, and unknown/unreadable inputs.
- Delete the unreferenced `kdco-primitives` modules only after installed loader and repository reference proof.
- Reuse existing exact `hashRef`, `dataOf`, `record`, `exactKeys`, stable-value, required-value, and create-new-file helpers only where contracts and error behavior match.
- Require a reduction matrix and retained unique proof oracle map; line count alone remains non-blocking.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-tools-architecture`: Adds accurate project inventory classification and evidence-bound deletion/reuse behavior for repository-maintenance tooling.

## Impact

- `tools/project-inventory.ts`, inventory tests/fixtures, code-quality inventory evidence, selected proof/validator helpers, dead plugin modules, package scripts/docs, and full validation.
- Large workstation and completion-controller splits remain owned by their behavior changes and are not accepted scope here.

## Implementation Dependencies

- `reconcile-openspec-ownership-and-evidence` must release `library-tools-architecture` and shared validator/operation files before this change becomes mutation-enabled.
- Dead-module and helper work remains blocked until the corrected inventory plus current loader/reference evidence proves the exact candidate subset; the audit table is navigation, not deletion authority.
