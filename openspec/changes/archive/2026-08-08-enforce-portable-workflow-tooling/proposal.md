# Change: Enforce Portable Workflow Tooling

## Why

The kit exists to carry a standard quality, speed, and token-economy workflow into unrelated projects. Two proven improvements still lack a portable product path: complete archive relies on model-authored spec synchronization, and exact staged-candidate validation requires an improvised repository-specific procedure. Repository maintainer guidance also describes project neutrality without making reusable core plus thin project adapters an explicit invariant for every shipped workflow tool.

## Outcome Capsule

- **Outcome**: Any project using the kit can invoke deterministic complete OpenSpec archive and exact staged-candidate validation through portable TypeScript tools, while repository maintainers keep shipped tools project-neutral and agents switch strategy instead of repeating stalled attempts.
- **Operating Envelope**: Local Git repositories and OpenSpec 1.6-compatible roots; explicit project roots, project validation argv, and optional ignored dependency reuse paths; local or registered OpenSpec stores selected explicitly.
- **Non-Goals**: Installing dependencies, guessing project validation commands, supporting non-Git staged validation, changing OpenSpec delta semantics, retrofitting unrelated product code, committing, pushing, or performing remote operations.
- **Non-Deferrable Invariants**: Unchecked/incomplete changes cannot be archived through `--yes`; spec updates are performed only by the official deterministic OpenSpec implementation; staged validation never reads unstaged source as candidate content; unrelated working-tree changes and reused dependency directories remain unmodified; project-specific commands stay outside reusable cores; materially similar stalled strategies are recorded and not repeated without new evidence.
- **Observable Proof**: Disposable unrelated project fixtures show deterministic archive synchronizing and moving a complete delta, blocking an incomplete change without side effects, staged validation observing index content instead of conflicting worktree content, cleanup preserving the source repository, and a compaction workflow switching away from a recorded stalled strategy.
- **Material Residual Risks**: Official OpenSpec deterministic merge rejects partial `MODIFIED` deltas that omit existing scenarios; post-archive project validation can detect a red integrated state after OpenSpec has moved the change; explicit reused ignored paths remain trusted local dependencies.
- **Stop Line**: Stop after the two portable tools, thin kit adapters, maintainer portability contract, representative runtime proof, critical-only SDET, and current validation are complete; do not refactor unrelated existing tools.

## What Changes

- Add project-neutral TypeScript workflow tools under explicit non-loader `global/bin/` for deterministic OpenSpec archive and staged-index validation.
- Replace archive command/skill manual delta application and directory moves with the official OpenSpec CLI result.
- Add thin package adapters for this kit without baking npm into the reusable cores.
- Strengthen `REPO_AGENTS.md` so every shipped workflow tool uses a portable core and explicit project adapter boundary.
- Add a compaction anti-stagnation contract and per-change `history.md` strategy ledger so later sessions switch mechanisms rather than repeat failed approaches.
- Extend specifications and deterministic repository validation for the portable tooling contract.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `library-tools-architecture`: Require portable core/tool adapters, deterministic complete archive, and exact staged-candidate validation.
- `library-instruction-artifacts`: Require repository maintainer authority to enforce portability for all shipped workflow tools.
- `library-config-portability`: Make reusable global workflow tools discoverable with the kit config source in unrelated projects.
